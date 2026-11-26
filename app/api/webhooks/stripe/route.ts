import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { recordPosSaleDb } from "@/lib/db";
import { getStripeClient } from "@/lib/stripe";
import { getServiceSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeJsonParse<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function POST(req: Request) {
  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();
  const sig = req.headers.get("stripe-signature") || "";

  if (!webhookSecret || !sig) {
    return NextResponse.json(
      { ok: false, error: "Firma webhook Stripe o segreto mancante." },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Verifica firma fallita:", err);
    return NextResponse.json({ ok: false, error: "Firma webhook non valida." }, { status: 400 });
  }

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true, status: session.payment_status });
  }

  try {
    const sb = getServiceSupabase();
    const saleNumber = `WEB-${session.id.slice(-12).toUpperCase()}`;

    // Idempotency guard: avoid duplicate stock depletion if Stripe retries webhook delivery
    const { data: existingSale } = await sb
      .from("oroeco_sales")
      .select("id,sale_number")
      .eq("sale_number", saleNumber)
      .maybeSingle();

    if (existingSale) {
      return NextResponse.json({ received: true, duplicate: true, saleNumber });
    }

    const custMeta = safeJsonParse<Record<string, string>>(session.metadata?.customer, {});
    const invMeta = safeJsonParse<Record<string, string | number>>(session.metadata?.invoice, {});
    const cartMeta = safeJsonParse<Array<{ s: string; q: number }>>(session.metadata?.cart, []);

    const customerEmail = (
      custMeta.em ||
      session.customer_details?.email ||
      session.customer_email ||
      ""
    )
      .trim()
      .toLowerCase();
    const wantsInvoice = Number(invMeta.inv) === 1;
    const vatNumber = String(invMeta.vat || "").trim() || null;
    const fiscalCode = String(invMeta.fc || "").trim().toUpperCase() || null;
    const customerType: "b2c" | "b2b" =
      wantsInvoice && invMeta.tp === "b2b" && (vatNumber || fiscalCode) ? "b2b" : "b2c";

    // Resolve or upsert customer in oroeco_customers
    let customerId: string | undefined;
    if (customerEmail || fiscalCode) {
      const lookupQuery = customerEmail
        ? sb.from("oroeco_customers").select("id,total_sales_count,total_spent").eq("email", customerEmail).limit(1)
        : sb.from("oroeco_customers").select("id,total_sales_count,total_spent").eq("fiscal_code", fiscalCode!).limit(1);

      const { data: existingCusts } = await lookupQuery;
      const totalAmountEur = Number(((session.amount_total ?? 0) / 100).toFixed(2));

      if (existingCusts && existingCusts.length > 0) {
        const cust = existingCusts[0];
        customerId = cust.id;
        await sb
          .from("oroeco_customers")
          .update({
            first_name: custMeta.fn || undefined,
            last_name: custMeta.ln || undefined,
            phone: custMeta.ph || session.customer_details?.phone || undefined,
            address: custMeta.ad || undefined,
            city: custMeta.ct || undefined,
            postal_code: custMeta.cp || undefined,
            province: custMeta.pr || undefined,
            fiscal_code: fiscalCode || undefined,
            vat_number: vatNumber || undefined,
            company_name: String(invMeta.cn || "").trim() || undefined,
            sdi_code: String(invMeta.sdi || "").trim() || undefined,
            pec: String(invMeta.pec || "").trim() || undefined,
            total_sales_count: Number(cust.total_sales_count || 0) + 1,
            total_spent: Number((Number(cust.total_spent || 0) + totalAmountEur).toFixed(2)),
          })
          .eq("id", cust.id);
      } else if (customerEmail || fiscalCode || vatNumber) {
        const { data: createdCust, error: custErr } = await sb
          .from("oroeco_customers")
          .insert({
            customer_type: customerType,
            first_name: custMeta.fn || session.customer_details?.name || null,
            last_name: custMeta.ln || null,
            company_name: String(invMeta.cn || "").trim() || null,
            fiscal_code: fiscalCode,
            vat_number: vatNumber,
            sdi_code: String(invMeta.sdi || "").trim() || "0000000",
            pec: String(invMeta.pec || "").trim() || null,
            email: customerEmail || null,
            phone: custMeta.ph || session.customer_details?.phone || null,
            address: custMeta.ad || null,
            city: custMeta.ct || null,
            postal_code: custMeta.cp || null,
            province: custMeta.pr || null,
            total_sales_count: 1,
            total_spent: totalAmountEur,
          })
          .select("id")
          .single();

        if (!custErr && createdCust) {
          customerId = createdCust.id;
        }
      }
    }

    // Resolve authoritative product rows for atomic inventory depletion via RPC
    const skus = cartMeta.map((c) => c.s).filter(Boolean);
    const { data: dbProds } = skus.length
      ? await sb.from("oroeco_products").select("sku,barcode,name,brand_name,price").in("sku", skus)
      : { data: [] };

    const prodMap = new Map((dbProds || []).map((p) => [String(p.sku), p]));
    const saleItems = cartMeta.map((entry) => {
      const p = prodMap.get(entry.s);
      return {
        barcode: p?.barcode || entry.s,
        sku: entry.s,
        name: p?.name || `Articolo ${entry.s}`,
        brand: p?.brand_name || "ORO&CO",
        price: Number(p?.price || 0),
        quantity: Math.max(1, Number(entry.q || 1)),
      };
    });

    const totalAmount = Number(((session.amount_total ?? 0) / 100).toFixed(2));
    const subtotal = saleItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const taxableBase = Number((totalAmount / 1.22).toFixed(2));
    const vatAmount = Number((totalAmount - taxableBase).toFixed(2));

    const result = await recordPosSaleDb({
      saleNumber,
      saleType: wantsInvoice ? "fattura_sdi" : "ricevuta_fiscale",
      operator: "E-Commerce",
      paymentMethod: "online",
      subtotal: Number((subtotal || totalAmount).toFixed(2)),
      discountMode: "none",
      discountValue: 0,
      discountAmount: 0,
      taxableBase,
      vatAmount,
      totalAmount,
      cashTendered: totalAmount,
      cashChange: 0,
      items: saleItems,
      customerId,
      sdiIdentifier: session.id,
    });

    return NextResponse.json({ received: true, saleNumber, result });
  } catch (err) {
    console.error("[Stripe Webhook] Errore registrazione vendita:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Errore interno webhook" },
      { status: 500 },
    );
  }
}
