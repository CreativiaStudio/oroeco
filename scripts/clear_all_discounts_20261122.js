require("./_loadEnv");
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: rows, error } = await sb
    .from("oroeco_products")
    .select("id, sku, brand_name, compare_at_price")
    .not("compare_at_price", "is", null);

  if (error) throw error;
  console.log("Rows with non-null compare_at_price before:", rows.length);

  if (rows.length > 0) {
    const ids = rows.map((r) => r.id);
    for (let i = 0; i < ids.length; i += 200) {
      const chunk = ids.slice(i, i + 200);
      const { error: upErr } = await sb
        .from("oroeco_products")
        .update({ compare_at_price: null, updated_at: new Date().toISOString() })
        .in("id", chunk);
      if (upErr) throw upErr;
    }
  }

  const { count, error: verErr } = await sb
    .from("oroeco_products")
    .select("id", { count: "exact", head: true })
    .not("compare_at_price", "is", null);

  if (verErr) throw verErr;
  console.log("Rows with non-null compare_at_price after:", count);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
