"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Code,
  FileText,
  Send,
  User,
  X,
} from "lucide-react";
import { generateSdiPayload, validateSdiCustomer } from "@/lib/sdiProtocol";
import { cn, formatPrice } from "@/lib/utils";
import type {
  CassaTicket,
  SdiCustomerData,
  SdiCustomerType,
  SdiInvoicePayload,
  SdiValidationErrors,
} from "@/types/cassa";

interface SdiInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: CassaTicket;
  operator: string;
  onConfirmInvoice: (customer: SdiCustomerData, sdiPayload: SdiInvoicePayload) => void;
}

const initialCustomer: SdiCustomerData = {
  customerType: "b2c",
  ragioneSociale: "",
  codiceFiscale: "",
  partitaIva: "",
  codiceDestinatario: "0000000",
  pec: "",
  indirizzo: "",
  civico: "",
  cap: "84010",
  comune: "San Marzano sul Sarno",
  provincia: "SA",
  nazione: "IT",
  email: "",
  telefono: "",
};

export function SdiInvoiceModal({
  isOpen,
  onClose,
  ticket,
  operator,
  onConfirmInvoice,
}: SdiInvoiceModalProps) {
  const [customer, setCustomer] = useState<SdiCustomerData>(initialCustomer);
  const [errors, setErrors] = useState<SdiValidationErrors>({});
  const [viewTab, setViewTab] = useState<"form" | "xml">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successDocId, setSuccessDocId] = useState<string | null>(null);

  const sdiPayload = useMemo(() => {
    return generateSdiPayload(customer, ticket, operator);
  }, [customer, ticket, operator]);

  if (!isOpen) return null;

  const handleTypeChange = (type: SdiCustomerType) => {
    setCustomer((prev) => ({
      ...prev,
      customerType: type,
      codiceDestinatario: type === "b2c" ? "0000000" : prev.codiceDestinatario === "0000000" ? "" : prev.codiceDestinatario,
    }));
    setErrors({});
  };

  const handleFieldChange = (field: keyof SdiCustomerData, value: string) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateSdiCustomer(customer);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setViewTab("form");
      return;
    }

    setIsSubmitting(true);
    // Simula trasmissione SDI ad Agenzia delle Entrate
    window.setTimeout(() => {
      setSuccessDocId(sdiPayload.invoiceNumber);
      setIsSubmitting(false);

      window.setTimeout(() => {
        onConfirmInvoice(customer, sdiPayload);
        onClose();
        setSuccessDocId(null);
        setCustomer(initialCustomer);
      }, 1200);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Chiudi modale fattura"
        onClick={onClose}
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
      />

      {/* Modal Dialog */}
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-md border border-line bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-navy px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-sm bg-gold text-ink">
              <FileText className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <h2 className="font-serif text-lg text-white">
                Fattura Elettronica SDI 1-Click (FatturaPA v1.2)
              </h2>
              <p className="text-xs text-gold-soft">
                Gioielleria ORO&amp;CO San Marzano sul Sarno · Documento fiscale SDI con trasmissione telematica
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-sm border border-white/20 text-white/80 transition-colors hover:border-gold hover:text-gold"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form & Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Barra selettore tipo cliente & anteprima */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
            {/* Toggle B2C / B2B */}
            <div className="inline-flex rounded-sm border border-line p-1 bg-pearl">
              <button
                type="button"
                onClick={() => handleTypeChange("b2c")}
                className={cn(
                  "flex items-center gap-2 rounded-sm px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors",
                  customer.customerType === "b2c"
                    ? "bg-navy text-white shadow-sm"
                    : "text-graphite hover:text-ink",
                )}
              >
                <User className="h-3.5 w-3.5" />
                Privato / B2C (Codice Fiscale)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("b2b")}
                className={cn(
                  "flex items-center gap-2 rounded-sm px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors",
                  customer.customerType === "b2b"
                    ? "bg-navy text-white shadow-sm"
                    : "text-graphite hover:text-ink",
                )}
              >
                <Building2 className="h-3.5 w-3.5" />
                Azienda / B2B (Partita IVA)
              </button>
            </div>

            {/* Toggle Tab Vista */}
            <div className="inline-flex rounded-sm border border-line p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewTab("form")}
                className={cn(
                  "flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                  viewTab === "form" ? "bg-ink text-white" : "text-graphite hover:text-ink",
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                Dati Anagrafici
              </button>
              <button
                type="button"
                onClick={() => setViewTab("xml")}
                className={cn(
                  "flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                  viewTab === "xml" ? "bg-ink text-white" : "text-graphite hover:text-ink",
                )}
              >
                <Code className="h-3.5 w-3.5" />
                Tracciato XML (FPR12)
              </button>
            </div>
          </div>

          {viewTab === "form" ? (
            <form id="sdi-form" onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Ragione Sociale / Nome */}
                <div className="sm:col-span-2">
                  <label className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-graphite">
                    {customer.customerType === "b2b"
                      ? "Ragione Sociale / Denominazione *"
                      : "Nome e Cognome Intestatario *"}
                  </label>
                  <input
                    type="text"
                    value={customer.ragioneSociale}
                    onChange={(e) => handleFieldChange("ragioneSociale", e.target.value)}
                    placeholder={
                      customer.customerType === "b2b"
                        ? "Es. Gioielli & Diamanti S.r.l."
                        : "Es. Mario Rossi"
                    }
                    className={cn(
                      "mt-1 h-11 w-full rounded-sm border px-3 text-sm text-ink outline-none transition-colors",
                      errors.ragioneSociale
                        ? "border-red-500 bg-red-50/50"
                        : "border-line bg-white focus:border-gold",
                    )}
                  />
                  {errors.ragioneSociale && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600 font-medium">
                      <AlertTriangle className="h-3 w-3" /> {errors.ragioneSociale}
                    </p>
                  )}
                </div>

                {/* Codice Fiscale */}
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-graphite">
                    Codice Fiscale {customer.customerType === "b2c" ? "*" : "(Opzionale se P.IVA)"}
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={customer.codiceFiscale}
                    onChange={(e) => handleFieldChange("codiceFiscale", e.target.value.toUpperCase())}
                    placeholder="Es. RSSMRA80A01H703S"
                    className={cn(
                      "mt-1 h-11 w-full rounded-sm border px-3 font-mono text-sm uppercase text-ink outline-none transition-colors",
                      errors.codiceFiscale
                        ? "border-red-500 bg-red-50/50"
                        : "border-line bg-white focus:border-gold",
                    )}
                  />
                  {errors.codiceFiscale && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600 font-medium">
                      <AlertTriangle className="h-3 w-3" /> {errors.codiceFiscale}
                    </p>
                  )}
                </div>

                {/* Partita IVA (obbligatoria se B2B) */}
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-graphite">
                    Partita IVA {customer.customerType === "b2b" ? "*" : "(Opzionale)"}
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={customer.partitaIva}
                    onChange={(e) => handleFieldChange("partitaIva", e.target.value.replace(/\D/g, ""))}
                    placeholder="Es. 01234567890 (11 cifre)"
                    className={cn(
                      "mt-1 h-11 w-full rounded-sm border px-3 font-mono text-sm text-ink outline-none transition-colors",
                      errors.partitaIva
                        ? "border-red-500 bg-red-50/50"
                        : "border-line bg-white focus:border-gold",
                    )}
                  />
                  {errors.partitaIva && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600 font-medium">
                      <AlertTriangle className="h-3 w-3" /> {errors.partitaIva}
                    </p>
                  )}
                </div>

                {/* Codice Destinatario SDI */}
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-graphite">
                    Codice Destinatario SDI (7 caratteri)
                  </label>
                  <input
                    type="text"
                    maxLength={7}
                    value={customer.codiceDestinatario}
                    onChange={(e) => handleFieldChange("codiceDestinatario", e.target.value.toUpperCase())}
                    placeholder="0000000"
                    className={cn(
                      "mt-1 h-11 w-full rounded-sm border px-3 font-mono text-sm uppercase text-ink outline-none transition-colors",
                      errors.codiceDestinatario
                        ? "border-red-500 bg-red-50/50"
                        : "border-line bg-white focus:border-gold",
                    )}
                  />
                  {errors.codiceDestinatario && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600 font-medium">
                      <AlertTriangle className="h-3 w-3" /> {errors.codiceDestinatario}
                    </p>
                  )}
                </div>

                {/* Indirizzo PEC */}
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-graphite">
                    Indirizzo PEC (Posta Certificata)
                  </label>
                  <input
                    type="email"
                    value={customer.pec}
                    onChange={(e) => handleFieldChange("pec", e.target.value)}
                    placeholder="cliente@pec.it"
                    className={cn(
                      "mt-1 h-11 w-full rounded-sm border px-3 text-sm text-ink outline-none transition-colors",
                      errors.pec
                        ? "border-red-500 bg-red-50/50"
                        : "border-line bg-white focus:border-gold",
                    )}
                  />
                  {errors.pec && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600 font-medium">
                      <AlertTriangle className="h-3 w-3" /> {errors.pec}
                    </p>
                  )}
                </div>

                {/* Indirizzo */}
                <div className="sm:col-span-2">
                  <label className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-graphite">
                    Indirizzo di Residenza o Sede Legale *
                  </label>
                  <input
                    type="text"
                    value={customer.indirizzo}
                    onChange={(e) => handleFieldChange("indirizzo", e.target.value)}
                    placeholder="Es. Via Roma, 10"
                    className={cn(
                      "mt-1 h-11 w-full rounded-sm border px-3 text-sm text-ink outline-none transition-colors",
                      errors.indirizzo
                        ? "border-red-500 bg-red-50/50"
                        : "border-line bg-white focus:border-gold",
                    )}
                  />
                  {errors.indirizzo && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600 font-medium">
                      <AlertTriangle className="h-3 w-3" /> {errors.indirizzo}
                    </p>
                  )}
                </div>

                {/* CAP */}
                <div>
                  <label className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-graphite">
                    CAP (5 cifre) *
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={customer.cap}
                    onChange={(e) => handleFieldChange("cap", e.target.value.replace(/\D/g, ""))}
                    placeholder="84016"
                    className={cn(
                      "mt-1 h-11 w-full rounded-sm border px-3 font-mono text-sm text-ink outline-none transition-colors",
                      errors.cap
                        ? "border-red-500 bg-red-50/50"
                        : "border-line bg-white focus:border-gold",
                    )}
                  />
                  {errors.cap && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600 font-medium">
                      <AlertTriangle className="h-3 w-3" /> {errors.cap}
                    </p>
                  )}
                </div>

                {/* Comune & Provincia */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-graphite">
                      Comune *
                    </label>
                    <input
                      type="text"
                      value={customer.comune}
                      onChange={(e) => handleFieldChange("comune", e.target.value)}
                      placeholder="San Marzano sul Sarno"
                      className={cn(
                        "mt-1 h-11 w-full rounded-sm border px-3 text-sm text-ink outline-none transition-colors",
                        errors.comune
                          ? "border-red-500 bg-red-50/50"
                          : "border-line bg-white focus:border-gold",
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-graphite">
                      Prov. *
                    </label>
                    <input
                      type="text"
                      maxLength={2}
                      value={customer.provincia}
                      onChange={(e) => handleFieldChange("provincia", e.target.value.toUpperCase())}
                      placeholder="SA"
                      className={cn(
                        "mt-1 h-11 w-full rounded-sm border px-3 text-center font-mono text-sm uppercase text-ink outline-none transition-colors",
                        errors.provincia
                          ? "border-red-500 bg-red-50/50"
                          : "border-line bg-white focus:border-gold",
                      )}
                    />
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div>
              <div className="mb-3 flex items-center justify-between text-xs text-graphite-soft">
                <span>Tracciato Ministeriale FatturaPA v1.2 (FPR12 per privati/aziende)</span>
                <span className="font-mono text-ink font-semibold">
                  Numero: {sdiPayload.invoiceNumber}
                </span>
              </div>
              <pre className="max-h-96 overflow-y-auto rounded-sm border border-line bg-pearl p-4 font-mono text-[0.68rem] leading-relaxed text-ink selection:bg-gold-tint">
                {sdiPayload.xmlFatturaPA}
              </pre>
            </div>
          )}

          {/* Riepilogo Totali Fiscale */}
          <div className="mt-6 rounded-sm border border-line bg-pearl p-4 text-xs text-graphite">
            <div className="flex justify-between py-1">
              <span>Totale Articoli ({ticket.itemCount} pz)</span>
              <span className="font-semibold text-ink">{formatPrice(ticket.subtotal)}</span>
            </div>
            {ticket.discountAmount > 0 && (
              <div className="flex justify-between py-1 text-red-600">
                <span>Sconto applicato</span>
                <span>−{formatPrice(ticket.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-t border-line">
              <span>Totale Imponibile Netto</span>
              <span className="font-semibold text-ink">
                {formatPrice(ticket.taxBreakdown.taxableBase)}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span>IVA al 22,00%</span>
              <span className="font-semibold text-ink">
                {formatPrice(ticket.taxBreakdown.vatAmount)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-t border-line font-bold text-sm text-ink">
              <span>Totale Documento Fattura</span>
              <span className="text-base text-gold">{formatPrice(ticket.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-pearl px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm px-4 py-2 text-xs font-semibold uppercase tracking-wider text-graphite hover:text-ink"
          >
            Annulla
          </button>

          <div className="flex items-center gap-3">
            {successDocId ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Fattura Trasmessa: {successDocId}
              </span>
            ) : null}

            <button
              type="submit"
              form="sdi-form"
              disabled={isSubmitting}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-navy px-6 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-sm transition-all hover:bg-gold hover:text-ink disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? "Trasmissione SDI in corso…" : "Trasmessi allo SDI ed Emetti Fattura"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
