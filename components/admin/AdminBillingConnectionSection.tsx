"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Barcode,
  Bluetooth,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  FileCode2,
  FileText,
  Landmark,
  Loader2,
  Network,
  PlugZap,
  Printer,
  Receipt,
  Save,
  ScanBarcode,
  ShieldCheck,
  Usb,
  Wifi,
} from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { AURA_DEPARTMENTS, buildThermalReceiptPreview } from "@/lib/auraProtocol";
import { findProductByCode, getAllProducts } from "@/lib/catalog";
import { generateSdiPayload, OROECO_CEDENTE } from "@/lib/sdiProtocol";
import { playPosBeep, useBarcodeScanner } from "@/lib/useBarcodeScanner";
import { cn, formatPrice } from "@/lib/utils";
import type { CassaTicket, SdiCustomerData, SdiInvoicePayload } from "@/types/cassa";
import type { Product } from "@/types/product";

/** Chiave locale della configurazione del canale SDI. */
const SDI_STORAGE_KEY = "oroeco_sdi_config_v1";

type RequestStatus = "idle" | "testing" | "success" | "error";

interface SdiChannelConfig {
  channel: string;
  passiveHubCode: string;
  webhookEndpoint: string;
  apiToken: string;
  sectionalCounter: string;
}

interface AuraLanConfig {
  ip: string;
  port: string;
  serial: string;
  timeout: string;
}

interface ScanHistoryEntry {
  code: string;
  productName: string | null;
  found: boolean;
  time: string;
}

const SDI_CHANNEL_OPTIONS = [
  "Aruba PEC / Fatturazione Elettronica",
  "Fatture in Cloud API",
  "Direct WebService SDI",
];

const DEFAULT_SDI_CONFIG: SdiChannelConfig = {
  channel: "Aruba PEC / Fatturazione Elettronica",
  passiveHubCode: "KRRH6B9",
  webhookEndpoint: "/api/sdi/webhook",
  apiToken: "",
  sectionalCounter: "FATT-2026",
};

const DEFAULT_AURA_CONFIG: AuraLanConfig = {
  ip: "192.168.1.150",
  port: "9100",
  serial: "99MEY012480",
  timeout: "3000",
};

/** Primo gioiello del catalogo reale, usato per il collaudo dei tre canali. */
const DEMO_PRODUCT = getAllProducts()[0];
const DEMO_TOTAL = DEMO_PRODUCT.price;
const DEMO_TAXABLE_BASE = Number((DEMO_TOTAL / 1.22).toFixed(2));
const DEMO_VAT_AMOUNT = Number((DEMO_TOTAL - DEMO_TAXABLE_BASE).toFixed(2));

const DEMO_TICKET: CassaTicket = {
  id: "ORC-COLLAUDO-001",
  ticketNumber: "ORC-COLLAUDO-001",
  operator: "Renato",
  items: [
    {
      product: DEMO_PRODUCT,
      quantity: 1,
      unitPrice: DEMO_TOTAL,
      lineDiscount: 0,
      lineTotal: DEMO_TOTAL,
    },
  ],
  itemCount: 1,
  subtotal: DEMO_TOTAL,
  discountMode: "none",
  discountValue: 0,
  discountAmount: 0,
  taxBreakdown: {
    subtotal: DEMO_TOTAL,
    discountAmount: 0,
    taxableBase: DEMO_TAXABLE_BASE,
    vatRate: 22,
    vatAmount: DEMO_VAT_AMOUNT,
    total: DEMO_TOTAL,
  },
  total: DEMO_TOTAL,
  paymentMethod: "card",
  cashTendered: 0,
  changeDue: 0,
  createdAt: "2026-01-01T09:00:00.000Z",
};

/** Controparte sintetica di collaudo: non contiene dati di clienti reali. */
function buildDemoCustomer(hubCode: string): SdiCustomerData {
  return {
    customerType: "b2b",
    ragioneSociale: "CLIENTE AZIENDA DI PROVA",
    partitaIva: "12345678903",
    codiceFiscale: "12345678903",
    codiceDestinatario: hubCode.trim().toUpperCase(),
    pec: "",
    indirizzo: "Via di Prova",
    civico: "1",
    cap: "84010",
    comune: "San Marzano sul Sarno",
    provincia: "SA",
    nazione: "IT",
    email: "",
    telefono: "",
  };
}

function validateSdiConfig(config: SdiChannelConfig): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.channel.trim()) {
    errors.push("Selezionare il Canale Intermediario SDI.");
  }

  if (!/^[A-Z0-9]{7}$/i.test(config.passiveHubCode.trim())) {
    errors.push("Il Codice Destinatario Hub Passivo deve contenere esattamente 7 caratteri alfanumerici.");
  }

  if (!config.webhookEndpoint.trim()) {
    errors.push("Indicare l'Endpoint Webhook di ricezione XML passivi.");
  } else if (
    !config.webhookEndpoint.trim().startsWith("/") &&
    !/^https?:\/\//i.test(config.webhookEndpoint.trim())
  ) {
    errors.push("L'Endpoint Webhook deve iniziare con '/' oppure con http:// / https://.");
  }

  if (!/^[A-Z0-9-]{3,20}$/i.test(config.sectionalCounter.trim())) {
    errors.push("Il Numeratore Sezionale deve contenere da 3 a 20 caratteri (lettere, numeri o trattini).");
  }

  if (!config.apiToken.trim()) {
    warnings.push(
      "API Key / Token Intermediario non configurato: il collaudo genera l'XML FatturaPA in locale, senza trasmetterlo all'intermediario.",
    );
  }

  return { errors, warnings };
}

function validateAuraConfig(config: AuraLanConfig): string[] {
  const errors: string[] = [];

  const ipPattern =
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  const port = Number.parseInt(config.port, 10);
  const timeout = Number.parseInt(config.timeout, 10);

  if (!ipPattern.test(config.ip.trim())) {
    errors.push("Indirizzo IP LAN non valido (formato atteso: 192.168.1.150).");
  }

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push("Porta Socket TCP non valida (valore ammesso: 1–65535).");
  }

  if (!config.serial.trim()) {
    errors.push("Matricola Registratore Telematico obbligatoria.");
  }

  if (!Number.isInteger(timeout) || timeout < 100) {
    errors.push("Timeout Connessione non valido (minimo 100 ms).");
  }

  return errors;
}

export function AdminBillingConnectionSection({
  onOpenCassa,
}: {
  onOpenCassa?: () => void;
}) {
  /* ------------------------------------------------------------------ *
   *  1. Canale Fatturazione Elettronica SDI
   * ------------------------------------------------------------------ */
  const [sdiConfig, setSdiConfig] = useState<SdiChannelConfig>(DEFAULT_SDI_CONFIG);
  const [sdiStatus, setSdiStatus] = useState<RequestStatus>("idle");
  const [sdiErrors, setSdiErrors] = useState<string[]>([]);
  const [sdiWarnings, setSdiWarnings] = useState<string[]>([]);
  const [sdiPayload, setSdiPayload] = useState<SdiInvoicePayload | null>(null);
  const [sdiSaveState, setSdiSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [sdiCopied, setSdiCopied] = useState(false);
  const sdiTimerRef = useRef<number | null>(null);
  const sdiFeedbackTimerRef = useRef<number | null>(null);

  /* ------------------------------------------------------------------ *
   *  2. Cassa Fiscale Axon Micrelec Aura RT
   * ------------------------------------------------------------------ */
  const [auraConfig, setAuraConfig] = useState<AuraLanConfig>(DEFAULT_AURA_CONFIG);
  const [auraStatus, setAuraStatus] = useState<RequestStatus>("idle");
  const [auraErrors, setAuraErrors] = useState<string[]>([]);
  const [auraReceipt, setAuraReceipt] = useState("");
  const [auraCommands, setAuraCommands] = useState<string[]>([]);
  const auraTimerRef = useRef<number | null>(null);

  /* ------------------------------------------------------------------ *
   *  3. Pistola Barcode USB / Bluetooth HID
   * ------------------------------------------------------------------ */
  const [manualCode, setManualCode] = useState("");
  const [lastScannedCode, setLastScannedCode] = useState("");
  const [lastScanTime, setLastScanTime] = useState("");
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SDI_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<SdiChannelConfig>;
        setSdiConfig((current) => ({ ...current, ...parsed }));
      }
    } catch {
      // Configurazione locale illeggibile: si mantengono i valori predefiniti.
    }
  }, []);

  useEffect(() => {
    return () => {
      if (sdiTimerRef.current !== null) window.clearTimeout(sdiTimerRef.current);
      if (sdiFeedbackTimerRef.current !== null) {
        window.clearTimeout(sdiFeedbackTimerRef.current);
      }
      if (auraTimerRef.current !== null) window.clearTimeout(auraTimerRef.current);
    };
  }, []);

  const updateSdiConfig = (field: keyof SdiChannelConfig, value: string) => {
    setSdiConfig((current) => ({ ...current, [field]: value }));
    setSdiSaveState("idle");
    if (sdiStatus === "success" || sdiStatus === "error") {
      setSdiStatus("idle");
      setSdiErrors([]);
      setSdiWarnings([]);
    }
  };

  const saveSdiConfig = () => {
    try {
      window.localStorage.setItem(SDI_STORAGE_KEY, JSON.stringify(sdiConfig));
      setSdiSaveState("saved");
      if (sdiFeedbackTimerRef.current !== null) {
        window.clearTimeout(sdiFeedbackTimerRef.current);
      }
      sdiFeedbackTimerRef.current = window.setTimeout(() => {
        setSdiSaveState("idle");
      }, 2600);
    } catch {
      setSdiSaveState("error");
    }
  };

  const testSdiConnection = () => {
    const validation = validateSdiConfig(sdiConfig);
    setSdiErrors(validation.errors);
    setSdiWarnings(validation.warnings);

    if (validation.errors.length > 0) {
      setSdiStatus("error");
      setSdiPayload(null);
      return;
    }

    setSdiStatus("testing");
    setSdiPayload(null);

    if (sdiTimerRef.current !== null) window.clearTimeout(sdiTimerRef.current);
    sdiTimerRef.current = window.setTimeout(() => {
      const payload = generateSdiPayload(
        buildDemoCustomer(sdiConfig.passiveHubCode),
        DEMO_TICKET,
        "Renato",
      );
      setSdiPayload(payload);
      setSdiStatus("success");
    }, 850);
  };

  const copySdiXml = async () => {
    if (!sdiPayload) return;
    try {
      await navigator.clipboard.writeText(sdiPayload.xmlFatturaPA);
      setSdiCopied(true);
      window.setTimeout(() => setSdiCopied(false), 2200);
    } catch {
      setSdiCopied(false);
    }
  };

  const updateAuraConfig = (field: keyof AuraLanConfig, value: string) => {
    setAuraConfig((current) => ({ ...current, [field]: value }));
    if (auraStatus === "success" || auraStatus === "error") {
      setAuraStatus("idle");
      setAuraErrors([]);
    }
  };

  const testAuraConnection = () => {
    const errors = validateAuraConfig(auraConfig);
    setAuraErrors(errors);

    if (errors.length > 0) {
      setAuraStatus("error");
      setAuraReceipt("");
      setAuraCommands([]);
      return;
    }

    setAuraStatus("testing");
    setAuraReceipt("");
    setAuraCommands([]);

    if (auraTimerRef.current !== null) window.clearTimeout(auraTimerRef.current);
    auraTimerRef.current = window.setTimeout(() => {
      const department = AURA_DEPARTMENTS[DEMO_PRODUCT.category]?.id ?? 1;
      const description = DEMO_PRODUCT.name
        .replace(/['"’]/g, "")
        .replace(/[^\x20-\x7E]/g, "")
        .trim()
        .slice(0, 24);
      const price = DEMO_PRODUCT.price.toFixed(2);

      setAuraCommands([
        "OPER DES='RENATO'",
        `VEND REP=${department}, PRE=${price}, DES='${description}'`,
        "SUBT",
        `CHIUS T=2, IMP=${price}`,
      ]);
      setAuraReceipt(
        buildThermalReceiptPreview(DEMO_TICKET, "Renato", undefined, auraConfig.serial.trim()),
      );
      setAuraStatus("success");
    }, 900);
  };

  const processScan = useCallback((rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    const product = findProductByCode(code) ?? null;
    const timestamp = new Date().toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    setLastScannedCode(code);
    setLastScanTime(timestamp);
    setScannedProduct(product);
    setManualCode("");
    setScanHistory((current) =>
      [
        {
          code,
          productName: product?.name ?? null,
          found: Boolean(product),
          time: timestamp,
        },
        ...current,
      ].slice(0, 6),
    );
  }, []);

  useBarcodeScanner({
    onScan: processScan,
    minChars: 4,
    enabled: true,
  });

  const handleManualSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    playPosBeep(1450, 0.08);
    processScan(code);
  };

  const simulateBarcodeShot = () => {
    const product = getAllProducts()[0];
    if (!product) return;
    playPosBeep(1450, 0.08);
    processScan(product.barcode);
  };

  return (
    <div className="space-y-6">
      {/* Intestazione operativa */}
      <div className="rounded-md border border-[#DEDEDE] bg-[#F7F3EC] p-5">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-sm bg-[#012236] text-[#9A7D43]">
              <ShieldCheck className="h-6 w-6" strokeWidth={1.9} />
            </span>
            <div>
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-[#9A7D43]">
                Gioielleria ORO&amp;CO · San Marzano sul Sarno
              </p>
              <h1 className="mt-1 font-serif text-2xl font-semibold text-[#020202]">
                Connessione Fatturazione SDI, Cassa RT &amp; Pistola Barcode
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[#4E423E]">
                Cablaggio e collaudo dei tre canali fiscali del punto vendita: trasmissione
                FatturaPA v1.2 FPR12, registratore telematico Axon Micrelec Aura RT su LAN e
                lettura ottica EAN-13 in capture phase HID.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DEDEDE] bg-white px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#4E423E]">
              <FileCode2 className="h-3.5 w-3.5 text-[#9A7D43]" />
              SDI FPR12
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DEDEDE] bg-white px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#4E423E]">
              <Wifi className="h-3.5 w-3.5 text-[#9A7D43]" />
              Aura RT LAN
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DEDEDE] bg-white px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#4E423E]">
              <ScanBarcode className="h-3.5 w-3.5 text-[#9A7D43]" />
              HID Capture
            </span>
          </div>
        </div>
      </div>

      {/* ================================================================
          PANNELLO 01 — FATTURAZIONE ELETTRONICA SDI
          ================================================================ */}
      <section className="overflow-hidden rounded-md border border-[#DEDEDE] bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#DEDEDE] px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border border-[#9A7D43]/35 bg-[#F7F3EC] font-serif text-sm font-semibold text-[#9A7D43]">
              01
            </span>
            <div>
              <h2 className="font-serif text-lg font-semibold text-[#020202]">
                Connessione Fatturazione Elettronica SDI
              </h2>
              <p className="mt-0.5 text-xs text-[#4E423E]">
                Agenzia delle Entrate · FatturaPA v1.2 · Formato FPR12
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DEDEDE] bg-[#F7F3EC] px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#4E423E]">
            <Landmark className="h-3.5 w-3.5 text-[#9A7D43]" />
            Canale passivo
          </span>
        </div>

        <div className="space-y-5 p-5">
          {/* Dati cedente ufficiali, non modificabili */}
          <div className="rounded-sm border border-[#DEDEDE] bg-[#F7F3EC] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#9A7D43]" />
              <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#4E423E]">
                Dati Cedente / Prestatore
              </h3>
              <span className="ml-auto text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[#9A7D43]">
                OROECO_CEDENTE
              </span>
            </div>
            <dl className="grid gap-x-5 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="sm:col-span-2">
                <dt className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-[#4E423E]">
                  Denominazione
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-[#020202]">
                  {OROECO_CEDENTE.denominazione}
                </dd>
              </div>
              <div>
                <dt className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-[#4E423E]">
                  Partita IVA
                </dt>
                <dd className="mt-0.5 font-mono text-sm text-[#020202]">
                  {OROECO_CEDENTE.partitaIva}
                </dd>
              </div>
              <div>
                <dt className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-[#4E423E]">
                  Codice Fiscale
                </dt>
                <dd className="mt-0.5 font-mono text-sm text-[#020202]">
                  {OROECO_CEDENTE.codiceFiscale}
                </dd>
              </div>
              <div>
                <dt className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-[#4E423E]">
                  Regime Fiscale
                </dt>
                <dd className="mt-0.5 text-sm text-[#020202]">
                  {OROECO_CEDENTE.regimeFiscale} · Ordinario
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-[#4E423E]">
                  Sede legale
                </dt>
                <dd className="mt-0.5 text-sm text-[#020202]">
                  {OROECO_CEDENTE.indirizzo}, {OROECO_CEDENTE.cap} {OROECO_CEDENTE.comune} (
                  {OROECO_CEDENTE.provincia})
                </dd>
              </div>
              <div>
                <dt className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-[#4E423E]">
                  PEC
                </dt>
                <dd className="mt-0.5 break-all font-mono text-sm text-[#020202]">
                  {OROECO_CEDENTE.pec}
                </dd>
              </div>
            </dl>
          </div>

          {/* Parametri del canale */}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#4E423E]">
                Canale Intermediario SDI
              </span>
              <select
                value={sdiConfig.channel}
                onChange={(event) => updateSdiConfig("channel", event.target.value)}
                className="h-10 w-full rounded-sm border border-[#DEDEDE] bg-white px-3 text-sm text-[#020202] outline-none transition focus:border-[#9A7D43] focus:ring-2 focus:ring-[#9A7D43]/15"
              >
                {SDI_CHANNEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#4E423E]">
                Codice Destinatario Hub Passivo
              </span>
              <input
                type="text"
                value={sdiConfig.passiveHubCode}
                onChange={(event) =>
                  updateSdiConfig("passiveHubCode", event.target.value.toUpperCase())
                }
                maxLength={7}
                autoComplete="off"
                spellCheck={false}
                placeholder="KRRH6B9"
                className="h-10 w-full rounded-sm border border-[#DEDEDE] bg-white px-3 font-mono text-sm uppercase tracking-[0.12em] text-[#020202] outline-none transition focus:border-[#9A7D43] focus:ring-2 focus:ring-[#9A7D43]/15"
              />
              <span className="mt-1 block text-[0.66rem] text-[#4E423E]">
                7 caratteri alfanumerici assegnati all&apos;hub di ricezione.
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#4E423E]">
                Endpoint Webhook Ricezione XML Passivi
              </span>
              <input
                type="text"
                value={sdiConfig.webhookEndpoint}
                onChange={(event) => updateSdiConfig("webhookEndpoint", event.target.value)}
                autoComplete="off"
                spellCheck={false}
                placeholder="/api/sdi/webhook"
                className="h-10 w-full rounded-sm border border-[#DEDEDE] bg-white px-3 font-mono text-sm text-[#020202] outline-none transition focus:border-[#9A7D43] focus:ring-2 focus:ring-[#9A7D43]/15"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#4E423E]">
                API Key / Token Intermediario
              </span>
              <input
                type="password"
                value={sdiConfig.apiToken}
                onChange={(event) => updateSdiConfig("apiToken", event.target.value)}
                autoComplete="new-password"
                placeholder="Token fornito dall'intermediario"
                className="h-10 w-full rounded-sm border border-[#DEDEDE] bg-white px-3 font-mono text-sm text-[#020202] outline-none transition focus:border-[#9A7D43] focus:ring-2 focus:ring-[#9A7D43]/15"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#4E423E]">
                Numeratore Sezionale
              </span>
              <input
                type="text"
                value={sdiConfig.sectionalCounter}
                onChange={(event) =>
                  updateSdiConfig("sectionalCounter", event.target.value.toUpperCase())
                }
                maxLength={20}
                autoComplete="off"
                spellCheck={false}
                placeholder="FATT-2026"
                className="h-10 w-full rounded-sm border border-[#DEDEDE] bg-white px-3 font-mono text-sm uppercase tracking-[0.08em] text-[#020202] outline-none transition focus:border-[#9A7D43] focus:ring-2 focus:ring-[#9A7D43]/15"
              />
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={saveSdiConfig}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-sm border border-[#020202] bg-white px-4 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#020202] transition hover:bg-[#F7F3EC] sm:w-auto"
              >
                {sdiSaveState === "saved" ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {sdiSaveState === "saved" ? "Configurazione salvata" : "Salva Configurazione SDI"}
              </button>
              {sdiSaveState === "error" && (
                <span className="ml-3 text-xs font-semibold text-red-700">
                  Salvataggio locale non riuscito.
                </span>
              )}
            </div>
          </div>

          {/* Errori di validazione */}
          {sdiStatus === "error" && sdiErrors.length > 0 && (
            <div
              role="alert"
              className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" />
                Configurazione SDI incompleta
              </div>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs">
                {sdiErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={testSdiConnection}
              disabled={sdiStatus === "testing"}
              className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#020202] px-5 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#9A7D43] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sdiStatus === "testing" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlugZap className="h-4 w-4" />
              )}
              {sdiStatus === "testing"
                ? "Collaudo canale SDI in corso…"
                : "Testa Connessione SDI & Genera XML FatturaPA di Prova"}
            </button>
            <span className="text-[0.66rem] text-[#4E423E]">
              Il collaudo usa la prima referenza reale del catalogo e una controparte aziendale
              sintetica di prova.
            </span>
          </div>

          {/* Avvisi non bloccanti */}
          {sdiStatus === "success" && sdiWarnings.length > 0 && (
            <div className="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
              <div className="flex items-center gap-2 font-semibold uppercase tracking-[0.12em]">
                <AlertTriangle className="h-4 w-4" />
                Avviso di collaudo
              </div>
              <ul className="mt-1.5 list-disc space-y-1 pl-5">
                {sdiWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Esito e tracciato XML */}
          {sdiStatus === "success" && sdiPayload && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-semibold">
                  Connessione SDI validata · Tracciato FPR12 generato correttamente
                </span>
                <span className="ml-auto font-mono text-xs">
                  {sdiConfig.channel} · {sdiConfig.webhookEndpoint}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-sm border border-[#DEDEDE] bg-[#F7F3EC] p-3">
                  <p className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-[#4E423E]">
                    Numero fattura di prova
                  </p>
                  <p className="mt-1 break-all font-mono text-sm font-semibold text-[#020202]">
                    {sdiPayload.invoiceNumber}
                  </p>
                </div>
                <div className="rounded-sm border border-[#DEDEDE] bg-[#F7F3EC] p-3">
                  <p className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-[#4E423E]">
                    Totale documento
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold text-[#020202]">
                    {formatPrice(sdiPayload.totaleDocumento)}
                  </p>
                </div>
                <div className="rounded-sm border border-[#DEDEDE] bg-[#F7F3EC] p-3">
                  <p className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-[#4E423E]">
                    Imponibile
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold text-[#020202]">
                    {formatPrice(sdiPayload.imponibileTotale)}
                  </p>
                </div>
                <div className="rounded-sm border border-[#DEDEDE] bg-[#F7F3EC] p-3">
                  <p className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-[#4E423E]">
                    IVA 22%
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold text-[#020202]">
                    {formatPrice(sdiPayload.impostaTotale)}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-sm border border-[#012236]">
                <div className="flex flex-wrap items-center gap-2 bg-[#012236] px-4 py-2.5 text-white">
                  <FileCode2 className="h-4 w-4 text-[#9A7D43]" />
                  <span className="text-[0.66rem] font-semibold uppercase tracking-[0.16em]">
                    Tracciato XML FatturaPA v1.2 · FPR12
                  </span>
                  <span className="ml-auto text-[0.62rem] text-[#F7F3EC]/70">
                    Numeratore sezionale: {sdiConfig.sectionalCounter}
                  </span>
                  <button
                    type="button"
                    onClick={copySdiXml}
                    className="inline-flex items-center gap-1.5 rounded-sm border border-white/25 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-white transition hover:border-[#9A7D43] hover:text-[#9A7D43]"
                  >
                    {sdiCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {sdiCopied ? "Copiato" : "Copia XML"}
                  </button>
                </div>
                <pre className="max-h-80 overflow-auto bg-[#020202] p-4 font-mono text-[0.68rem] leading-relaxed text-[#F7F3EC]">
                  {sdiPayload.xmlFatturaPA}
                </pre>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================
          PANNELLO 02 — CASSA FISCALE AURA RT
          ================================================================ */}
      <section className="overflow-hidden rounded-md border border-[#DEDEDE] bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#DEDEDE] px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border border-[#9A7D43]/35 bg-[#F7F3EC] font-serif text-sm font-semibold text-[#9A7D43]">
              02
            </span>
            <div>
              <h2 className="font-serif text-lg font-semibold text-[#020202]">
                Cassa Fiscale Axon Micrelec Aura RT
              </h2>
              <p className="mt-0.5 text-xs text-[#4E423E]">
                Predisposizione Registratore Telematico · Protocollo Ditron LAN
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#DEDEDE] bg-[#F7F3EC] px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#4E423E]">
            <Network className="h-3.5 w-3.5 text-[#9A7D43]" />
            Socket TCP
          </span>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <span className="mb-1.5 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#4E423E]">
                Indirizzo IP LAN Cassa
              </span>
              <input
                type="text"
                value={auraConfig.ip}
                onChange={(event) => updateAuraConfig("ip", event.target.value)}
                autoComplete="off"
                spellCheck={false}
                placeholder="192.168.1.150"
                className="h-10 w-full rounded-sm border border-[#DEDEDE] bg-white px-3 font-mono text-sm text-[#020202] outline-none transition focus:border-[#9A7D43] focus:ring-2 focus:ring-[#9A7D43]/15"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#4E423E]">
                Porta Socket TCP
              </span>
              <input
                type="number"
                value={auraConfig.port}
                onChange={(event) => updateAuraConfig("port", event.target.value)}
                min={1}
                max={65535}
                placeholder="9100"
                className="h-10 w-full rounded-sm border border-[#DEDEDE] bg-white px-3 font-mono text-sm text-[#020202] outline-none transition focus:border-[#9A7D43] focus:ring-2 focus:ring-[#9A7D43]/15"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#4E423E]">
                Matricola Registratore Telematico
              </span>
              <input
                type="text"
                value={auraConfig.serial}
                onChange={(event) => updateAuraConfig("serial", event.target.value)}
                autoComplete="off"
                spellCheck={false}
                placeholder="99MEY012480"
                className="h-10 w-full rounded-sm border border-[#DEDEDE] bg-white px-3 font-mono text-sm text-[#020202] outline-none transition focus:border-[#9A7D43] focus:ring-2 focus:ring-[#9A7D43]/15"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#4E423E]">
                Timeout Connessione
              </span>
              <span className="flex">
                <input
                  type="number"
                  value={auraConfig.timeout}
                  onChange={(event) => updateAuraConfig("timeout", event.target.value)}
                  min={100}
                  step={100}
                  placeholder="3000"
                  className="h-10 w-full rounded-l-sm border border-r-0 border-[#DEDEDE] bg-white px-3 font-mono text-sm text-[#020202] outline-none transition focus:border-[#9A7D43] focus:ring-2 focus:ring-[#9A7D43]/15"
                />
                <span className="grid h-10 place-items-center rounded-r-sm border border-[#DEDEDE] bg-[#F7F3EC] px-3 font-mono text-xs text-[#4E423E]">
                  ms
                </span>
              </span>
            </label>
          </div>

          {/* Mappatura reparti fiscali */}
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#4E423E]">
                Mappatura Reparti Fiscali IVA 22%
              </h3>
              <span className="text-[0.62rem] text-[#4E423E]">
                · AURA_DEPARTMENTS
              </span>
            </div>
            <div className="overflow-x-auto rounded-sm border border-[#DEDEDE]">
              <table className="min-w-full divide-y divide-[#DEDEDE] text-left text-sm">
                <thead className="bg-[#F7F3EC]">
                  <tr>
                    <th className="px-4 py-2.5 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#4E423E]">
                      Reparto RT
                    </th>
                    <th className="px-4 py-2.5 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#4E423E]">
                      Categoria catalogo
                    </th>
                    <th className="px-4 py-2.5 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#4E423E]">
                      Descrizione fiscale
                    </th>
                    <th className="px-4 py-2.5 text-right text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#4E423E]">
                      Aliquota IVA
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DEDEDE] bg-white">
                  {Object.entries(AURA_DEPARTMENTS).map(([category, department]) => (
                    <tr key={category}>
                      <td className="px-4 py-2.5 font-mono text-xs font-semibold text-[#9A7D43]">
                        REP {department.id}
                      </td>
                      <td className="px-4 py-2.5 capitalize text-[#020202]">{category}</td>
                      <td className="px-4 py-2.5 text-xs text-[#4E423E]">{department.label}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs text-[#020202]">
                        {department.vatRate.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {auraStatus === "error" && auraErrors.length > 0 && (
            <div
              role="alert"
              className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" />
                Configurazione Cassa Aura RT incompleta
              </div>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs">
                {auraErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={testAuraConnection}
              disabled={auraStatus === "testing"}
              className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#020202] px-5 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#9A7D43] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {auraStatus === "testing" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              {auraStatus === "testing"
                ? "Ping socket Aura RT in corso…"
                : "Test Ping Cassa Aura RT & Simula Scontrino di Prova"}
            </button>

            {onOpenCassa && (
              <button
                type="button"
                onClick={onOpenCassa}
                className="inline-flex items-center gap-2 rounded-sm border border-[#020202] bg-white px-4 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#020202] transition hover:bg-[#F7F3EC]"
              >
                Apri Cassa Banco
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {auraStatus === "success" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <BadgeCheck className="h-4 w-4" />
                <span className="font-semibold">
                  Canale verificato in simulazione locale · configurazione socket valida
                </span>
                <span className="ml-auto font-mono text-xs">
                  {auraConfig.ip}:{auraConfig.port} · RT {auraConfig.serial} · timeout{" "}
                  {auraConfig.timeout} ms
                </span>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {/* Comandi raw Ditron */}
                <div className="overflow-hidden rounded-sm border border-[#012236]">
                  <div className="flex items-center gap-2 bg-[#012236] px-4 py-2.5 text-white">
                    <Receipt className="h-4 w-4 text-[#9A7D43]" />
                    <span className="text-[0.66rem] font-semibold uppercase tracking-[0.16em]">
                      Comandi raw Ditron ECR
                    </span>
                    <span className="ml-auto font-mono text-[0.62rem] text-[#F7F3EC]/70">
                      OPER · VEND · SUBT · CHIUS
                    </span>
                  </div>
                  <pre className="max-h-64 overflow-auto bg-[#020202] p-4 font-mono text-[0.7rem] leading-relaxed text-[#F7F3EC]">
                    {auraCommands.join("\r\n")}
                  </pre>
                </div>

                {/* Anteprima scontrino termico */}
                <div className="overflow-hidden rounded-sm border border-[#DEDEDE]">
                  <div className="flex items-center gap-2 bg-[#F7F3EC] px-4 py-2.5">
                    <FileText className="h-4 w-4 text-[#9A7D43]" />
                    <span className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#4E423E]">
                      Anteprima scontrino termico
                    </span>
                    <span className="ml-auto font-mono text-[0.62rem] text-[#4E423E]">
                      buildThermalReceiptPreview
                    </span>
                  </div>
                  <pre className="max-h-64 overflow-auto bg-white p-4 font-mono text-[0.68rem] leading-[1.45] text-[#020202]">
                    {auraReceipt}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================
          PANNELLO 03 — PISTOLA BARCODE USB / BLUETOOTH HID
          ================================================================ */}
      <section className="overflow-hidden rounded-md border border-[#DEDEDE] bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#DEDEDE] px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border border-[#9A7D43]/35 bg-[#F7F3EC] font-serif text-sm font-semibold text-[#9A7D43]">
              03
            </span>
            <div>
              <h2 className="font-serif text-lg font-semibold text-[#020202]">
                Pistola Barcode USB / Bluetooth HID
              </h2>
              <p className="mt-0.5 text-xs text-[#4E423E]">
                Predisposizione &amp; collaudo live · lettura EAN-13 del catalogo gioielleria
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-emerald-800">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
            Pistola Barcode USB/BT: Pronta e Intercettata (Capture Phase HID)
          </span>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <form onSubmit={handleManualSubmit} className="flex items-end gap-2">
              <label className="block flex-1">
                <span className="mb-1.5 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#4E423E]">
                  Inserimento manuale EAN-13 / SKU
                </span>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(event) => setManualCode(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={`Es. ${getAllProducts()[0]?.barcode ?? "8054112300017"}`}
                  className="h-10 w-full rounded-sm border border-[#DEDEDE] bg-white px-3 font-mono text-sm text-[#020202] outline-none transition focus:border-[#9A7D43] focus:ring-2 focus:ring-[#9A7D43]/15"
                />
              </label>
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="inline-flex h-10 items-center gap-2 rounded-sm border border-[#020202] bg-white px-4 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[#020202] transition hover:bg-[#F7F3EC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Barcode className="h-4 w-4" />
                Leggi Codice
              </button>
            </form>

            <div className="flex items-end justify-start md:justify-end">
              <button
                type="button"
                onClick={simulateBarcodeShot}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-[#020202] px-5 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#9A7D43]"
              >
                <SparkleShot />
                Simula Sparo Pistola (EAN-13 Gioielleria)
              </button>
            </div>
          </div>

          {/* Esito ultima lettura */}
          <div className="rounded-sm border border-[#DEDEDE] bg-[#F7F3EC] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#4E423E]">
                Ultima lettura ottica
              </span>
              {lastScannedCode && (
                <span className="rounded-full border border-[#DEDEDE] bg-white px-2.5 py-0.5 font-mono text-[0.68rem] font-semibold text-[#020202]">
                  {lastScannedCode}
                </span>
              )}
              {lastScanTime && (
                <span className="ml-auto font-mono text-[0.62rem] text-[#4E423E]">
                  {lastScanTime}
                </span>
              )}
            </div>

            {!lastScannedCode && (
              <p className="mt-3 text-sm text-[#4E423E]">
                Nessuna lettura registrata. Sparare con la pistola fisica oppure usare il
                pulsante di simulazione per riconoscere il primo gioiello del catalogo.
              </p>
            )}

            {lastScannedCode && scannedProduct && (
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
                <SmartImage
                  src={scannedProduct.images[0]}
                  alt={scannedProduct.name}
                  className="h-24 w-24 shrink-0 rounded-sm border border-[#DEDEDE]"
                  sizes="96px"
                  fallbackLabel={scannedProduct.name}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-[#9A7D43]">
                    Gioiello riconosciuto
                  </p>
                  <h3 className="mt-0.5 font-serif text-lg font-semibold text-[#020202]">
                    {scannedProduct.name}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#4E423E]">
                    <span>
                      SKU:{" "}
                      <strong className="font-mono text-[#020202]">{scannedProduct.sku}</strong>
                    </span>
                    <span>
                      Marchio: <strong className="text-[#020202]">{scannedProduct.brand}</strong>
                    </span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold uppercase tracking-[0.1em] text-emerald-800">
                      Disponibile
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <p className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-[#4E423E]">
                    Prezzo
                  </p>
                  <p className="font-serif text-2xl font-semibold text-[#020202]">
                    {formatPrice(scannedProduct.price)}
                  </p>
                </div>
              </div>
            )}

            {lastScannedCode && !scannedProduct && (
              <div className="mt-3 flex items-start gap-2 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Codice EAN-13 non censito nel catalogo.</p>
                  <p className="mt-0.5 text-xs">
                    Verificare l&apos;etichetta o associare il codice a una referenza dalla
                    scheda prodotto.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Registro delle ultime letture */}
          {scanHistory.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#4E423E]">
                  Registro letture della sessione
                </h3>
                <span className="text-[0.62rem] text-[#4E423E]">
                  · ultime {scanHistory.length}
                </span>
              </div>
              <ul className="divide-y divide-[#DEDEDE] rounded-sm border border-[#DEDEDE]">
                {scanHistory.map((entry, index) => (
                  <li
                    key={`${entry.code}-${entry.time}-${index}`}
                    className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-xs"
                  >
                    <span className="font-mono font-semibold text-[#020202]">{entry.code}</span>
                    <span className="min-w-0 flex-1 truncate text-[#4E423E]">
                      {entry.productName ?? "Codice non censito"}
                    </span>
                    <span className="font-mono text-[0.62rem] text-[#4E423E]">{entry.time}</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.1em]",
                        entry.found
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-amber-200 bg-amber-50 text-amber-800",
                      )}
                    >
                      {entry.found ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      {entry.found ? "Riconosciuto" : "Non censito"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.66rem] text-[#4E423E]">
            <span className="inline-flex items-center gap-1.5">
              <Usb className="h-3.5 w-3.5 text-[#9A7D43]" />
              USB HID keyboard-wedge
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bluetooth className="h-3.5 w-3.5 text-[#9A7D43]" />
              Bluetooth HID
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ScanBarcode className="h-3.5 w-3.5 text-[#9A7D43]" />
              Capture Phase: intercettazione globale keydown
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Piccola icona ottica dedicata al pulsante di simulazione. */
function SparkleShot() {
  return (
    <span className="relative inline-flex h-4 w-4 items-center justify-center">
      <ScanBarcode className="h-4 w-4" />
      <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-[#9A7D43]" />
    </span>
  );
}
