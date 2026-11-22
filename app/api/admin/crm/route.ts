import { NextResponse } from "next/server";
import { readAllAppointments } from "@/lib/appointmentsServer";
import { getAdminSessionFromRequest } from "@/lib/adminAuth";
import { getServiceSupabase } from "@/lib/supabase";

/**
 * Gioielleria Oroeco — CRM Admin API.
 *
 * GET  /api/admin/crm → anagrafica clienti, vendite e carrelli abbandonati.
 * POST /api/admin/crm → { action: "create_customer", ... } crea o aggiorna un cliente.
 *
 * Nota: lib/supabase.ts espone il client amministrativo (Service Role) come
 * `getServiceSupabase`; qui viene incapsulato in `getSupabaseAdmin()` così l'API
 * resta allineata al contratto richiesto senza duplicare la configurazione.
 */

export const dynamic = "force-dynamic";

type AdminClient = ReturnType<typeof getServiceSupabase>;

type CustomerPayload = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  fiscal_code: string | null;
  vat_number: string | null;
  notes: string | null;
  customer_type: "b2c" | "b2b";
};

function getSupabaseAdmin(): AdminClient | null {
  try {
    return getServiceSupabase();
  } catch (error) {
    console.error("[API Admin CRM] Client Supabase admin non disponibile:", error);
    return null;
  }
}

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildCustomerPayload(body: Record<string, unknown>): CustomerPayload {
  const vatNumber = cleanText(body.vat_number);
  return {
    first_name: cleanText(body.first_name),
    last_name: cleanText(body.last_name),
    email: cleanText(body.email),
    phone: cleanText(body.phone),
    city: cleanText(body.city),
    address: cleanText(body.address),
    fiscal_code: cleanText(body.fiscal_code),
    vat_number: vatNumber,
    notes: cleanText(body.notes),
    customer_type: vatNumber ? "b2b" : "b2c",
  };
}

export async function GET(req: Request) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { success: false, ok: false, error: "Accesso non autorizzato" },
      { status: 401 },
    );
  }
  const client = getSupabaseAdmin();

  const customers: Record<string, unknown>[] = [];
  const sales: Record<string, unknown>[] = [];
  const abandonedCarts: Record<string, unknown>[] = [];

  if (!client) {
    return NextResponse.json(
      { ok: true, customers, sales, abandonedCarts },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const { data, error } = await client
      .from("oroeco_customers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    if (data) customers.push(...data);
  } catch (error) {
    console.error("[API Admin CRM GET] Lettura oroeco_customers fallita:", error);
  }

  try {
    const { data, error } = await client
      .from("oroeco_sales")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    if (data) sales.push(...data);
  } catch (error) {
    console.error("[API Admin CRM GET] Lettura oroeco_sales fallita:", error);
  }

  try {
    const { data, error } = await client
      .from("oroeco_abandoned_carts")
      .select("*")
      .order("last_activity_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    if (data) abandonedCarts.push(...data);
  } catch (error) {
    console.error("[API Admin CRM GET] Lettura oroeco_abandoned_carts fallita:", error);
  }

  const appointments = await readAllAppointments();

  return NextResponse.json(
    { ok: true, customers, sales, abandonedCarts, appointments },
    { headers: { "Cache-Control": "no-store" } },
  );
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
    const parsed = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json(
        { ok: false, error: "Body JSON non valido" },
        { status: 400 },
      );
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Body JSON non valido" },
      { status: 400 },
    );
  }

  const client = getSupabaseAdmin();

  if (body.action === "update_appointment_status") {
    const bookingId = cleanText(body.bookingId);
    const nextStatus = cleanText(body.status);
    if (
      !bookingId ||
      (nextStatus !== "Confermato" && nextStatus !== "Completato" && nextStatus !== "Annullato")
    ) {
      return NextResponse.json(
        { ok: false, error: "bookingId e stato valido obbligatori" },
        { status: 400 },
      );
    }
    if (!client) {
      return NextResponse.json({ ok: true, saved: "local" });
    }
    const { error } = await client.from("oroeco_audit_log").insert({
      category: "CRM",
      action: "APPOINTMENT_STATUS_UPDATED",
      operator: session.operator,
      details: { id: bookingId, status: nextStatus },
    });
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, saved: "cloud", status: nextStatus });
  }

  if (body.action === "create_appointment") {
    const name = cleanText(body.name) || "Cliente";
    const [firstName, ...rest] = name.split(/\s+/);
    const bookingId = `APP-${String(body.date || "").replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const booking = {
      id: bookingId,
      date: cleanText(body.date) || new Date().toISOString().slice(0, 10),
      time: cleanText(body.time) || "10:30",
      service: cleanText(body.reason) || "Consulenza in Gioielleria",
      firstName,
      lastName: rest.join(" "),
      phone: cleanText(body.phone) || "",
      referente: cleanText(body.referente) || session.operator,
      status: "Confermato",
      createdAt: new Date().toISOString(),
    };
    if (!client) return NextResponse.json({ ok: true, booking, saved: "local" });
    await client.from("oroeco_audit_log").insert({
      category: "CRM",
      action: "APPOINTMENT_BOOKED",
      operator: session.operator,
      details: booking,
    });
    return NextResponse.json({ ok: true, booking, saved: "cloud" });
  }

  if (body.action !== "create_customer") {
    return NextResponse.json(
      { ok: false, error: "Azione non supportata" },
      { status: 400 },
    );
  }

  const customer = buildCustomerPayload(body);

  if (!client) {
    return NextResponse.json({ ok: true, customer, saved: "local" });
  }

  try {
    const { data, error } = await client
      .from("oroeco_customers")
      .upsert(customer, { onConflict: "id" })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      customer: data ?? customer,
      saved: "cloud",
    });
  } catch (error) {
    console.error("[API Admin CRM POST] Salvataggio cliente fallito:", error);
    return NextResponse.json({ ok: true, customer, saved: "local" });
  }
}
