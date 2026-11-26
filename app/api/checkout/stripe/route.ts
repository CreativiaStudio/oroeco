import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getServiceSupabase } from "@/lib/supabase";
import {
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_COST,
  getStripeClient,
  isStripeConfigured,
} from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CheckoutItemInput {
  id?: string;
  sku?: string;
  quantity: number;
}

interface CheckoutRequestBody {
  items?: CheckoutItemInput[];
  deliveryMethod?: "shipping" | "pickup";
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    province?: string;
    notes?: string;
  };
  invoice?: {
    requested?: boolean;
    customerType?: "b2c" | "b2b";
    companyName?: string;
    fiscalCode?: string;
    vatNumber?: string;
    sdiCode?: string;
    pec?: string;
  };
}

function cleanStr(val: unknown, max = 140): string {
  return String(val ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function resolveOrigin(req: Request): string {
  const envOrigin = (process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
  if (envOrigin && /^https?:\/\//i.test(envOrigin)) return envOrigin;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  if (host) return `${proto}://${host}`;
  return "https://oroeco.vercel.app";
}

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Gateway pagamenti Stripe in corso di attivazione. Puoi concludere subito il tuo ordine tramite Concierge WhatsApp.",
      },
      { status: 503 },
    );
  }

  let body: CheckoutRequestBody;
  try {
    body = (await req.json()) as CheckoutRequestBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Dati ordine non validi." }, { status: 400 });
  }

  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (rawItems.length === 0 || rawItems.length > 30) {
    return NextResponse.json(
      { ok: false, error: "Il carrello è vuoto o supera il limite articoli per singolo ordine." },
      { status: 400 },
    );
  }

  const deliveryMethod = body.deliveryMethod === "pickup" ? "pickup" : "shipping";
  const firstName = cleanStr(body.customer?.firstName, 60);
  const lastName = cleanStr(body.customer?.lastName, 60);
  const email = cleanStr(body.customer?.email, 120).toLowerCase();
  const phone = cleanStr(body.customer?.phone, 40);
  const address = cleanStr(body.customer?.address, 120);
  const city = cleanStr(body.customer?.city, 80);
  const postalCode = cleanStr(body.customer?.postalCode, 16);
  const province = cleanStr(body.customer?.province, 10).toUpperCase();

  if (!firstName || !lastName || !email || !email.includes("@") || !phone) {
    return NextResponse.json(
      { ok: false, error: "Compila nome, cognome, email valida e telefono per procedere." },
      { status: 400 },
    );
  }

  if (deliveryMethod === "shipping" && (!address || !city || !postalCode)) {
    return NextResponse.json(
      { ok: false, error: "Inserisci indirizzo completo, CAP e città per la spedizione assicurata." },
      { status: 400 },
    );
  }

  // Merge duplicate item entries by sku/id
  const qtyByKey = new Map<string, { id?: string; sku?: string; quantity: number }>();
  for (const item of rawItems) {
    const qty = Math.floor(Number(item?.quantity) || 0);
    if (qty < 1 || qty > 20) {
      return NextResponse.json({ ok: false, error: "Quantità articolo non valida." }, { status: 400 });
    }
    const id = cleanStr(item?.id, 80) || undefined;
    const sku = cleanStr(item?.sku, 80) || undefined;
    const key = id || sku;
    if (!key) {
      return NextResponse.json({ ok: false, error: "Identificativo prodotto mancante." }, { status: 400 });
    }
    const prev = qtyByKey.get(key);
    qtyByKey.set(key, { id, sku, quantity: (prev?.quantity || 0) + qty });
  }

  try {
    const sb = getServiceSupabase();
    const entries = Array.from(qtyByKey.values());
    const ids = entries.map((e) => e.id).filter(Boolean) as string[];
    const skus = entries.map((e) => e.sku).filter(Boolean) as string[];

    const orClauses: string[] = [];
    if (ids.length) orClauses.push(`id.in.(${ids.join(",")})`);
    if (skus.length) orClauses.push(`sku.in.(${skus.join(",")})`);

    const { data: dbProducts, error: dbErr } = await sb
      .from("oroeco_products")
      .select("id,sku,barcode,name,brand_name,price,in_stock,stock_quantity,approval_status,images")
      .or(orClauses.join(","));

    if (dbErr) throw dbErr;

    const rows = dbProducts || [];
    const byId = new Map(rows.map((p) => [String(p.id), p]));
    const bySku = new Map(rows.map((p) => [String(p.sku), p]));

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const metaCart: Array<{ id: string; sku: string; qty: number }> = [];
    let subtotal = 0;

    for (const entry of entries) {
      const prod = (entry.id && byId.get(entry.id)) || (entry.sku && bySku.get(entry.sku));
      if (!prod || prod.approval_status !== "approved") {
        return NextResponse.json(
          { ok: false, error: `Articolo non disponibile per la vendita online (${entry.sku || entry.id}).` },
          { status: 400 },
        );
      }
      if (!prod.in_stock || Number(prod.stock_quantity || 0) < entry.quantity) {
        return NextResponse.json(
          { ok: false, error: `Disponibilità insufficiente per "${prod.name}".` },
          { status: 409 },
        );
      }

      const unitPriceEur = Number(prod.price);
      if (!Number.isFinite(unitPriceEur) || unitPriceEur <= 0) {
        return NextResponse.json(
          { ok: false, error: `Prezzo non valido per "${prod.name}".` },
          { status: 400 },
        );
      }

      subtotal += unitPriceEur * entry.quantity;
      const firstImage = Array.isArray(prod.images) ? prod.images.find((u: string) => /^https?:\/\//i.test(u)) : undefined;

      lineItems.push({
        quantity: entry.quantity,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(unitPriceEur * 100),
          product_data: {
            name: String(prod.name).slice(0, 120),
            description: `${prod.brand_name} · Cod. ${prod.sku}`,
            ...(firstImage ? { images: [firstImage] } : {}),
            metadata: { sku: String(prod.sku), productId: String(prod.id) },
          },
        },
      });

      metaCart.push({ id: String(prod.id), sku: String(prod.sku), qty: entry.quantity });
    }

    const freeShipping = deliveryMethod === "pickup" || subtotal >= FREE_SHIPPING_THRESHOLD;
    const shippingFee = freeShipping ? 0 : STANDARD_SHIPPING_COST;

    if (shippingFee > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(shippingFee * 100),
          product_data: {
            name: "Spedizione Assicurata & Confezione Regalo ORO&CO",
            description: "Corriere portavalori assicurato in tutta Italia",
          },
        },
      });
    }

    const wantsInvoice = Boolean(body.invoice?.requested);
    const customerType = wantsInvoice && body.invoice?.customerType === "b2b" ? "b2b" : "b2c";
    const origin = resolveOrigin(req);
    const stripe = getStripeClient();

    // Compact JSON strings respecting Stripe's 500-char metadata value cap
    const cartMeta = JSON.stringify(metaCart.map((m) => ({ s: m.sku, q: m.qty })));
    const customerMeta = JSON.stringify({
      fn: firstName.slice(0, 40),
      ln: lastName.slice(0, 40),
      em: email.slice(0, 80),
      ph: phone.slice(0, 25),
      ad: address.slice(0, 80),
      ct: city.slice(0, 50),
      cp: postalCode.slice(0, 10),
      pr: province.slice(0, 4),
    });
    const invoiceMeta = wantsInvoice
      ? JSON.stringify({
          inv: 1,
          tp: customerType,
          cn: cleanStr(body.invoice?.companyName, 70),
          fc: cleanStr(body.invoice?.fiscalCode, 20).toUpperCase(),
          vat: cleanStr(body.invoice?.vatNumber, 20),
          sdi: cleanStr(body.invoice?.sdiCode, 10).toUpperCase(),
          pec: cleanStr(body.invoice?.pec, 80).toLowerCase(),
        })
      : JSON.stringify({ inv: 0 });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "it",
      customer_email: email,
      line_items: lineItems,
      billing_address_collection: wantsInvoice ? "required" : "auto",
      allow_promotion_codes: true,
      ...(deliveryMethod === "shipping"
        ? {
            payment_intent_data: {
              shipping: {
                name: `${firstName} ${lastName}`.trim(),
                ...(phone ? { phone } : {}),
                address: {
                  line1: address,
                  city,
                  postal_code: postalCode,
                  ...(province ? { state: province } : {}),
                  country: "IT",
                },
              },
            },
          }
        : {}),
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      metadata: {
        deliveryMethod,
        cart: cartMeta.slice(0, 500),
        customer: customerMeta.slice(0, 500),
        invoice: invoiceMeta.slice(0, 500),
        notes: cleanStr(body.customer?.notes, 200),
      },
    });

    if (!session.url) {
      throw new Error("URL sessione Stripe non restituito.");
    }

    return NextResponse.json({ ok: true, url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("[API Checkout Stripe] Errore creazione sessione:", err);
    const message = err instanceof Error ? err.message : "Errore avvio pagamento Stripe.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
