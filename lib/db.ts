import { getServiceSupabase, supabase } from "@/lib/supabase";
import type { Product, Brand } from "@/types/product";

/**
 * Fetch all brands from dedicated Supabase instance.
 */
export async function getDbBrands(): Promise<Brand[]> {
  const { data, error } = await supabase
    .from("oroeco_brands")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error || !data) {
    console.error("Error fetching brands from Supabase:", error);
    return [];
  }

  return data.map((b) => ({
    id: b.id,
    slug: b.slug,
    name: b.name,
    country: b.country,
    description: b.description,
    categories: [],
  }));
}

/**
 * Fetch all products from dedicated Supabase instance.
 */
export async function getDbProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("oroeco_products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Error fetching products from Supabase:", error);
    return [];
  }

  return data.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand_name,
    brandSlug: p.brand_name
      ? p.brand_name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/&/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      : "",
    category: p.category,
    subcategory: p.subcategory,
    subcategoryLabel: p.subcategory_label,
    price: Number(p.price),
    compareAtPrice: p.compare_at_price ? Number(p.compare_at_price) : undefined,
    currency: "EUR",
    images: p.images || [],
    description: p.description || "",
    shortDescription: p.short_description || "",
    inStock: p.in_stock,
    stockQuantity: p.stock_quantity,
    barcode: p.barcode,
    sku: p.sku,
    attributes: p.attributes || {},
    tags: p.tags || [],
    isFeatured: p.is_featured,
    isNew: p.is_new,
    isChristmas: p.is_christmas,
    approvalStatus: p.approval_status || "approved",
    supplierCost: p.supplier_cost ? Number(p.supplier_cost) : undefined,
    markupMultiplier: p.markup_multiplier ? Number(p.markup_multiplier) : undefined,
    supplierName: p.supplier_name || undefined,
    invoiceRef: p.invoice_ref || undefined,
    createdAt: p.created_at,
  }));
}

/**
 * Atomic POS Sale recording & inventory depletion via stored procedure.
 */
export async function recordPosSaleDb(payload: {
  saleNumber: string;
  saleType: "scontrino_rt" | "fattura_sdi" | "ricevuta_fiscale" | "reso";
  operator: string;
  paymentMethod: "cash" | "card" | "split" | "online";
  subtotal: number;
  discountMode: string;
  discountValue: number;
  discountAmount: number;
  taxableBase: number;
  vatAmount: number;
  totalAmount: number;
  cashTendered: number;
  cashChange: number;
  items: Array<{
    barcode?: string;
    sku: string;
    name: string;
    brand: string;
    price: number;
    quantity: number;
  }>;
  customerId?: string;
  lotteryCode?: string;
  rtReceiptNumber?: string;
  sdiIdentifier?: string;
}) {
  const serviceClient = getServiceSupabase();
  const { data, error } = await serviceClient.rpc("oroeco_record_pos_sale", {
    p_sale_number: payload.saleNumber,
    p_sale_type: payload.saleType,
    p_operator: payload.operator,
    p_payment_method: payload.paymentMethod,
    p_subtotal: payload.subtotal,
    p_discount_mode: payload.discountMode,
    p_discount_value: payload.discountValue,
    p_discount_amount: payload.discountAmount,
    p_taxable_base: payload.taxableBase,
    p_vat_amount: payload.vatAmount,
    p_total_amount: payload.totalAmount,
    p_cash_tendered: payload.cashTendered,
    p_cash_change: payload.cashChange,
    p_items: payload.items,
    p_customer_id: payload.customerId || null,
    p_lottery_code: payload.lotteryCode || null,
    p_rt_receipt_number: payload.rtReceiptNumber || null,
    p_sdi_identifier: payload.sdiIdentifier || null,
  });

  if (error) {
    console.error("Error executing oroeco_record_pos_sale:", error);
    throw error;
  }

  return data;
}

/**
 * Aggiorna lo stato di approvazione di un prodotto (approved, rejected, pending_approval).
 */
export async function updateProductApproval(
  id: string,
  status: "approved" | "rejected" | "pending_approval"
) {
  const serviceClient = getServiceSupabase();
  const { data, error } = await serviceClient
    .from("oroeco_products")
    .update({ approval_status: status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating product approval:", error);
    throw error;
  }
  return data;
}

/**
 * Aggiornamento massivo dello stato approvazione/visibilità di più prodotti.
 */
export async function batchUpdateProductApproval(
  ids: string[],
  status: "approved" | "rejected" | "pending_approval"
) {
  const serviceClient = getServiceSupabase();
  const { data, error } = await serviceClient
    .from("oroeco_products")
    .update({
      approval_status: status,
      updated_at: new Date().toISOString(),
    })
    .in("id", ids)
    .select();

  if (error) {
    console.error("Error batch updating product approval:", error);
    throw error;
  }
  return data;
}

/**
 * Approvazione massiva di più prodotti in un'unica transazione.
 */
export async function batchApproveProducts(ids: string[]) {
  return batchUpdateProductApproval(ids, "approved");
}

/**
 * Aggiornamento rapido dettagli prodotto (prezzo, categoria, giacenza).
 */
export async function updateProductDetails(
  id: string,
  updates: {
    name?: string;
    description?: string;
    shortDescription?: string;
    price?: number;
    compareAtPrice?: number;
    category?: any;
    subcategory?: string;
    subcategoryLabel?: string;
    stockQuantity?: number;
    approvalStatus?: "approved" | "rejected" | "pending_approval";
    markupMultiplier?: number;
    supplierCost?: number;
    barcode?: string;
    sku?: string;
    attributes?: Record<string, string>;
    images?: string[];
  }
) {
  const serviceClient = getServiceSupabase();
  const payload: any = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.shortDescription !== undefined) payload.short_description = updates.shortDescription;
  if (updates.price !== undefined) payload.price = updates.price;
  if (updates.compareAtPrice !== undefined)
    payload.compare_at_price = updates.compareAtPrice;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.subcategory !== undefined)
    payload.subcategory = updates.subcategory;
  if (updates.subcategoryLabel !== undefined)
    payload.subcategory_label = updates.subcategoryLabel;
  if (updates.stockQuantity !== undefined)
    payload.stock_quantity = updates.stockQuantity;
  if (updates.approvalStatus !== undefined)
    payload.approval_status = updates.approvalStatus;
  if (updates.markupMultiplier !== undefined)
    payload.markup_multiplier = updates.markupMultiplier;
  if (updates.supplierCost !== undefined)
    payload.supplier_cost = updates.supplierCost;
  if (updates.barcode !== undefined) payload.barcode = updates.barcode;
  if (updates.sku !== undefined) payload.sku = updates.sku;
  if (updates.attributes !== undefined) payload.attributes = updates.attributes;
  if (updates.images !== undefined) payload.images = updates.images;

  const { data, error } = await serviceClient
    .from("oroeco_products")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating product details:", error);
    throw error;
  }
  return data;
}
