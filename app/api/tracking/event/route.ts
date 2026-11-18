import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    if (!rawBody) {
      return NextResponse.json({ success: true, received: false }, { status: 200 });
    }

    const data = JSON.parse(rawBody);
    const { eventName, visitorId, consentId, consentCategories, payload, timestamp, url, referrer } = data;

    // GDPR Hash IP address
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const hashedIp = crypto.createHash("sha256").update(ip).digest("hex");
    const userAgent = req.headers.get("user-agent") || "";

    // If marketing consent is granted and Meta Pixel / CAPI token is present, we could forward to Meta Graph API
    const metaPixelId = process.env.META_PIXEL_ID;
    const metaAccessToken = process.env.META_CAPI_TOKEN;

    if (consentCategories?.marketing && metaPixelId && metaAccessToken) {
      // Async dispatch to Meta Conversions API (fire & forget)
      fetch(`https://graph.facebook.com/v19.0/${metaPixelId}/events?access_token=${metaAccessToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [
            {
              event_name: eventName === "view_item" ? "ViewContent" : eventName === "add_to_cart" ? "AddToCart" : eventName === "begin_checkout" ? "InitiateCheckout" : eventName === "purchase" ? "Purchase" : "CustomEvent",
              event_time: Math.floor(Date.now() / 1000),
              action_source: "website",
              event_source_url: url,
              user_data: {
                client_ip_address: ip,
                client_user_agent: userAgent,
                external_id: [hashedIp],
              },
              custom_data: payload,
            },
          ],
        }),
      }).catch((err) => console.error("[Meta CAPI Error]", err.message));
    }

    return NextResponse.json({
      success: true,
      event: eventName,
      tracked: true,
    });
  } catch (err: any) {
    console.error("[Tracking Event API Error]", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
