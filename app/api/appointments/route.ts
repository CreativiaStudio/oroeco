import { NextResponse } from "next/server";
import { getScheduleForDate } from "@/lib/appointments";
import {
  readAllAppointments,
  type StoredAppointmentBooking,
} from "@/lib/appointmentsServer";
import { STORE_CONTACT } from "@/lib/brandPolicy";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = (searchParams.get("date") || "").trim();
  if (!date) {
    return NextResponse.json(
      { ok: false, error: "Parametro date (YYYY-MM-DD) obbligatorio" },
      { status: 400 },
    );
  }

  const schedule = getScheduleForDate(date);
  const allBookings = await readAllAppointments();
  const bookedSlots = Array.from(
    new Set(
      allBookings
        .filter((b) => b.date === date && b.status !== "Annullato")
        .map((b) => b.time),
    ),
  );
  const availableSlots = schedule.slots.filter((slot) => !bookedSlots.includes(slot));

  return NextResponse.json(
    {
      ok: true,
      date,
      isOpen: schedule.isOpen,
      label: schedule.label,
      allSlots: schedule.slots,
      availableSlots,
      bookedSlots,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ ok: false, error: "Payload non valido" }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON non valido" }, { status: 400 });
  }

  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const date = String(body.date || "").trim();
  const time = String(body.time || "").trim();
  const service = String(body.service || "").trim() || "Consulenza in Gioielleria";
  const brand = String(body.brand || "").trim();
  const referenteRaw = String(body.referente || "Qualsiasi").trim();
  const referente = ["Renato", "Patrizia", "Zia"].includes(referenteRaw)
    ? referenteRaw
    : "Qualsiasi";
  const notes = String(body.notes || "").trim();

  if (!firstName || !phone || !date || !time) {
    return NextResponse.json(
      { ok: false, error: "Nome, telefono, data e orario sono obbligatori." },
      { status: 400 },
    );
  }

  const schedule = getScheduleForDate(date);
  if (!schedule.isOpen || !schedule.slots.includes(time)) {
    return NextResponse.json(
      { ok: false, error: `Lo slot ${time} del ${date} non rientra negli orari di apertura.` },
      { status: 400 },
    );
  }

  const allBookings = await readAllAppointments();
  const conflict = allBookings.find(
    (b) => b.date === date && b.time === time && b.status !== "Annullato",
  );
  if (conflict) {
    return NextResponse.json(
      { ok: false, error: "Questo orario è appena stato prenotato. Scegli un altro slot." },
      { status: 409 },
    );
  }

  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  const bookingId = `APP-${date.replace(/-/g, "")}-${suffix}`;
  const booking: StoredAppointmentBooking = {
    id: bookingId,
    date,
    time,
    service,
    ...(brand ? { brand } : {}),
    firstName,
    lastName,
    phone,
    ...(email ? { email } : {}),
    referente,
    ...(notes ? { notes } : {}),
    status: "Confermato",
    createdAt: new Date().toISOString(),
  };

  try {
    const supabase = getServiceSupabase();
    const { error: logErr } = await supabase.from("oroeco_audit_log").insert({
      category: "CRM",
      action: "APPOINTMENT_BOOKED",
      operator: referente === "Qualsiasi" ? "Renato" : referente,
      details: booking,
    });

    if (logErr) {
      throw logErr;
    }

    // Il vincolo DB `customer_identifier_check` richiede email o fiscal_code per B2C.
    if (email) {
      const noteLine = `[APPUNTAMENTO ${date} ${time}] ${service}${brand ? ` · ${brand}` : ""}`;
      const { data: existingCustomer } = await supabase
        .from("oroeco_customers")
        .select("id, notes")
        .eq("email", email)
        .maybeSingle();

      if (existingCustomer?.id) {
        const mergedNotes = existingCustomer.notes
          ? `${existingCustomer.notes}\n${noteLine}`
          : noteLine;
        await supabase
          .from("oroeco_customers")
          .update({
            first_name: firstName,
            last_name: lastName || null,
            phone,
            notes: mergedNotes,
          })
          .eq("id", existingCustomer.id);
      } else {
        await supabase.from("oroeco_customers").insert({
          customer_type: "b2c",
          first_name: firstName,
          last_name: lastName || null,
          email,
          phone,
          notes: noteLine,
        });
      }
    }
  } catch (error) {
    console.error("[API Appointments POST] Errore salvataggio Supabase:", error);
    return NextResponse.json(
      { ok: false, error: "Impossibile registrare la prenotazione al momento." },
      { status: 500 },
    );
  }

  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const waMsg = `Ciao ORO&CO! Ho appena prenotato dal sito (${bookingId}) per il ${date} alle ${time} — ${service}${brand ? ` (${brand})` : ""} · Referente: ${referente}. Nome: ${fullName}.`;
  const whatsappConfirmUrl = `${STORE_CONTACT.whatsappHref}?text=${encodeURIComponent(waMsg)}`;

  return NextResponse.json(
    { ok: true, booking, whatsappConfirmUrl },
    { status: 201 },
  );
}
