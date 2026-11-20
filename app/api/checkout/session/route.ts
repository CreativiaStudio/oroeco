import { NextResponse } from "next/server";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = (searchParams.get("session_id") || "").trim();

  if (!sessionId || !/^cs_(test|live)_[a-zA-Z0-9]+$/.test(sessionId)) {
    return NextResponse.json({ ok: false, error: "Identificativo sessione non valido." }, { status: 400 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ ok: false, error: "Gateway Stripe non configurato." }, { status: 503 });
  }

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });

    return NextResponse.json(
      {
        ok: true,
        orderNumber: `WEB-${session.id.slice(-12).toUpperCase()}`,
        status: session.status,
        paymentStatus: session.payment_status,
        amountTotal: (session.amount_total ?? 0) / 100,
        currency: (session.currency || "eur").toUpperCase(),
        customerEmail: session.customer_details?.email || session.customer_email || null,
        deliveryMethod: session.metadata?.deliveryMethod === "pickup" ? "pickup" : "shipping",
        lineItems: (session.line_items?.data || []).map((li) => ({
          description: li.description,
          quantity: li.quantity ?? 1,
          amountTotal: (li.amount_total ?? 0) / 100,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[API Checkout Session GET] Errore:", err);
    return NextResponse.json({ ok: false, error: "Impossibile recuperare l'ordine." }, { status: 404 });
  }
}
