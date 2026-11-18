import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

/**
 * Endpoint Keep-Alive per Supabase.
 * Invocato automaticamente da Vercel Cron (o da un cron esterno) ogni giorno alle 04:00 UTC.
 * Esegue una query leggera sul database dedicato di Oroeco per azzerare il timer di inattività
 * ed evitare la sospensione automatica del piano free Supabase dopo 7 giorni.
 */
export async function GET() {
  const startTime = Date.now();
  try {
    const supabase = getServiceSupabase();
    const { count, error } = await supabase
      .from("oroeco_products")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("[Supabase KeepAlive] Errore query:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const durationMs = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      durationMs,
      productsCount: count,
      message: "Supabase Oroeco keep-alive ping successful. Inactivity timer reset.",
    });
  } catch (err: any) {
    console.error("[Supabase KeepAlive] Eccezione:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
