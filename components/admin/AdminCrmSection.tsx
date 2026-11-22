'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Calendar,
  Plus,
  Search,
  MessageSquare,
  Phone,
  Mail,
  Sparkles,
  CheckCircle2,
  Clock,
  Award,
  ShoppingBag,
  Store,
  X,
} from 'lucide-react';
import type { StoredAppointmentBooking } from '@/lib/appointmentsServer';
import { formatPrice } from '@/lib/utils';

type Channel = 'instore' | 'online' | 'appointment' | 'whatsapp' | 'lab';
type Referente = 'Renato' | 'Patrizia' | 'Zia';
type AppointmentStatus = 'Confermato' | 'In attesa' | 'Completato';
type FilterKey = 'all' | 'instore' | 'online' | 'appointment' | 'whatsapp' | 'vip';

interface Purchase {
  id: string;
  item: string;
  amount: number;
  date: string;
  channel: Channel;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  referente: Referente;
  reason: string;
  status: AppointmentStatus;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  channel: Channel;
  interest: string;
  amount: number;
  referente?: Referente;
  appointmentAt?: string;
  appointmentStatus?: AppointmentStatus;
  ringSize?: string;
  recurrence?: string;
  notes?: string;
  vip?: boolean;
  purchases: Purchase[];
  appointments: Appointment[];
  createdAt: string;
}

interface ClientForm {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  channel: Channel;
  interest: string;
  amount: string;
  ringSize: string;
  notes: string;
}

interface AppointmentForm {
  name: string;
  phone: string;
  date: string;
  time: string;
  referente: Referente;
  reason: string;
}

const STORAGE_KEY = 'oroeco_crm_orbit_v1';

const CHANNEL_LABEL: Record<Channel, string> = {
  instore: 'Acquisto Banco',
  online: 'Acquisto Online',
  appointment: 'Appuntamento',
  whatsapp: 'WhatsApp/Lista',
  lab: 'Laboratorio',
};

const CHANNEL_STYLE: Record<Channel, string> = {
  instore: 'border-[#DEDEDE] bg-[#F7F3EC] text-[#9A7D43]',
  online: 'border-[#DEDEDE] bg-[#F7F3EC] text-[#012236]',
  appointment: 'border-[#DEDEDE] bg-[#F7F3EC] text-[#020202]',
  whatsapp: 'border-[#DEDEDE] bg-[#F7F3EC] text-[#4E423E]',
  lab: 'border-[#DEDEDE] bg-[#F7F3EC] text-[#4E423E]',
};

const CHANNEL_DOT: Record<Channel, string> = {
  instore: 'bg-[#9A7D43]',
  online: 'bg-[#012236]',
  appointment: 'bg-[#020202]',
  whatsapp: 'bg-[#4E423E]',
  lab: 'bg-[#DEDEDE]',
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tutti' },
  { key: 'instore', label: 'Banco' },
  { key: 'online', label: 'Online' },
  { key: 'appointment', label: 'Appuntamenti' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'vip', label: 'VIP' },
];

const APPOINTMENT_REASONS = [
  'Fedi & Solitari',
  'Alta Orologeria',
  'Valutazione & Permuta',
  'Riparazione Orafa',
];

const inputClass =
  'mt-1 w-full rounded-xl border border-[#DEDEDE] bg-white px-3 py-2 text-sm text-[#020202] outline-none focus:border-[#9A7D43]';

const EMPTY_CLIENT: ClientForm = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  channel: 'instore',
  interest: '',
  amount: '',
  ringSize: '',
  notes: '',
};

const EMPTY_APPOINTMENT: AppointmentForm = {
  name: '',
  phone: '',
  date: '',
  time: '',
  referente: 'Renato',
  reason: APPOINTMENT_REASONS[0],
};

const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'crm-01',
    firstName: 'Elena',
    lastName: 'Ruocco',
    phone: '+39 338 214 7788',
    email: 'elena.ruocco@example.it',
    channel: 'instore',
    interest: 'Fedi nuziali oro bianco 18kt con incisione interna',
    amount: 2480,
    referente: 'Renato',
    ringSize: '13',
    recurrence: 'Anniversario 12 giugno',
    vip: true,
    notes: 'Coppia servita al banco cassa: incisione con data del matrimonio.',
    purchases: [
      { id: 'p-01', item: 'Fedi nuziali oro bianco 18kt', amount: 2480, date: '2026-10-18T11:20', channel: 'instore' },
    ],
    appointments: [
      { id: 'a-01', date: '2026-10-11', time: '10:30', referente: 'Renato', reason: 'Fedi & Solitari', status: 'Completato' },
    ],
    createdAt: '2026-10-11T09:00',
  },
  {
    id: 'crm-02',
    firstName: 'Gennaro',
    lastName: 'Esposito',
    phone: '+39 333 908 4412',
    email: 'gennaro.esposito@example.it',
    channel: 'online',
    interest: 'Orologio automatico acciaio 40mm',
    amount: 1890,
    vip: true,
    notes: 'Ordine e-commerce con ritiro in gioielleria e regolazione bracciale.',
    purchases: [
      { id: 'p-02', item: 'Orologio automatico acciaio 40mm', amount: 1890, date: '2026-09-29T16:05', channel: 'online' },
    ],
    appointments: [],
    createdAt: '2026-09-29T15:40',
  },
  {
    id: 'crm-03',
    firstName: 'Lucia',
    lastName: 'Ferrara',
    phone: '+39 347 552 6631',
    email: 'lucia.ferrara@example.it',
    channel: 'appointment',
    interest: 'Solitario oro giallo con diamante taglio brillante',
    amount: 0,
    referente: 'Renato',
    appointmentAt: '2026-11-20T10:30',
    appointmentStatus: 'Confermato',
    ringSize: '11',
    notes: 'Prima visita in gioielleria per scelta del solitario.',
    purchases: [],
    appointments: [
      { id: 'a-02', date: '2026-11-20', time: '10:30', referente: 'Renato', reason: 'Fedi & Solitari', status: 'Confermato' },
    ],
    createdAt: '2026-11-09T18:10',
  },
  {
    id: 'crm-04',
    firstName: 'Antonio',
    lastName: 'Coppola',
    phone: '+39 320 771 2098',
    email: 'antonio.coppola@example.it',
    channel: 'whatsapp',
    interest: 'Lista Regalo — servizio posate in argento',
    amount: 640,
    notes: 'Richiesta lista regalo via WhatsApp, conferma della famiglia entro fine mese.',
    purchases: [
      { id: 'p-03', item: 'Servizio posate argento 24 pezzi', amount: 640, date: '2026-10-04T12:15', channel: 'whatsapp' },
    ],
    appointments: [],
    createdAt: '2026-10-02T10:05',
  },
  {
    id: 'crm-05',
    firstName: 'Maria Rosaria',
    lastName: 'Sessa',
    phone: '+39 366 118 4477',
    email: 'm.sessa@example.it',
    channel: 'lab',
    interest: 'Restauro catenina oro giallo e saldatura maglia',
    amount: 180,
    referente: 'Patrizia',
    notes: 'Ritiro previsto in laboratorio, contatto telefonico al completamento.',
    purchases: [
      { id: 'p-04', item: 'Restauro catenina oro giallo', amount: 180, date: '2026-11-05T09:40', channel: 'lab' },
    ],
    appointments: [],
    createdAt: '2026-11-05T09:30',
  },
  {
    id: 'crm-06',
    firstName: 'Ciro',
    lastName: "D'Ambrosio",
    phone: '+39 331 640 9922',
    email: 'ciro.dambrosio@example.it',
    channel: 'instore',
    interest: 'Bracciale tennis oro rosa 18kt',
    amount: 3150,
    referente: 'Renato',
    recurrence: 'Regalo anniversario 24 settembre',
    vip: true,
    notes: 'Cliente storico del banco, misura bracciale 17 cm.',
    purchases: [
      { id: 'p-05', item: 'Bracciale tennis oro rosa 18kt', amount: 3150, date: '2026-09-24T17:50', channel: 'instore' },
    ],
    appointments: [],
    createdAt: '2026-09-24T17:20',
  },
  {
    id: 'crm-07',
    firstName: 'Federica',
    lastName: 'Amato',
    phone: '+39 351 224 8760',
    email: 'federica.amato@example.it',
    channel: 'online',
    interest: 'Orecchini a cerchio oro giallo 18kt',
    amount: 890,
    notes: 'Acquisto e-commerce, spedizione assicurata in provincia di Salerno.',
    purchases: [
      { id: 'p-06', item: 'Orecchini a cerchio oro giallo 18kt', amount: 890, date: '2026-11-02T20:10', channel: 'online' },
    ],
    appointments: [],
    createdAt: '2026-11-02T19:55',
  },
  {
    id: 'crm-08',
    firstName: 'Pasquale',
    lastName: 'Vitiello',
    phone: '+39 329 445 1177',
    email: 'pasquale.vitiello@example.it',
    channel: 'appointment',
    interest: 'Orologeria classica con cinturino in pelle',
    amount: 0,
    referente: 'Zia',
    appointmentAt: '2026-11-25T17:00',
    appointmentStatus: 'In attesa',
    notes: 'Valutazione di un orologio di famiglia in permuta.',
    purchases: [],
    appointments: [
      { id: 'a-03', date: '2026-11-25', time: '17:00', referente: 'Zia', reason: 'Alta Orologeria', status: 'In attesa' },
    ],
    createdAt: '2026-11-12T11:25',
  },
];

function asRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
    : [];
}

function text(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function formatDateTime(value?: string): string {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('it-IT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function waLink(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.startsWith('39') ? digits : `39${digits}`;
  return `https://wa.me/${normalized}`;
}

function normalizeContacts(list: Contact[]): Contact[] {
  return list
    .filter((contact) => contact && typeof contact === 'object')
    .map((contact) => ({
      ...contact,
      purchases: Array.isArray(contact.purchases) ? contact.purchases : [],
      appointments: Array.isArray(contact.appointments) ? contact.appointments : [],
      amount: toNumber(contact.amount),
    }));
}

function mergeApiContacts(current: Contact[], payload: unknown): Contact[] {
  const root = (payload ?? {}) as Record<string, unknown>;
  const merged = [...current];
  const seen = new Set(
    current.map((contact) => `${contact.phone}${contact.email}`.toLowerCase()).filter((key) => key.length > 0),
  );

  const push = (contact: Contact) => {
    const key = `${contact.phone}${contact.email}`.toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    merged.push(contact);
  };

  for (const customer of asRecords(root.customers)) {
    const first = text(customer.first_name, text(customer.name, 'Cliente'));
    const last = text(customer.last_name);
    push({
      id: `api-c-${text(customer.id, String(merged.length + 1))}`,
      firstName: first,
      lastName: last,
      phone: text(customer.phone),
      email: text(customer.email),
      channel: 'instore',
      interest: text(customer.notes, 'Cliente registrato in gioielleria'),
      amount: toNumber(customer.total_spent),
      vip: Boolean(customer.vip),
      purchases: [],
      appointments: [],
      createdAt: text(customer.created_at, new Date().toISOString()),
    });
  }

  for (const sale of asRecords(root.sales)) {
    const amount = toNumber(sale.total ?? sale.amount);
    push({
      id: `api-s-${text(sale.id, String(merged.length + 1))}`,
      firstName: text(sale.customer_name, 'Cliente'),
      lastName: '',
      phone: text(sale.customer_phone),
      email: text(sale.customer_email),
      channel: 'instore',
      interest: text(sale.product_name, text(sale.item, 'Acquisto registrato al banco cassa')),
      amount,
      purchases: [
        {
          id: `api-sp-${text(sale.id, String(merged.length + 1))}`,
          item: text(sale.product_name, text(sale.item, 'Acquisto registrato')),
          amount,
          date: text(sale.created_at, new Date().toISOString()),
          channel: 'instore',
        },
      ],
      appointments: [],
      createdAt: text(sale.created_at, new Date().toISOString()),
    });
  }

  for (const cart of asRecords(root.abandonedCarts)) {
    push({
      id: `api-a-${text(cart.id, String(merged.length + 1))}`,
      firstName: text(cart.customer_name, 'Cliente'),
      lastName: '',
      phone: text(cart.phone),
      email: text(cart.customer_email, text(cart.email)),
      channel: 'online',
      interest: text(cart.product_name, text(cart.item, 'Carrello e-commerce da recuperare')),
      amount: toNumber(cart.total ?? cart.value),
      purchases: [],
      appointments: [],
      createdAt: text(cart.created_at, new Date().toISOString()),
    });
  }

  return merged;
}

async function postCrm(body: Record<string, unknown>): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/crm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function AdminCrmSection() {
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [webBookings, setWebBookings] = useState<StoredAppointmentBooking[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [clientForm, setClientForm] = useState<ClientForm>(EMPTY_CLIENT);
  const [appointmentForm, setAppointmentForm] = useState<AppointmentForm>(EMPTY_APPOINTMENT);

  useEffect(() => {
    let cancelled = false;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setContacts(normalizeContacts(parsed as Contact[]));
        }
      }
    } catch {
      /* Archivio locale non disponibile: si prosegue con lo stato iniziale. */
    }
    setHydrated(true);

    const load = async () => {
      try {
        const response = await fetch('/api/admin/crm', { cache: 'no-store' });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          appointments?: StoredAppointmentBooking[];
        };
        if (cancelled) return;
        setContacts((previous) => mergeApiContacts(previous, payload));
        if (Array.isArray(payload.appointments)) {
          setWebBookings(payload.appointments);
        }
      } catch {
        /* API non raggiungibile: resta disponibile l'archivio locale. */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    } catch {
      /* Spazio locale esaurito: i dati restano in memoria. */
    }
  }, [contacts, hydrated]);

  const kpis = useMemo(() => {
    const active = contacts.filter((contact) => contact.channel === 'instore' || contact.channel === 'online').length;
    const appointments = contacts.filter(
      (contact) => contact.channel === 'appointment' || Boolean(contact.appointmentAt),
    ).length;
    const ltv = contacts.reduce((total, contact) => total + (Number.isFinite(contact.amount) ? contact.amount : 0), 0);
    return { total: contacts.length, active, appointments, ltv };
  }, [contacts]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return contacts.filter((contact) => {
      const channelMatch =
        filter === 'all' ? true : filter === 'vip' ? Boolean(contact.vip) : contact.channel === filter;
      if (!channelMatch) return false;
      if (!needle) return true;
      return [`${contact.firstName} ${contact.lastName}`, contact.phone, contact.email, contact.interest, contact.notes]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [contacts, filter, query]);

  const detail = contacts.find((contact) => contact.id === detailId) ?? null;

  const handleSaveClient = async () => {
    if (!clientForm.firstName.trim() || !clientForm.phone.trim()) {
      setNotice('Per registrare il cliente servono nome e telefono.');
      return;
    }
    setSaving(true);
    const amount = toNumber(clientForm.amount);
    const now = new Date().toISOString();
    const contact: Contact = {
      id: `crm-${Date.now()}`,
      firstName: clientForm.firstName.trim(),
      lastName: clientForm.lastName.trim(),
      phone: clientForm.phone.trim(),
      email: clientForm.email.trim(),
      channel: clientForm.channel,
      interest: clientForm.interest.trim() || 'Interesse non specificato',
      amount,
      ringSize: clientForm.ringSize.trim() || undefined,
      notes: clientForm.notes.trim() || undefined,
      purchases:
        amount > 0
          ? [
              {
                id: `p-${Date.now()}`,
                item: clientForm.interest.trim() || 'Acquisto in gioielleria',
                amount,
                date: now,
                channel: clientForm.channel,
              },
            ]
          : [],
      appointments: [],
      createdAt: now,
    };

    setContacts((previous) => [contact, ...previous]);
    setClientForm(EMPTY_CLIENT);
    setClientOpen(false);
    setSaving(false);
    setNotice(`Cliente ${contact.firstName} ${contact.lastName} registrato nell orbita gioielleria.`);

    await postCrm({
      action: 'create_customer',
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone,
      email: contact.email,
      channel: contact.channel,
      interest: contact.interest,
      amount,
      ringSize: contact.ringSize ?? '',
      notes: contact.notes ?? '',
    });
  };

  const handleSaveAppointment = async () => {
    if (!appointmentForm.name.trim() || !appointmentForm.date || !appointmentForm.time) {
      setNotice('Per fissare l appuntamento servono nome cliente, data e ora.');
      return;
    }
    setSaving(true);
    const when = `${appointmentForm.date}T${appointmentForm.time}`;
    const phone = appointmentForm.phone.trim();
    const appointment: Appointment = {
      id: `a-${Date.now()}`,
      date: appointmentForm.date,
      time: appointmentForm.time,
      referente: appointmentForm.referente,
      reason: appointmentForm.reason,
      status: 'Confermato',
    };

    setContacts((previous) => {
      const index = phone
        ? previous.findIndex((contact) => contact.phone.replace(/\D/g, '') === phone.replace(/\D/g, '') && phone.length > 0)
        : -1;
      if (index >= 0) {
        const existing = previous[index];
        const updated: Contact = {
          ...existing,
          referente: appointment.referente,
          appointmentAt: when,
          appointmentStatus: 'Confermato',
          interest: appointment.reason,
          appointments: [appointment, ...existing.appointments],
        };
        const next = [...previous];
        next[index] = updated;
        return next;
      }
      const [firstName, ...rest] = appointmentForm.name.trim().split(' ');
      return [
        {
          id: `crm-${Date.now()}`,
          firstName,
          lastName: rest.join(' '),
          phone,
          email: '',
          channel: 'appointment',
          interest: appointment.reason,
          amount: 0,
          referente: appointment.referente,
          appointmentAt: when,
          appointmentStatus: 'Confermato',
          notes: 'Appuntamento fissato in gioielleria.',
          purchases: [],
          appointments: [appointment],
          createdAt: new Date().toISOString(),
        },
        ...previous,
      ];
    });

    setAppointmentForm(EMPTY_APPOINTMENT);
    setAppointmentOpen(false);
    setSaving(false);
    setNotice(`Appuntamento in gioielleria fissato con ${appointment.referente}.`);

    await postCrm({
      action: 'create_appointment',
      name: appointmentForm.name.trim(),
      phone,
      date: appointmentForm.date,
      time: appointmentForm.time,
      referente: appointment.referente,
      reason: appointment.reason,
    });
  };

  const handleUpdateWebBookingStatus = async (
    bookingId: string,
    nextStatus: 'Confermato' | 'Completato' | 'Annullato',
  ) => {
    setWebBookings((prev) =>
      prev.map((item) => (item.id === bookingId ? { ...item, status: nextStatus } : item)),
    );
    const ok = await postCrm({
      action: 'update_appointment_status',
      bookingId,
      status: nextStatus,
    });
    setNotice(
      ok
        ? `Appuntamento ${bookingId} aggiornato su "${nextStatus}".`
        : `Impossibile aggiornare su Supabase lo stato di ${bookingId}.`,
    );
  };

  return (
    <div className="space-y-6 bg-white text-[#020202]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-[#9A7D43]">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Area Riservata
          </p>
          <h2 className="mt-1 font-serif text-2xl text-[#020202]">Orbita Clienti Gioielleria</h2>
          <p className="mt-1 max-w-2xl text-sm text-[#4E423E]">
            San Marzano sul Sarno — banco cassa RT, acquisti e-commerce, appuntamenti in gioielleria, WhatsApp e
            laboratorio orafo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setClientOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#020202] px-4 py-2 text-sm text-white transition hover:bg-[#4E423E]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            + Registra Cliente in Gioielleria
          </button>
          <button
            type="button"
            onClick={() => setAppointmentOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-[#DEDEDE] bg-[#F7F3EC] px-4 py-2 text-sm text-[#020202] transition hover:border-[#9A7D43]"
          >
            <Calendar className="h-4 w-4" aria-hidden="true" />
            + Fissa Appuntamento
          </button>
        </div>
      </div>

      {notice ? (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-[#DEDEDE] bg-[#F7F3EC] px-4 py-3 text-sm text-[#4E423E]">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#9A7D43]" aria-hidden="true" />
            {notice}
          </span>
          <button type="button" onClick={() => setNotice('')} aria-label="Chiudi avviso" className="text-[#4E423E]">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Persone nell Orbita Gioielleria', value: String(kpis.total), icon: Users },
          { label: 'Clienti Attivi (Banco + Online)', value: String(kpis.active), icon: ShoppingBag },
          { label: 'Appuntamenti in Gioielleria', value: String(kpis.appointments), icon: Calendar },
          { label: 'Valore Storico Clienti (LTV)', value: formatPrice(kpis.ltv), icon: Award },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-2xl border border-[#DEDEDE] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#4E423E]">{kpi.label}</p>
                <span className="rounded-full bg-[#F7F3EC] p-2 text-[#9A7D43]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 font-serif text-2xl text-[#020202]">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#DEDEDE] bg-white p-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => setFilter(entry.key)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                filter === entry.key
                  ? 'border-[#020202] bg-[#020202] text-white'
                  : 'border-[#DEDEDE] bg-[#F7F3EC] text-[#4E423E] hover:border-[#9A7D43]'
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <label className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4E423E]" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca nome, telefono, email, gioiello o orologio"
            className="w-full rounded-full border border-[#DEDEDE] bg-[#F7F3EC] py-2 pl-9 pr-3 text-sm text-[#020202] outline-none focus:border-[#9A7D43]"
          />
        </label>
      </div>

      {webBookings.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-[#DEDEDE] bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-[#DEDEDE] bg-[#F7F3EC] px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-medium text-[#020202]">
              <Calendar className="h-4 w-4 text-[#9A7D43]" aria-hidden="true" />
              Prenotazioni Online da `/appuntamento` ({webBookings.length})
            </p>
            <span className="text-xs text-[#4E423E]">Sincronizzate con Supabase</span>
          </div>
          <div className="divide-y divide-[#EFEAE0]">
            {webBookings.slice(0, 12).map((booking) => (
              <div
                key={booking.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="font-medium text-[#020202]">
                    {booking.date} alle <span className="font-mono">{booking.time}</span> —{' '}
                    {booking.firstName} {booking.lastName}
                  </p>
                  <p className="text-xs text-[#4E423E]">
                    {booking.service}
                    {booking.brand ? ` (${booking.brand})` : ''} · Referente:{' '}
                    <strong>{booking.referente}</strong> · Tel: {booking.phone}
                    {booking.email ? ` · ${booking.email}` : ''}
                  </p>
                  {booking.notes ? (
                    <p className="text-xs italic text-[#6B615C]">{booking.notes}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(['Confermato', 'Completato', 'Annullato'] as const).map((statusOption) => (
                    <button
                      key={statusOption}
                      type="button"
                      onClick={() => void handleUpdateWebBookingStatus(booking.id, statusOption)}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                        booking.status === statusOption
                          ? 'border-[#012236] bg-[#012236] text-white'
                          : 'border-[#DEDEDE] bg-white text-[#4E423E] hover:border-[#9A7D43]'
                      }`}
                    >
                      {statusOption}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-[#DEDEDE] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-[#DEDEDE] px-4 py-3">
          <p className="flex items-center gap-2 text-sm text-[#020202]">
            <Store className="h-4 w-4 text-[#9A7D43]" aria-hidden="true" />
            Orbita Clienti
          </p>
          <span className="text-xs text-[#4E423E]">
            {loading ? 'Sincronizzazione archivio…' : `${filtered.length} contatti`}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-[#F7F3EC] text-[11px] uppercase tracking-[0.16em] text-[#4E423E]">
              <tr>
                <th className="px-4 py-3 text-left font-normal">Nome e Cognome</th>
                <th className="px-4 py-3 text-left font-normal">Telefono e Email</th>
                <th className="px-4 py-3 text-left font-normal">Canale</th>
                <th className="px-4 py-3 text-left font-normal">Ultimo Gioiello / Appuntamento</th>
                <th className="px-4 py-3 text-left font-normal">Totale Speso</th>
                <th className="px-4 py-3 text-right font-normal">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact) => (
                <tr key={contact.id} className="border-t border-[#DEDEDE] align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#020202]">
                      {contact.firstName} {contact.lastName}
                    </p>
                    {contact.vip ? (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#F7F3EC] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#9A7D43]">
                        <Award className="h-3 w-3" aria-hidden="true" />
                        VIP
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[#4E423E]">
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                      {contact.phone || 'Telefono non fornito'}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs">
                      <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                      {contact.email || 'Email non fornita'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] ${CHANNEL_STYLE[contact.channel]}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${CHANNEL_DOT[contact.channel]}`} aria-hidden="true" />
                      {CHANNEL_LABEL[contact.channel]}
                    </span>
                  </td>
                  <td className="max-w-[260px] px-4 py-3 text-[#4E423E]">
                    <p className="text-[#020202]">{contact.interest}</p>
                    {contact.appointmentAt ? (
                      <p className="mt-1 flex items-center gap-1.5 text-xs">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {formatDateTime(contact.appointmentAt)} — {contact.referente ?? 'Renato'}
                        {contact.appointmentStatus ? ` · ${contact.appointmentStatus}` : ''}
                      </p>
                    ) : null}
                    {contact.referente && !contact.appointmentAt ? (
                      <p className="mt-1 text-xs">Referente: {contact.referente}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-serif text-base text-[#020202]">{formatPrice(contact.amount)}</p>
                    <p className="text-xs text-[#4E423E]">{contact.purchases.length} acquisti</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <a
                        href={waLink(contact.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#128C7E] px-3 py-1.5 text-xs text-white transition hover:bg-[#0E6F64]"
                      >
                        <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                        WhatsApp
                      </a>
                      <button
                        type="button"
                        onClick={() => setDetailId(contact.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#DEDEDE] px-3 py-1.5 text-xs text-[#020202] transition hover:border-[#9A7D43]"
                      >
                        Scheda 360°
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-[#4E423E]">
                    Nessun contatto nell orbita per questo filtro.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {clientOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#020202]/50 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-[#DEDEDE] bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#9A7D43]">Nuovo contatto</p>
                <h3 className="font-serif text-xl text-[#020202]">+ Registra Cliente in Gioielleria</h3>
              </div>
              <button type="button" onClick={() => setClientOpen(false)} aria-label="Chiudi" className="text-[#4E423E]">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-[#4E423E]">
                Nome
                <input
                  className={inputClass}
                  value={clientForm.firstName}
                  onChange={(event) => setClientForm({ ...clientForm, firstName: event.target.value })}
                />
              </label>
              <label className="text-xs text-[#4E423E]">
                Cognome
                <input
                  className={inputClass}
                  value={clientForm.lastName}
                  onChange={(event) => setClientForm({ ...clientForm, lastName: event.target.value })}
                />
              </label>
              <label className="text-xs text-[#4E423E]">
                Telefono
                <input
                  className={inputClass}
                  value={clientForm.phone}
                  onChange={(event) => setClientForm({ ...clientForm, phone: event.target.value })}
                />
              </label>
              <label className="text-xs text-[#4E423E]">
                Email
                <input
                  className={inputClass}
                  value={clientForm.email}
                  onChange={(event) => setClientForm({ ...clientForm, email: event.target.value })}
                />
              </label>
              <label className="text-xs text-[#4E423E]">
                Canale
                <select
                  className={inputClass}
                  value={clientForm.channel}
                  onChange={(event) => setClientForm({ ...clientForm, channel: event.target.value as Channel })}
                >
                  <option value="instore">Acquisto Banco Cassa RT</option>
                  <option value="online">Acquisto E-Commerce</option>
                  <option value="appointment">Appuntamento Prenotato in Gioielleria</option>
                  <option value="whatsapp">Richiesta WhatsApp / Lista Regalo</option>
                  <option value="lab">Laboratorio Orafo &amp; Riparazioni</option>
                </select>
              </label>
              <label className="text-xs text-[#4E423E]">
                Importo speso
                <input
                  className={inputClass}
                  inputMode="decimal"
                  value={clientForm.amount}
                  onChange={(event) => setClientForm({ ...clientForm, amount: event.target.value })}
                />
              </label>
              <label className="text-xs text-[#4E423E] sm:col-span-2">
                Gioiello o Orologio acquistato o cercato
                <input
                  className={inputClass}
                  value={clientForm.interest}
                  onChange={(event) => setClientForm({ ...clientForm, interest: event.target.value })}
                />
              </label>
              <label className="text-xs text-[#4E423E]">
                Ricorrenza / Misura Anello
                <input
                  className={inputClass}
                  value={clientForm.ringSize}
                  onChange={(event) => setClientForm({ ...clientForm, ringSize: event.target.value })}
                />
              </label>
              <label className="text-xs text-[#4E423E] sm:col-span-2">
                Note
                <textarea
                  className={`${inputClass} min-h-[80px]`}
                  value={clientForm.notes}
                  onChange={(event) => setClientForm({ ...clientForm, notes: event.target.value })}
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setClientOpen(false)}
                className="rounded-full border border-[#DEDEDE] px-4 py-2 text-sm text-[#4E423E]"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleSaveClient}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-[#020202] px-4 py-2 text-sm text-white disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Salva Cliente
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {appointmentOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#020202]/50 p-4">
          <div className="my-8 w-full max-w-xl rounded-2xl border border-[#DEDEDE] bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#9A7D43]">Agenda gioielleria</p>
                <h3 className="font-serif text-xl text-[#020202]">+ Fissa Appuntamento in Gioielleria</h3>
              </div>
              <button
                type="button"
                onClick={() => setAppointmentOpen(false)}
                aria-label="Chiudi"
                className="text-[#4E423E]"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-[#4E423E]">
                Nome Cliente
                <input
                  className={inputClass}
                  value={appointmentForm.name}
                  onChange={(event) => setAppointmentForm({ ...appointmentForm, name: event.target.value })}
                />
              </label>
              <label className="text-xs text-[#4E423E]">
                Telefono
                <input
                  className={inputClass}
                  value={appointmentForm.phone}
                  onChange={(event) => setAppointmentForm({ ...appointmentForm, phone: event.target.value })}
                />
              </label>
              <label className="text-xs text-[#4E423E]">
                Data
                <input
                  type="date"
                  className={inputClass}
                  value={appointmentForm.date}
                  onChange={(event) => setAppointmentForm({ ...appointmentForm, date: event.target.value })}
                />
              </label>
              <label className="text-xs text-[#4E423E]">
                Ora
                <input
                  type="time"
                  className={inputClass}
                  value={appointmentForm.time}
                  onChange={(event) => setAppointmentForm({ ...appointmentForm, time: event.target.value })}
                />
              </label>
              <label className="text-xs text-[#4E423E]">
                Referente
                <select
                  className={inputClass}
                  value={appointmentForm.referente}
                  onChange={(event) =>
                    setAppointmentForm({ ...appointmentForm, referente: event.target.value as Referente })
                  }
                >
                  <option value="Renato">Renato</option>
                  <option value="Patrizia">Patrizia</option>
                  <option value="Zia">Zia</option>
                </select>
              </label>
              <label className="text-xs text-[#4E423E]">
                Motivo
                <select
                  className={inputClass}
                  value={appointmentForm.reason}
                  onChange={(event) => setAppointmentForm({ ...appointmentForm, reason: event.target.value })}
                >
                  {APPOINTMENT_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAppointmentOpen(false)}
                className="rounded-full border border-[#DEDEDE] px-4 py-2 text-sm text-[#4E423E]"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleSaveAppointment}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-[#020202] px-4 py-2 text-sm text-white disabled:opacity-60"
              >
                <Calendar className="h-4 w-4" aria-hidden="true" />
                Conferma Appuntamento
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {detail ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#020202]/50 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-[#DEDEDE] bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#9A7D43]">Scheda 360°</p>
                <h3 className="font-serif text-xl text-[#020202]">
                  {detail.firstName} {detail.lastName}
                </h3>
                <p className="mt-1 text-xs text-[#4E423E]">
                  {detail.phone || 'Telefono non fornito'} · {detail.email || 'Email non fornita'}
                </p>
              </div>
              <button type="button" onClick={() => setDetailId(null)} aria-label="Chiudi" className="text-[#4E423E]">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[#DEDEDE] bg-[#F7F3EC] p-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#4E423E]">Canale</p>
                <p className="mt-1 text-sm text-[#020202]">{CHANNEL_LABEL[detail.channel]}</p>
              </div>
              <div className="rounded-xl border border-[#DEDEDE] bg-[#F7F3EC] p-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#4E423E]">Totale speso</p>
                <p className="mt-1 font-serif text-lg text-[#020202]">{formatPrice(detail.amount)}</p>
              </div>
              <div className="rounded-xl border border-[#DEDEDE] bg-[#F7F3EC] p-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#4E423E]">Referente</p>
                <p className="mt-1 text-sm text-[#020202]">{detail.referente ?? 'Renato'}</p>
              </div>
            </div>

            <div className="mt-5">
              <p className="flex items-center gap-2 text-sm text-[#020202]">
                <ShoppingBag className="h-4 w-4 text-[#9A7D43]" aria-hidden="true" />
                Storico Acquisti
              </p>
              <div className="mt-2 space-y-2">
                {detail.purchases.length === 0 ? (
                  <p className="rounded-xl border border-[#DEDEDE] bg-[#F7F3EC] px-3 py-2 text-xs text-[#4E423E]">
                    Nessun acquisto registrato.
                  </p>
                ) : (
                  detail.purchases.map((purchase) => (
                    <div
                      key={purchase.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[#DEDEDE] px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="text-[#020202]">{purchase.item}</p>
                        <p className="text-xs text-[#4E423E]">
                          {formatDateTime(purchase.date)} · {CHANNEL_LABEL[purchase.channel]}
                        </p>
                      </div>
                      <p className="font-serif text-[#020202]">{formatPrice(purchase.amount)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-5">
              <p className="flex items-center gap-2 text-sm text-[#020202]">
                <Calendar className="h-4 w-4 text-[#9A7D43]" aria-hidden="true" />
                Storico Appuntamenti
              </p>
              <div className="mt-2 space-y-2">
                {detail.appointments.length === 0 ? (
                  <p className="rounded-xl border border-[#DEDEDE] bg-[#F7F3EC] px-3 py-2 text-xs text-[#4E423E]">
                    Nessun appuntamento registrato.
                  </p>
                ) : (
                  detail.appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#DEDEDE] px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="text-[#020202]">
                          {appointment.date} · {appointment.time} — {appointment.reason}
                        </p>
                        <p className="text-xs text-[#4E423E]">Referente {appointment.referente}</p>
                      </div>
                      <span className="rounded-full bg-[#F7F3EC] px-2 py-0.5 text-[11px] text-[#4E423E]">
                        {appointment.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {(detail.ringSize || detail.recurrence || detail.notes) && (
              <div className="mt-5 rounded-xl border border-[#DEDEDE] bg-[#F7F3EC] px-3 py-2 text-xs text-[#4E423E]">
                {detail.ringSize ? <p>Misura / Ricorrenza: {detail.ringSize}</p> : null}
                {detail.recurrence ? <p>Ricorrenza: {detail.recurrence}</p> : null}
                {detail.notes ? <p className="mt-1">Note: {detail.notes}</p> : null}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <a
                href={waLink(detail.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#128C7E] px-4 py-2 text-sm text-white"
              >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                WhatsApp diretto
              </a>
              <button
                type="button"
                onClick={() => setDetailId(null)}
                className="rounded-full border border-[#DEDEDE] px-4 py-2 text-sm text-[#020202]"
              >
                Chiudi Scheda
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
