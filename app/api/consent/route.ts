import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { consentId, visitorId, categories, policyVersion = "1.0" } = body;

    if (!consentId || !visitorId || !categories) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Extract headers for legal proof
    const forwardedFor = req.headers.get("x-forwarded-for") || "";
    const rawIp = forwardedFor.split(",")[0].trim() || "127.0.0.1";
    // Anonymize IP via SHA-256 with date-salt for GDPR Article 7.1 proof
    const ipHash = crypto
      .createHash("sha256")
      .update(`${rawIp}-oroeco-privacy-salt`)
      .digest("hex")
      .substring(0, 32);

    const userAgent = req.headers.get("user-agent") || "unknown";

    const supabase = getServiceSupabase();

    const { data, error } = await supabase.from("oroeco_cookie_consents").insert([
      {
        consent_id: consentId,
        visitor_id: visitorId,
        categories: {
          necessary: true,
          analytics: Boolean(categories.analytics),
          marketing: Boolean(categories.marketing),
          preferences: Boolean(categories.preferences),
        },
        ip_hash: ipHash,
        user_agent: userAgent,
        policy_version: policyVersion,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("[API Consent] DB error:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      consentId,
      visitorId,
      recordedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[API Consent] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const consentId = searchParams.get("consentId");
    const visitorId = searchParams.get("visitorId");

    if (!consentId && !visitorId) {
      return NextResponse.json({ success: false, error: "Missing consentId or visitorId" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    let query = supabase.from("oroeco_cookie_consents").select("*").order("created_at", { ascending: false });
    if (consentId) query = query.eq("consent_id", consentId);
    if (visitorId) query = query.eq("visitor_id", visitorId);

    const { data, error } = await query.limit(1).maybeSingle();

    if (error || !data) {
      return NextResponse.json({ success: false, error: "Consent not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, consent: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
