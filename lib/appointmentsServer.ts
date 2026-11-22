import { getServiceSupabase } from "@/lib/supabase";

export interface StoredAppointmentBooking {
  id: string;
  date: string;
  time: string;
  service: string;
  brand?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  referente: string;
  notes?: string;
  status: "Confermato" | "Completato" | "Annullato";
  createdAt: string;
}

/** Legge tutte le prenotazioni dal log audit ricostruendo lo stato più recente per ciascuna. */
export async function readAllAppointments(): Promise<StoredAppointmentBooking[]> {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("oroeco_audit_log")
      .select("action, details, created_at")
      .eq("category", "CRM")
      .in("action", ["APPOINTMENT_BOOKED", "APPOINTMENT_STATUS_UPDATED"])
      .order("created_at", { ascending: true })
      .limit(1000);

    if (error || !data) return [];

    const byId = new Map<string, StoredAppointmentBooking>();
    for (const row of data) {
      const details = (row.details ?? {}) as Record<string, unknown>;
      const id = typeof details.id === "string" ? details.id : "";
      if (!id) continue;

      if (row.action === "APPOINTMENT_BOOKED") {
        byId.set(id, {
          id,
          date: String(details.date || ""),
          time: String(details.time || ""),
          service: String(details.service || "Consulenza in Gioielleria"),
          brand: typeof details.brand === "string" && details.brand ? details.brand : undefined,
          firstName: String(details.firstName || "Cliente"),
          lastName: String(details.lastName || ""),
          phone: String(details.phone || ""),
          email: typeof details.email === "string" && details.email ? details.email : undefined,
          referente: String(details.referente || "Qualsiasi"),
          notes: typeof details.notes === "string" && details.notes ? details.notes : undefined,
          status:
            details.status === "Completato" || details.status === "Annullato"
              ? details.status
              : "Confermato",
          createdAt: String(details.createdAt || row.created_at || new Date().toISOString()),
        });
      } else if (row.action === "APPOINTMENT_STATUS_UPDATED") {
        const existing = byId.get(id);
        const nextStatus = details.status;
        if (
          existing &&
          (nextStatus === "Confermato" || nextStatus === "Completato" || nextStatus === "Annullato")
        ) {
          existing.status = nextStatus;
        }
      }
    }

    return Array.from(byId.values()).sort((a, b) =>
      `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`),
    );
  } catch (error) {
    console.error("[AppointmentsServer] Errore lettura prenotazioni:", error);
    return [];
  }
}
