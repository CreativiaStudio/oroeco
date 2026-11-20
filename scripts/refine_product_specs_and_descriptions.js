require("./_loadEnv");
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function replaceBoutiqueText(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/\bBoutique\b/g, "Gioielleria")
    .replace(/\bboutique\b/g, "gioielleria");
}

function cleanAttributes(product) {
  const attrs = { ...(product.attributes || {}) };
  let changed = false;

  if (product.approval_status === "approved" && "soloCassa" in attrs) {
    delete attrs.soloCassa;
    changed = true;
  }

  if (product.category === "orologi") {
    const existingCase = attrs.caseMaterial || attrs["Materiale cassa"] || attrs.Cassa;
    if (!existingCase) {
      const migrated = attrs.metal || attrs.material || attrs.Materiale;
      if (migrated) {
        attrs["Materiale cassa"] = migrated;
        changed = true;
      }
    }
    if ("metal" in attrs) {
      delete attrs.metal;
      changed = true;
    }
    if ("material" in attrs && attrs["Materiale cassa"]) {
      delete attrs.material;
      changed = true;
    }
    if ("Materiale" in attrs && attrs["Materiale cassa"]) {
      delete attrs.Materiale;
      changed = true;
    }
  } else if (["casa", "natale", "accessori"].includes(product.category)) {
    const existingMat = attrs.material || attrs.Materiale;
    if (!existingMat && attrs.metal) {
      attrs.Materiale = attrs.metal;
      attrs.material = attrs.metal;
      changed = true;
    } else if (attrs.material && !attrs.Materiale) {
      attrs.Materiale = attrs.material;
      changed = true;
    } else if (attrs.Materiale && !attrs.material) {
      attrs.material = attrs.Materiale;
      changed = true;
    }
    if ("metal" in attrs) {
      delete attrs.metal;
      changed = true;
    }
  }

  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === "string" && /boutique/i.test(v)) {
      attrs[k] = replaceBoutiqueText(v);
      changed = true;
    }
  }

  return { attrs, changed };
}

function cleanRawDescription(p, attrs) {
  const desc = String(p.description || "");
  if (!/con specifiche:|dishwasherSafe:|origin:|material:/i.test(desc)) {
    return null;
  }

  const brand = p.brand_name || "ORO&CO";
  const mat = attrs.material || attrs.Materiale || attrs.metal || "";
  const coll = attrs.collection || attrs.Collezione || "";
  const orig = attrs.origin || attrs.Origine || "";
  const dims = attrs.dimensions || attrs.Dimensioni || attrs.size || "";
  const finish = attrs.finish || attrs.Finitura || "";
  const stones = Array.isArray(attrs.stones) && attrs.stones.length ? attrs.stones.join(", ") : "";
  const dishwasher = attrs.dishwasherSafe === true;

  // Preserve base title sentence if clean before "della maison ... con specifiche:"
  const baseLead = desc.split(/della maison|con specifiche:/i)[0].trim().replace(/[,.]$/, "");
  const cleanTitle = baseLead || p.name;

  if (p.category === "natale" || p.category === "casa") {
    const bits = [
      `${cleanTitle}${coll ? ` della collezione ${coll}` : ""} firmata ${brand} (Cod. ${p.sku}${p.barcode && p.barcode !== p.sku ? ` · EAN ${p.barcode}` : ""}).`,
      [
        mat ? `Realizzato in ${mat}` : null,
        finish ? finish.toLowerCase() : null,
        dims ? `dimensioni ${dims}` : null,
        orig ? `origine ${orig}` : null,
        dishwasher ? "lavabile in lavastoviglie" : null,
      ]
        .filter(Boolean)
        .join(", "),
    ];
    const specLine = bits[1] ? `${bits[1].charAt(0).toUpperCase()}${bits[1].slice(1)}.` : "";
    return `${bits[0]} ${specLine} Consegnato con confezione originale ${brand} e certificato di autenticità e garanzia ufficiale ORO&CO dal 1992.`
      .replace(/\s+/g, " ")
      .trim();
  }

  // Gioielli or others
  const specPieces = [
    mat ? `realizzato in ${mat}` : null,
    stones ? `con ${stones}` : null,
    finish ? finish.toLowerCase() : null,
    dims ? `misura ${dims}` : null,
    orig ? `manifattura ${orig}` : null,
  ].filter(Boolean);

  return `${cleanTitle}${coll ? ` della collezione ${coll}` : ""} firmata ${brand} (Cod. ${p.sku}${p.barcode && p.barcode !== p.sku ? ` · EAN ${p.barcode}` : ""})${specPieces.length ? `, ${specPieces.join(", ")}` : ""}. Consegnato con confezione originale ${brand} e certificato di autenticità e garanzia ufficiale ORO&CO dal 1992.`
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const all = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("oroeco_products").select("*").range(from, from + 999);
    if (error) throw error;
    all.push(...data);
    if (data.length < 1000) break;
  }

  let updatedAttrs = 0;
  let updatedRawDescs = 0;
  let updatedBoutique = 0;

  for (const p of all) {
    const patch = {};
    const { attrs, changed: attrsChanged } = cleanAttributes(p);
    if (attrsChanged) {
      patch.attributes = attrs;
      updatedAttrs++;
    }

    const rawFix = cleanRawDescription(p, attrs);
    if (rawFix) {
      patch.description = replaceBoutiqueText(rawFix);
      updatedRawDescs++;
    } else if (typeof p.description === "string" && /boutique/i.test(p.description)) {
      patch.description = replaceBoutiqueText(p.description);
      updatedBoutique++;
    }

    if (typeof p.short_description === "string" && /boutique/i.test(p.short_description)) {
      patch.short_description = replaceBoutiqueText(p.short_description);
      updatedBoutique++;
    }
    if (typeof p.name === "string" && /boutique/i.test(p.name)) {
      patch.name = replaceBoutiqueText(p.name);
      updatedBoutique++;
    }

    if (Object.keys(patch).length > 0) {
      const { error } = await sb.from("oroeco_products").update(patch).eq("id", p.id);
      if (error) throw error;
    }
  }

  console.log("SPECS & DESCRIPTIONS REFINEMENT DONE:", {
    total_scanned: all.length,
    updatedAttrs,
    updatedRawDescs,
    updatedBoutique,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
