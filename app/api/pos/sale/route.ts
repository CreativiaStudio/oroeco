import { NextResponse } from "next/server";
import { recordPosSaleDb } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await recordPosSaleDb(body);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("API /api/pos/sale error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
