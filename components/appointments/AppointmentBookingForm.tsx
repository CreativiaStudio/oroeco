"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
  UserCheck,
} from "lucide-react";
import {
  APPOINTMENT_REFERENTI,
  APPOINTMENT_SERVICES,
  getUpcomingScheduleDays,
  type AppointmentReferenteChoice,
} from "@/lib/appointments";
import { OFFICIAL_STORE_HOURS, STORE_CONTACT } from "@/lib/brandPolicy";
import { cn } from "@/lib/utils";

interface AppointmentBookingFormProps {
  initialServiceId?: string;
  initialBrand?: string;
}

interface BookingConfirmation {
  id: string;
  date: string;
  time: string;
  service: string;
  brand?: string;
  referente: string;
  whatsappConfirmUrl: string;
}

const WEEKDAY_SHORT = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"] as const;
const MONTH_SHORT = [
  "Gen",
  "Feb",
  "Mar",
  "Apr",
  "Mag",
  "Giu",
  "Lug",
  "Ago",
  "Set",
  "Ott",
  "Nov",
  "Dic",
] as const;

function formatDayPill(dateStr: string): { weekday: string; dayNum: string; month: string } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return {
    weekday: WEEKDAY_SHORT[dt.getDay()],
    dayNum: String(d).padStart(2, "0"),
    month: MONTH_SHORT[m - 1],
  };
}

function formatReadableDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function AppointmentBookingForm({
  initialServiceId,
  initialBrand,
}: AppointmentBookingFormProps) {
  const days = useMemo(() => getUpcomingScheduleDays(30), []);
  const firstOpenDay = useMemo(() => days.find((d) => d.isOpen)?.date ?? "", [days]);

  const initialServiceLabel = useMemo(() => {
    const match = APPOINTMENT_SERVICES.find((s) => s.id === initialServiceId);
    return match ? match.label : APPOINTMENT_SERVICES[0].label;
  }, [initialServiceId]);

  const [service, setService] = useState<string>(initialServiceLabel);
  const [brand, setBrand] = useState<string>(initialBrand || "");
  const [selectedDate, setSelectedDate] = useState<string>(firstOpenDay);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [referente, setReferente] = useState<AppointmentReferenteChoice>("Qualsiasi");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmed, setConfirmed] = useState<BookingConfirmation | null>(null);

  const selectedDayInfo = useMemo(
    () => days.find((d) => d.date === selectedDate) ?? null,
    [days, selectedDate],
  );

  useEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;
    setLoadingSlots(true);
    setSelectedTime("");

    fetch(`/api/appointments?date=${encodeURIComponent(selectedDate)}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const occupied = Array.isArray(data.bookedSlots) ? (data.bookedSlots as string[]) : [];
        setBookedSlots(occupied);
      })
      .catch(() => {
        if (!cancelled) setBookedSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedDate || !selectedTime) {
      setErrorMsg("Seleziona una data e una fascia oraria disponibile.");
      return;
    }
    if (!firstName.trim() || !phone.trim()) {
      setErrorMsg("Inserisci nome e numero di telefono per confermare l'appuntamento.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          date: selectedDate,
          time: selectedTime,
          service,
          brand: brand.trim(),
          referente,
          notes: notes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "Impossibile completare la prenotazione.");
        return;
      }

      setConfirmed({
        id: data.booking.id,
        date: data.booking.date,
        time: data.booking.time,
        service: data.booking.service,
        brand: data.booking.brand,
        referente: data.booking.referente,
        whatsappConfirmUrl: data.whatsappConfirmUrl,
      });
    } catch {
      setErrorMsg("Errore di rete durante la prenotazione. Riprova tra un istante.");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <div className="mx-auto max-w-2xl rounded-[2px] border border-[#DEDEDE] bg-[#FAF8F4] p-8 sm:p-12 text-center space-y-6">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-white text-gold">
          <CheckCircle2 className="h-7 w-7" strokeWidth={1.6} />
        </span>
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.25em] text-gold font-semibold">
            Appuntamento Confermato · {confirmed.id}
          </p>
          <h2 className="mt-2 font-serif text-3xl text-[#020202]">
            Ti aspettiamo in Gioielleria
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#4E423E]">
            La tua richiesta è stata registrata subito nell&apos;agenda della Gioielleria ORO&amp;CO.
          </p>
        </div>

        <div className="mx-auto max-w-md rounded-[2px] border border-[#E5E0D5] bg-white p-5 text-left text-sm space-y-2">
          <div className="flex justify-between gap-4">
            <span className="text-[#6B615C]">Servizio:</span>
            <span className="font-medium text-[#020202] text-right">
              {confirmed.service}
              {confirmed.brand ? ` (${confirmed.brand})` : ""}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[#6B615C]">Giorno:</span>
            <span className="font-medium text-[#020202] capitalize text-right">
              {formatReadableDate(confirmed.date)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[#6B615C]">Orario:</span>
            <span className="font-semibold text-[#012236]">{confirmed.time}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[#6B615C]">Referente:</span>
            <span className="font-medium text-[#020202]">{confirmed.referente}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href={confirmed.whatsappConfirmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-[2px] bg-[#128C7E] px-6 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#0E6F64]"
          >
            <MessageCircle className="h-4 w-4" />
            Invia promemoria su WhatsApp
          </a>
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-[2px] border border-[#020202] bg-white px-6 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[#020202] transition-colors hover:bg-[#020202] hover:text-white"
          >
            Torna alla Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-[1.45fr_1fr] lg:items-start">
      <div className="space-y-8 rounded-[2px] border border-[#DEDEDE] bg-white p-6 sm:p-10">
        {/* 1. Servizio */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-gold">
            <Sparkles className="h-4 w-4" strokeWidth={1.6} />
            1. Scegli il motivo della visita
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {APPOINTMENT_SERVICES.map((item) => {
              const active = service === item.label;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setService(item.label)}
                  className={cn(
                    "rounded-[2px] border p-4 text-left transition-all cursor-pointer",
                    active
                      ? "border-[#C5A059] bg-[#FAF8F4] ring-1 ring-[#C5A059]"
                      : "border-[#E5E0D5] bg-white hover:border-[#C5A059]/60",
                  )}
                >
                  <span className="block font-serif text-base text-[#020202]">{item.label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-[#6B615C]">
                    {item.description}
                  </span>
                </button>
              );
            })}
          </div>
          {brand ? (
            <div className="flex items-center justify-between rounded-[2px] border border-[#E5E0D5] bg-[#FAF8F4] px-4 py-2.5 text-xs text-[#4E423E]">
              <span>
                Brand di interesse selezionato: <strong className="text-[#020202] uppercase">{brand}</strong>
              </span>
              <button
                type="button"
                onClick={() => setBrand("")}
                className="text-[0.65rem] uppercase tracking-wider text-gold hover:underline cursor-pointer"
              >
                Rimuovi
              </button>
            </div>
          ) : null}
        </div>

        {/* 2. Data */}
        <div className="space-y-4 border-t border-[#EFEAE0] pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-gold">
              <Calendar className="h-4 w-4" strokeWidth={1.6} />
              2. Scegli il giorno
            </span>
            {selectedDayInfo ? (
              <span className="text-xs text-[#6B615C]">{selectedDayInfo.label}</span>
            ) : null}
          </div>

          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-7">
            {days.slice(0, 21).map((day) => {
              const pill = formatDayPill(day.date);
              const active = selectedDate === day.date;
              return (
                <button
                  key={day.date}
                  type="button"
                  disabled={!day.isOpen}
                  onClick={() => setSelectedDate(day.date)}
                  className={cn(
                    "flex flex-col items-center rounded-[2px] border px-2 py-2.5 text-center transition-all",
                    !day.isOpen
                      ? "border-[#EFEAE0] bg-[#FAF8F4] text-[#B8B0A8] opacity-55 cursor-not-allowed"
                      : active
                        ? "border-[#012236] bg-[#012236] text-white cursor-pointer"
                        : "border-[#E5E0D5] bg-white text-[#020202] hover:border-[#C5A059] cursor-pointer",
                  )}
                >
                  <span className="text-[0.6rem] uppercase tracking-wider opacity-75">
                    {pill.weekday}
                  </span>
                  <span className="font-serif text-lg font-semibold leading-tight">
                    {pill.dayNum}
                  </span>
                  <span className="text-[0.6rem] uppercase tracking-wider opacity-75">
                    {pill.month}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Fascia Oraria */}
        <div className="space-y-4 border-t border-[#EFEAE0] pt-6">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-gold">
              <Clock className="h-4 w-4" strokeWidth={1.6} />
              3. Fascia oraria disponibile
            </span>
            {loadingSlots ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-[#6B615C]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifica slot…
              </span>
            ) : null}
          </div>

          {selectedDayInfo && selectedDayInfo.isOpen ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7">
              {selectedDayInfo.slots.map((slot) => {
                const isBooked = bookedSlots.includes(slot);
                const active = selectedTime === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isBooked}
                    onClick={() => setSelectedTime(slot)}
                    className={cn(
                      "rounded-[2px] border py-2.5 font-mono text-xs font-semibold transition-all",
                      isBooked
                        ? "border-[#EFEAE0] bg-[#FAF8F4] text-[#B8B0A8] line-through cursor-not-allowed"
                        : active
                          ? "border-[#C5A059] bg-[#C5A059] text-[#0A0A0A] cursor-pointer"
                          : "border-[#E5E0D5] bg-white text-[#020202] hover:border-[#C5A059] cursor-pointer",
                    )}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-[#6B615C]">Seleziona un giorno aperto in gioielleria.</p>
          )}
        </div>

        {/* 4. Referente e Contatti */}
        <div className="space-y-4 border-t border-[#EFEAE0] pt-6">
          <span className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-gold">
            <UserCheck className="h-4 w-4" strokeWidth={1.6} />
            4. I tuoi dati &amp; Referente
          </span>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs text-[#4E423E]">
              Nome *
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Es. Marco"
                className="mt-1.5 w-full rounded-[2px] border border-[#DEDEDE] px-3 py-2.5 text-sm text-[#020202] outline-none focus:border-[#C5A059]"
              />
            </label>
            <label className="text-xs text-[#4E423E]">
              Cognome
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Es. Rossi"
                className="mt-1.5 w-full rounded-[2px] border border-[#DEDEDE] px-3 py-2.5 text-sm text-[#020202] outline-none focus:border-[#C5A059]"
              />
            </label>
            <label className="text-xs text-[#4E423E]">
              Telefono / WhatsApp *
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Es. 333 123 4567"
                className="mt-1.5 w-full rounded-[2px] border border-[#DEDEDE] px-3 py-2.5 text-sm text-[#020202] outline-none focus:border-[#C5A059]"
              />
            </label>
            <label className="text-xs text-[#4E423E]">
              Email (facoltativa)
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@esempio.it"
                className="mt-1.5 w-full rounded-[2px] border border-[#DEDEDE] px-3 py-2.5 text-sm text-[#020202] outline-none focus:border-[#C5A059]"
              />
            </label>
          </div>

          <div>
            <span className="block text-xs text-[#4E423E] mb-2">Referente in gioielleria</span>
            <div className="flex flex-wrap gap-2">
              {APPOINTMENT_REFERENTI.map((person) => (
                <button
                  key={person}
                  type="button"
                  onClick={() => setReferente(person)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-xs font-medium transition-all cursor-pointer",
                    referente === person
                      ? "border-[#012236] bg-[#012236] text-white"
                      : "border-[#DEDEDE] bg-white text-[#4E423E] hover:border-[#C5A059]",
                  )}
                >
                  {person === "Qualsiasi" ? "Primo referente disponibile" : person}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-xs text-[#4E423E]">
            Note aggiuntive (misura anello, modello desiderato o richiesta)
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Indica eventuali dettagli per farci preparare gli articoli al banco..."
              className="mt-1.5 w-full rounded-[2px] border border-[#DEDEDE] px-3 py-2.5 text-sm text-[#020202] outline-none focus:border-[#C5A059]"
            />
          </label>
        </div>

        {errorMsg ? (
          <div className="rounded-[2px] border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            {errorMsg}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting || !selectedDate || !selectedTime}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[2px] bg-[#012236] px-6 text-[0.74rem] font-semibold uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#C5A059] hover:text-[#0A0A0A] disabled:opacity-50 cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Registrazione appuntamento…
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4" />
              Conferma Appuntamento in Gioielleria
            </>
          )}
        </button>
      </div>

      {/* Colonna Riepilogo Gioielleria */}
      <aside className="space-y-5 rounded-[2px] border border-[#DEDEDE] bg-[#FAF8F4] p-7">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-gold">
            Accoglienza Dedicata dal 1992
          </p>
          <h3 className="mt-2 font-serif text-2xl text-[#020202]">
            Gioielleria ORO&amp;CO
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-[#4E423E]">
            Prenotando uno slot dedichiamo il banco esclusivamente a te, preparando in anticipo le collezioni o l&apos;assistenza richiesta.
          </p>
        </div>

        <div className="space-y-4 border-t border-[#E5DFD4] pt-5 text-sm">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.6} />
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#020202]">
                Indirizzo
              </p>
              <p className="mt-0.5 text-xs text-[#4E423E]">{STORE_CONTACT.address}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.6} />
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#020202]">
                Orari Ufficiali
              </p>
              <p className="mt-0.5 text-xs text-[#4E423E]">{OFFICIAL_STORE_HOURS.monday}</p>
              <p className="text-xs text-[#4E423E]">{OFFICIAL_STORE_HOURS.tueSat}</p>
              <p className="text-xs font-medium text-gold">{OFFICIAL_STORE_HOURS.december}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.6} />
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#020202]">
                Telefono Gioielleria
              </p>
              <a href={STORE_CONTACT.phoneHref} className="mt-0.5 block text-xs text-[#4E423E] hover:text-gold">
                {STORE_CONTACT.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      </aside>
    </form>
  );
}
