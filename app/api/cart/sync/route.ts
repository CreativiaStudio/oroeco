import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

const N8N_WEBHOOK_URL = "https://n8n.creativiastudio.com/webhook/master-creativia-os";
const OROECO_CLIENT_ID = "eacac2ff-b40b-42f4-8365-ca75eaed6246";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      visitorId,
      consentId,
      email,
      phone,
      items = [],
      subtotal = 0,
      status = "active",
    } = body;

    if (!visitorId) {
      return NextResponse.json({ success: false, error: "visitorId required" }, { status: 400 });
    }

    const sb = getServiceSupabase();

    // Check if an existing active/abandoned cart exists for this visitor
    const { data: existingCart } = await sb
      .from("oroeco_abandoned_carts")
      .select("id, status, synced_to_n8n")
      .eq("visitor_id", visitorId)
      .neq("status", "converted")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let cartId = existingCart?.id;
    let syncedToN8n = existingCart?.synced_to_n8n || false;

    const itemCount = items.reduce((acc: number, curr: any) => acc + (curr.quantity || 1), 0);

    if (cartId) {
      // Update existing cart
      await sb
        .from("oroeco_abandoned_carts")
        .update({
          consent_id: consentId || null,
          email: email || null,
          phone: phone || null,
          items,
          item_count: itemCount,
          subtotal,
          status,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", cartId);
    } else {
      // Insert new cart
      const { data: inserted } = await sb
        .from("oroeco_abandoned_carts")
        .insert({
          visitor_id: visitorId,
          consent_id: consentId || null,
          email: email || null,
          phone: phone || null,
          items,
          item_count: itemCount,
          subtotal,
          status,
          synced_to_n8n: false,
        })
        .select("id")
        .single();

      cartId = inserted?.id;
    }

    // Sync to N8N if contact info exists (email/phone) or cart has substantial value (>150€) and hasn't been synced yet
    const shouldSyncN8n = (email || phone || status === "abandoned") && !syncedToN8n && items.length > 0;

    if (shouldSyncN8n) {
      try {
        const n8nRes = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_slug: "oroeco",
            client_id: OROECO_CLIENT_ID,
            event_type: "abandoned_cart_sync",
            cart_id: cartId,
            visitor_id: visitorId,
            email,
            phone,
            subtotal,
            items_count: itemCount,
            items: items.map((it: any) => ({
              sku: it.product?.sku || it.sku,
              name: it.product?.name || it.name,
              brand: it.product?.brand || it.brand,
              price: it.product?.price || it.price,
              quantity: it.quantity,
            })),
            timestamp: new Date().toISOString(),
          }),
        });

        if (n8nRes.ok) {
          syncedToN8n = true;
          await sb
            .from("oroeco_abandoned_carts")
            .update({ synced_to_n8n: true })
            .eq("id", cartId);
        }
      } catch (n8nErr: any) {
        console.warn("[N8N Abandoned Cart Webhook Error]", n8nErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      cartId,
      syncedToN8n,
    });
  } catch (err: any) {
    console.error("[API Cart Sync Error]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
