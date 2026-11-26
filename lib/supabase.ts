import { createClient } from "@supabase/supabase-js";

/**
 * Gioielleria Oroeco — Dedicated Supabase Client.
 *
 * Configurato per connettersi esclusivamente all'istanza dedicata Oroeco:
 * Project: oroeco (cuztyagbckeyljlhhzvr.supabase.co)
 * Rispettando il vincolo di isolamento totale rispetto ad altri progetti o database d'agenzia.
 */

const supabaseUrl = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://cuztyagbckeyljlhhzvr.supabase.co"
).trim();

const supabaseAnonKey = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_Q0fwrkkuocjEU6-X5BAECg_0MizBLit"
).trim();

const noStoreFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: "no-store" });

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: noStoreFetch },
});

/**
 * Client con privilegi di servizio (Service Role) per operazioni amministrative / checkout atomico.
 * Utilizzabile solo server-side.
 */
export function getServiceSupabase() {
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY non configurata sul server: impossibile modificare i dati su Supabase.",
    );
  }
  return createClient(supabaseUrl, serviceKey, {
    global: { fetch: noStoreFetch },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
