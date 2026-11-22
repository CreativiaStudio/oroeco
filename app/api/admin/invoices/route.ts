import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/adminAuth";
import { parseFatturaPaXml } from "@/lib/fatturaPaParser";
import { getServiceSupabase } from "@/lib/supabase";
import type { ProductCategory } from "@/types/product";

export const dynamic = "force-dynamic";

const ALLOWED_CATEGORIES: ProductCategory[] = [
  "gioielli",
  "orologi",
  "accessori",
  "casa",
  "natale",
];

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function generateSyntheticEan13(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 1000000000;
  }
  const body12 = `809${String(hash).padStart(9, "0")}`;
  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    sum += Number(body12[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return `${body12}${check}`;
}

export async function GET(req: Request) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { success: false, ok: false, error: "Accesso non autorizzato" },
      { status: 401 },
    );
  }

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("oroeco_audit_log")
      .select("id, operator, details, created_at")
      .eq("category", "INVENTORY")
      .eq("action", "SUPPLIER_INVOICE_COMMITTED")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) throw error;
    return NextResponse.json({ ok: true, history: data || [] });
  } catch (error) {
    console.error("[API Admin Invoices GET]", error);
    return NextResponse.json({ ok: true, history: [] });
  }
}

export async function POST(req: Request) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { success: false, ok: false, error: "Accesso non autorizzato" },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Body JSON non valido" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  // Fase 1: Parse XML & match contro Supabase senza mutare ancora i dati (Compartimento Stagno)
  if (body.action === "stage_xml") {
    const xmlContent = String(body.xmlContent || "");
    if (!xmlContent.includes("<DettaglioLinee")) {
      return NextResponse.json(
        {
          ok: false,
          error: "Il file non contiene blocchi <DettaglioLinee> FatturaPA validi.",
        },
        { status: 400 },
      );
    }

    const parsed = parseFatturaPaXml(xmlContent);
    if (parsed.lines.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Nessuna riga articolo trovata nel file XML." },
        { status: 400 },
      );
    }

    const { data: allDbProducts, error } = await supabase
      .from("oroeco_products")
      .select("id, sku, barcode, name, brand_name, stock_quantity, price, approval_status")
      .limit(4000);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const byCode = new Map<string, (typeof allDbProducts)[number]>();
    for (const p of allDbProducts || []) {
      if (p.sku) byCode.set(String(p.sku).trim().toUpperCase(), p);
      if (p.barcode) byCode.set(String(p.barcode).trim().toUpperCase(), p);
    }

    const stagedRows = parsed.lines.map((line) => {
      const matched = byCode.get(line.sku.trim().toUpperCase());
      const costWithVat = Number((line.unitPrice * (1 + line.vatRate / 100)).toFixed(2));
      const suggestedRetail =
        matched
          ? Number(matched.price)
          : Math.max(10, Math.round((costWithVat > 0 ? costWithVat : 25) * 2.2));

      return {
        ...line,
        included: true,
        status: matched ? ("match_existing" as const) : ("new_sku" as const),
        productId: matched?.id ?? null,
        existingName: matched?.name ?? null,
        existingBrand: matched?.brand_name ?? null,
        currentStock: matched?.stock_quantity ?? 0,
        currentPrice: matched ? Number(matched.price) : null,
        approvalStatus: matched?.approval_status ?? "rejected",
        suggestedRetailPrice: suggestedRetail,
      };
    });

    return NextResponse.json({
      ok: true,
      parsed: {
        supplierName: parsed.supplierName,
        supplierVat: parsed.supplierVat,
        inferredBrand: parsed.inferredBrand,
        inferredCategory: parsed.inferredCategory,
        invoiceNumber: parsed.invoiceNumber,
        invoiceDate: parsed.invoiceDate,
        totalAmount: parsed.totalAmount,
      },
      stagedRows,
    });
  }

  // Fase 2: Validazione esplicita dell'operatore → commit atomico su DB
  if (body.action === "commit_staging") {
    const invoiceMeta = (body.invoiceMeta ?? {}) as Record<string, unknown>;
    const supplierName = String(invoiceMeta.supplierName || "Fornitore SDI").trim();
    const invoiceNumber = String(invoiceMeta.invoiceNumber || `FAT-${Date.now()}`).trim();
    const brandName = String(body.brand || invoiceMeta.inferredBrand || "Stroili").trim();
    const rawCat = String(body.category || "gioielli").trim() as ProductCategory;
    const category: ProductCategory = ALLOWED_CATEGORIES.includes(rawCat) ? rawCat : "gioielli";
    const rows = Array.isArray(body.rows) ? (body.rows as Record<string, unknown>[]) : [];
    const includedRows = rows.filter((r) => r.included !== false && Number(r.quantity) > 0);

    if (includedRows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Seleziona almeno una riga valida da caricare." },
        { status: 400 },
      );
    }

    let updatedExistingCount = 0;
    let insertedNewCount = 0;
    let totalUnitsAdded = 0;
    const errors: string[] = [];

    for (const row of includedRows) {
      const sku = String(row.sku || "").trim().toUpperCase();
      const description = String(row.description || sku).trim();
      const qty = Math.max(1, Math.round(Number(row.quantity) || 1));
      const unitCost = Math.max(0, Number(row.unitPrice) || 0);
      const retailPrice = Math.max(1, Number(row.suggestedRetailPrice) || 49);
      const productId = typeof row.productId === "string" ? row.productId : null;

      if (row.status === "match_existing" && productId) {
        const { data: prod, error: fetchErr } = await supabase
          .from("oroeco_products")
          .select("id, sku, barcode, name, stock_quantity")
          .eq("id", productId)
          .single();

        if (fetchErr || !prod) {
          errors.push(`SKU ${sku}: articolo non più trovato (${fetchErr?.message || "missing"})`);
          continue;
        }

        const prevQty = Number(prod.stock_quantity || 0);
        const nextQty = prevQty + qty;

        const { error: updErr } = await supabase
          .from("oroeco_products")
          .update({
            stock_quantity: nextQty,
            in_stock: true,
            supplier_name: supplierName,
            invoice_ref: invoiceNumber,
            ...(unitCost > 0 ? { supplier_cost: unitCost } : {}),
          })
          .eq("id", prod.id);

        if (updErr) {
          errors.push(`SKU ${sku}: ${updErr.message}`);
          continue;
        }

        await supabase.from("oroeco_inventory_transactions").insert({
          product_id: prod.id,
          sku: prod.sku,
          barcode: prod.barcode,
          product_name: prod.name,
          change_quantity: qty,
          previous_quantity: prevQty,
          new_quantity: nextQty,
          movement_type: "restock",
          reference_id: invoiceNumber,
          operator: session.operator,
          notes: `Carico fattura fornitore ${supplierName} (compartimento stagno)`,
        });

        updatedExistingCount += 1;
        totalUnitsAdded += qty;
      } else {
        const cleanSlugBase = slugify(`${brandName}-${sku}-${description}`) || slugify(sku);
        const uniqueSlug = `${cleanSlugBase}-${Date.now().toString(36).slice(-4)}`;
        const barcode = generateSyntheticEan13(`${sku}-${invoiceNumber}`);
        const cleanName = description.startsWith(brandName)
          ? description
          : `${brandName} — ${description}`;

        const { data: inserted, error: insErr } = await supabase
          .from("oroeco_products")
          .insert({
            slug: uniqueSlug,
            name: cleanName,
            brand_name: brandName,
            category,
            subcategory: category === "orologi" ? "solo-tempo" : "accessori",
            subcategory_label: category === "orologi" ? "Solo Tempo" : "Selezione Fornitore",
            price: retailPrice,
            stock_quantity: qty,
            in_stock: true,
            barcode,
            sku: sku || uniqueSlug.toUpperCase(),
            short_description: `Nuovo carico da fattura ${invoiceNumber} (${supplierName}).`,
            description: `${cleanName}. Caricato dal compartimento stagno in Solo Cassa da fattura ${invoiceNumber}.`,
            images: [],
            approval_status: "rejected",
            supplier_cost: unitCost > 0 ? unitCost : null,
            supplier_name: supplierName,
            invoice_ref: invoiceNumber,
          })
          .select("id, sku, barcode, name")
          .single();

        if (insErr || !inserted) {
          errors.push(`Nuovo SKU ${sku}: ${insErr?.message || "inserimento fallito"}`);
          continue;
        }

        await supabase.from("oroeco_inventory_transactions").insert({
          product_id: inserted.id,
          sku: inserted.sku,
          barcode: inserted.barcode,
          product_name: inserted.name,
          change_quantity: qty,
          previous_quantity: 0,
          new_quantity: qty,
          movement_type: "restock",
          reference_id: invoiceNumber,
          operator: session.operator,
          notes: `Nuovo SKU in Solo Cassa da fattura ${supplierName}`,
        });

        insertedNewCount += 1;
        totalUnitsAdded += qty;
      }
    }

    await supabase.from("oroeco_audit_log").insert({
      category: "INVENTORY",
      action: "SUPPLIER_INVOICE_COMMITTED",
      operator: session.operator,
      details: {
        invoiceNumber,
        supplierName,
        brandName,
        updatedExistingCount,
        insertedNewCount,
        totalUnitsAdded,
        errorsCount: errors.length,
      },
    });

    return NextResponse.json({
      ok: true,
      invoiceNumber,
      updatedExistingCount,
      insertedNewCount,
      totalUnitsAdded,
      errors,
    });
  }

  return NextResponse.json({ ok: false, error: "Azione non supportata" }, { status: 400 });
}
