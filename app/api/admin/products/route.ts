import { NextResponse } from "next/server";
import {
  getDbProducts,
  updateProductApproval,
  batchApproveProducts,
  batchUpdateProductApproval,
  updateProductDetails,
} from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // 'all' | 'pending_approval' | 'approved' | 'rejected'
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");

    let products = await getDbProducts();

    if (status && status !== "all") {
      products = products.filter((p) => p.approvalStatus === status);
    }
    if (category && category !== "all") {
      products = products.filter((p) => p.category === category);
    }
    if (brand && brand !== "all") {
      products = products.filter((p) => p.brandSlug === brand || p.brand.toLowerCase() === brand.toLowerCase());
    }

    return NextResponse.json({
      success: true,
      total: products.length,
      products,
    });
  } catch (error: any) {
    console.error("[API Admin Products GET] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();

    // 1. Batch status update (Online or Solo Cassa)
    if (body.action === "batch_update_status" && Array.isArray(body.ids) && body.status) {
      const result = await batchUpdateProductApproval(body.ids, body.status);
      return NextResponse.json({ success: true, count: result?.length || 0 });
    }

    // 2. Legacy batch approval
    if (body.action === "batch_approve" && Array.isArray(body.ids)) {
      const result = await batchApproveProducts(body.ids);
      return NextResponse.json({ success: true, count: result?.length || 0 });
    }

    // 3. Single approval
    if (body.action === "update_approval" && body.id && body.status) {
      const result = await updateProductApproval(body.id, body.status);
      return NextResponse.json({ success: true, product: result });
    }

    // 4. Update details (prezzo, ricarico, categoria, giacenza)
    if (body.action === "update_details" && body.id && body.updates) {
      const result = await updateProductDetails(body.id, body.updates);
      return NextResponse.json({ success: true, product: result });
    }

    return NextResponse.json({ success: false, error: "Invalid action or parameters" }, { status: 400 });
  } catch (error: any) {
    console.error("[API Admin Products PATCH] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
