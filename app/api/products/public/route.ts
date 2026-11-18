import { NextResponse } from "next/server";
import { getLiveAllApprovedProducts } from "@/lib/liveCatalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = await getLiveAllApprovedProducts();
  return NextResponse.json({ products });
}
