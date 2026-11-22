export const APPOINTMENT_REFERENTI = ["Qualsiasi", "Renato", "Patrizia", "Zia"] as const;
export type AppointmentReferenteChoice = (typeof APPOINTMENT_REFERENTI)[number];
export type AdminReferente = "Renato" | "Patrizia" | "Zia";

export const APPOINTMENT_SERVICES = [
  {
    id: "alta-gioielleria",
    label: "Alta Gioielleria in Gioielleria",
    description: "Visione privata di diamanti, fedi nuziali, oro 18kt e collezioni esclusive al banco.",
  },
  {
    id: "gioielli-su-misura",
    label: "Realizzazione Gioielli su Misura",
    description: "Progettazione artigianale di solitari, fedi personalizzate, messa a misura e rigenerazione.",
  },
  {
    id: "riparazione-orologi",
    label: "Riparazione & Revisione Orologi",
    description: "Controllo meccanico, sostituzione pile, impermeabilità e cinturini su misura.",
  },
  {
    id: "bomboniere",
    label: "Preparazione Bomboniere",
    description: "Allestimento cerimonie con Villeroy & Boch, Cuorematto, Lladró e confetti selezionati.",
  },
  {
    id: "consulenza-privata",
    label: "Consulenza Gemmologica & Regali",
    description: "Consulenza dedicata per regali aziendali, anniversari, lauree e ricorrenze speciali.",
  },
] as const;

export const MONDAY_SLOTS = [
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
] as const;

export const TUE_SAT_SLOTS = [
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
] as const;

export const DECEMBER_SUNDAY_SLOTS = [
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
] as const;

export interface DayScheduleInfo {
  date: string;
  isOpen: boolean;
  label: string;
  slots: string[];
}

/** Calcola gli slot disponibili per una data YYYY-MM-DD secondo gli orari ufficiali ORO&CO. */
export function getScheduleForDate(dateStr: string): DayScheduleInfo {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!match) {
    return { date: dateStr, isOpen: false, label: "Data non valida", slots: [] };
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const dayOfMonth = Number(match[3]);
  const dt = new Date(year, monthIndex, dayOfMonth);

  if (
    Number.isNaN(dt.getTime()) ||
    dt.getFullYear() !== year ||
    dt.getMonth() !== monthIndex ||
    dt.getDate() !== dayOfMonth
  ) {
    return { date: dateStr, isOpen: false, label: "Data non valida", slots: [] };
  }

  const dow = dt.getDay(); // 0=Dom, 1=Lun .. 6=Sab
  if (dow === 0) {
    if (monthIndex === 11) {
      return {
        date: dateStr,
        isOpen: true,
        label: "Domenica di Dicembre · Apertura Straordinaria",
        slots: [...DECEMBER_SUNDAY_SLOTS],
      };
    }
    return {
      date: dateStr,
      isOpen: false,
      label: "Chiuso la Domenica",
      slots: [],
    };
  }

  if (dow === 1) {
    return {
      date: dateStr,
      isOpen: true,
      label: "Lunedì · Chiuso mattina, aperto 16:30–20:00",
      slots: [...MONDAY_SLOTS],
    };
  }

  return {
    date: dateStr,
    isOpen: true,
    label: "Mattina 09:00–13:00 · Pomeriggio 16:30–20:00",
    slots: [...TUE_SAT_SLOTS],
  };
}

/** Formatta YYYY-MM-DD in fuso locale senza shift UTC. */
export function toLocalIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Restituisce i prossimi N giorni calendario con stato apertura ORO&CO. */
export function getUpcomingScheduleDays(daysCount = 30, startFrom = new Date()): DayScheduleInfo[] {
  const out: DayScheduleInfo[] = [];
  for (let i = 0; i < daysCount; i += 1) {
    const dt = new Date(startFrom.getFullYear(), startFrom.getMonth(), startFrom.getDate() + i);
    out.push(getScheduleForDate(toLocalIsoDate(dt)));
  }
  return out;
}
