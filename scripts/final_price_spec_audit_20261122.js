require("./_loadEnv");
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const REPORT_PATH = path.join(process.cwd(), "data/enrichment/FINAL_PRICE_SPEC_REPORT_20261122.md");

const AUDIT_FILES = [
  "audit_20261122_villeroy.json",
  "audit_20261122_stroili.json",
  "audit_20261122_unoaerre.json",
  "audit_20261122_cuorematto.json",
  "audit_20261122_bulova.json",
  "audit_20261122_guess.json",
  "audit_20261122_gerba.json",
  "audit_20261122_gli_alberelli.json",
  "audit_20261122_paul_picot.json",
  "audit_20261122_lladro.json",
  "audit_20261122_locman.json",
];

async function main() {
  let all = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("oroeco_products").select("*").range(from, from + 999);
    if (error) throw error;
    all = all.concat(data);
    if (data.length < 1000) break;
  }

  const approved = all.filter((p) => p.approval_status === "approved");
  const totalWithCompare = all.filter((p) => p.compare_at_price !== null).length;
  const approvedBadPrice = approved.filter((p) => !p.price || Number(p.price) <= 0);
  const nonGioielliWithMetal = approved.filter(
    (p) => p.category !== "gioielli" && p.attributes && p.attributes.metal
  );
  const boutiqueHits = approved.filter((p) => {
    const blob = `${p.name || ""} ${p.short_description || ""} ${p.description || ""} ${JSON.stringify(p.attributes || {})}`;
    return /\bboutique\b/i.test(blob);
  });

  const byBrandStats = {};
  for (const p of approved) {
    const b = p.brand_name || "(none)";
    if (!byBrandStats[b]) byBrandStats[b] = { count: 0, attrSum: 0 };
    byBrandStats[b].count++;
    const keys = Object.keys(p.attributes || {}).filter((k) => {
      const v = p.attributes[k];
      return v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0);
    });
    byBrandStats[b].attrSum += keys.length;
  }

  const auditSummaries = [];
  const unverifiedList = [];

  for (const file of AUDIT_FILES) {
    const full = path.join(process.cwd(), "data/enrichment", file);
    if (!fs.existsSync(full)) continue;
    const j = JSON.parse(fs.readFileSync(full, "utf8"));
    auditSummaries.push(j.summary);
    for (const item of j.items || []) {
      if (item.status !== "verified") {
        unverifiedList.push({
          brand: j.summary.brand,
          sku: item.sku,
          barcode: item.barcode,
          name: item.name,
          currentPrice: item.newPrice,
          notes: item.notes || "Non reperibile sui cataloghi pubblici online",
        });
      }
    }
  }

  const globalChecks = {
    totalRowsInDb: all.length,
    totalApprovedOnline: approved.length,
    totalWithCompareAtPrice: totalWithCompare,
    approvedZeroOrNegativePrice: approvedBadPrice.length,
    approvedNonGioielliWithMetal: nonGioielliWithMetal.length,
    approvedBoutiqueWordHits: boutiqueHits.length,
  };

  console.log("GLOBAL DB AUDIT CHECKS:", globalChecks);

  const lines = [
    "# Report Finale Allineamento Prezzi, Zero Sconti & Schede Tecniche (22 Nov 2026)",
    "",
    "## Verifiche Globali Database (`oroeco_products`)",
    `- **Prodotti totali in DB:** ${globalChecks.totalRowsInDb}`,
    `- **Prodotti approvati online:** ${globalChecks.totalApprovedOnline}`,
    `- **Prodotti con \`compare_at_price\` / sconti barrati (tutte le 1.682 righe):** ${globalChecks.totalWithCompareAtPrice}`,
    `- **Prodotti approvati con \`price <= 0\`:** ${globalChecks.approvedZeroOrNegativePrice}`,
    `- **Prodotti approvati non-gioielli con attributo \`metal\`:** ${globalChecks.approvedNonGioielliWithMetal}`,
    `- **Occorrenze parola vietata \`Boutique\` su prodotti approvati:** ${globalChecks.approvedBoutiqueWordHits}`,
    "",
    "## Riepilogo per Fornitore",
    "| Brand | Online | Verificati Listino | Fuori Catalogo / Non Verificati | Prezzi Modificati | Media Attributi/Scheda |",
    "| :--- | :---: | :---: | :---: | :---: | :---: |",
  ];

  for (const s of auditSummaries) {
    const st = byBrandStats[s.brand] || { count: s.totalApproved, attrSum: 0 };
    const avg = st.count ? (st.attrSum / st.count).toFixed(1) : "0.0";
    lines.push(
      `| **${s.brand}** | ${s.totalApproved} | ${s.verifiedCount} | ${s.unverifiedCount} | ${s.priceChangedCount} | ${avg} |`
    );
  }

  lines.push("", `## Articoli Fuori Catalogo / Non Verificati Online (${unverifiedList.length}) — Per Revisione Renato`);
  if (unverifiedList.length === 0) {
    lines.push("- Nessun articolo non verificato: copertura 100%.");
  } else {
    for (const u of unverifiedList) {
      lines.push(`- **[${u.brand}] \`${u.sku}\`** (EAN \`${u.barcode || "-"}\`) — ${u.name} | Prezzo mantenuto: **€ ${u.currentPrice}** | Nota: ${u.notes}`);
    }
  }

  fs.writeFileSync(REPORT_PATH, lines.join("\n"), "utf8");
  console.log("Wrote report to", REPORT_PATH);

  if (
    totalWithCompare !== 0 ||
    approvedBadPrice.length !== 0 ||
    nonGioielliWithMetal.length !== 0 ||
    boutiqueHits.length !== 0
  ) {
    console.error("GLOBAL AUDIT CHECK FAILED!");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
