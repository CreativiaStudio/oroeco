"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  CreditCard,
  FileCode2,
  Printer,
  Receipt,
  Wifi,
  X,
} from "lucide-react";
import {
  buildThermalReceiptPreview,
  generateDitronAuraPayload,
} from "@/lib/auraProtocol";
import { cn, formatPrice } from "@/lib/utils";
import type { CassaTicket, PaymentMethod } from "@/types/cassa";

interface AuraReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: CassaTicket;
  operator: string;
  onConfirmPrint: (paymentMethod: PaymentMethod, cashTendered: number, changeDue: number) => void;
}

export function AuraReceiptModal({
  isOpen,
  onClose,
  ticket,
  operator,
  onConfirmPrint,
}: AuraReceiptModalProps) {
  const [tenderMethod, setTenderMethod] = useState<PaymentMethod>("cash");
  const [cashTenderedStr, setCashTenderedStr] = useState<string>("");
  const [lotteryCode, setLotteryCode] = useState<string>(ticket.lotteryCode || "");
  const [previewTab, setPreviewTab] = useState<"thermal" | "ditron">("thermal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successDocId, setSuccessDocId] = useState<string | null>(null);

  const total = ticket.total;
  const cashTendered = Number.parseFloat(cashTenderedStr.replace(",", ".")) || (tenderMethod === "cash" ? total : 0);
  const changeDue = Math.max(0, cashTendered - total);

  // Payload Ditron aggiornato con i dati della modale
  const ticketForAura: CassaTicket = useMemo(() => ({
    ...ticket,
    paymentMethod: tenderMethod,
    cashTendered,
    changeDue,
    lotteryCode: lotteryCode.trim() || undefined,
  }), [ticket, tenderMethod, cashTendered, changeDue, lotteryCode]);

  const auraPayload = useMemo(
    () => generateDitronAuraPayload(ticketForAura, operator),
    [ticketForAura, operator],
  );

  const thermalText = useMemo(
    () => buildThermalReceiptPreview(ticketForAura, operator),
    [ticketForAura, operator],
  );

  if (!isOpen) return null;

  const handleConfirm = () => {
    setIsSubmitting(true);
    // Simula risposta socket LAN Axon Aura RT
    window.setTimeout(() => {
      const docId = `DOC-RT-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 8999 + 1000)}`;
      setSuccessDocId(docId);
      setIsSubmitting(false);

      window.setTimeout(() => {
        onConfirmPrint(tenderMethod, cashTendered, changeDue);
        onClose();
        setSuccessDocId(null);
      }, 1200);
    }, 600);
  };

  const handleQuickCash = (amount: number) => {
    setCashTenderedStr(amount.toFixed(2));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Chiudi modale scontrino"
        onClick={onClose}
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
      />

      {/* Modal Dialog */}
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-md border border-line bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-navy px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-sm bg-gold text-ink">
              <Printer className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <h2 className="font-serif text-lg text-white">
                Batti Scontrino Fiscale · Axon Micrelec Aura RT
              </h2>
              <div className="flex items-center gap-2 text-xs text-gold-soft">
                <span className="inline-flex items-center gap-1">
                  <Wifi className="h-3.5 w-3.5 text-green-400" />
                  LAN 192.168.1.150:9100 (Axon FPID Pro online)
                </span>
                <span>·</span>
                <span>Operatore: <strong>{operator}</strong></span>
              </div>
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

        {/* Content Body */}
        <div className="grid flex-1 gap-6 overflow-y-auto p-6 md:grid-cols-2">
          {/* Colonna Sinistra: Modalità di Pagamento & Resto */}
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-[0.65rem] font-bold uppercase tracking-[0.16em] text-graphite-soft">
                Modalità di Pagamento Banco
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setTenderMethod("cash");
                    setCashTenderedStr(total.toFixed(2));
                  }}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-sm border p-3.5 text-sm font-semibold transition-all",
                    tenderMethod === "cash"
                      ? "border-gold bg-gold-tint/50 text-ink shadow-sm"
                      : "border-line bg-pearl text-graphite hover:border-gold/40",
                  )}
                >
                  <Banknote className="h-4 w-4 text-gold" strokeWidth={2} />
                  Contanti (T=1)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTenderMethod("card");
                    setCashTenderedStr(total.toFixed(2));
                  }}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-sm border p-3.5 text-sm font-semibold transition-all",
                    tenderMethod === "card"
                      ? "border-gold bg-gold-tint/50 text-ink shadow-sm"
                      : "border-line bg-pearl text-graphite hover:border-gold/40",
                  )}
                >
                  <CreditCard className="h-4 w-4 text-gold" strokeWidth={2} />
                  Carta / POS (T=2)
                </button>
              </div>
            </div>

            {/* Calcolatore Contanti e Resto da dare */}
            {tenderMethod === "cash" && (
              <div className="rounded-sm border border-line bg-pearl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-graphite-soft">
                    Totale da Saldare
                  </span>
                  <span className="font-serif text-lg font-bold text-ink">
                    {formatPrice(total)}
                  </span>
                </div>

                <div className="mt-3">
                  <label htmlFor="cash-input" className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-graphite">
                    Contanti Ricevuti dal Cliente (€)
                  </label>
                  <input
                    id="cash-input"
                    type="text"
                    inputMode="decimal"
                    value={cashTenderedStr}
                    onChange={(e) => setCashTenderedStr(e.target.value)}
                    placeholder={total.toFixed(2)}
                    className="mt-1 h-12 w-full rounded-sm border border-line bg-white px-3 font-mono text-xl font-bold text-ink outline-none focus:border-gold"
                  />
                </div>

                {/* Tagli rapidi banconote */}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickCash(total)}
                    className="rounded-sm border border-line bg-white px-2.5 py-1 text-xs font-medium text-graphite hover:border-gold hover:text-gold"
                  >
                    Esatto
                  </button>
                  {[50, 100, 200, 500].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickCash(val)}
                      className="rounded-sm border border-line bg-white px-2.5 py-1 text-xs font-medium text-graphite hover:border-gold hover:text-gold"
                    >
                      {val} €
                    </button>
                  ))}
                </div>

                {/* Resto da dare in evidenza */}
                <div className={cn(
                  "mt-4 rounded-sm border p-3.5 text-center transition-colors",
                  cashTendered >= total
                    ? "border-green-300 bg-green-50 text-green-900"
                    : "border-red-200 bg-red-50 text-red-900",
                )}>
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em]">
                    {cashTendered >= total ? "Resto da Dare" : "Importo Insufficiente"}
                  </p>
                  <p className="font-serif text-2xl font-bold">
                    {cashTendered >= total
                      ? formatPrice(changeDue)
                      : `Mancano ${formatPrice(total - cashTendered)}`}
                  </p>
                </div>
              </div>
            )}

            {/* Lotteria degli scontrini */}
            <div>
              <label htmlFor="lottery-input" className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-graphite-soft">
                Codice Lotteria degli Scontrini (Opzionale · 8 caratteri)
              </label>
              <input
                id="lottery-input"
                type="text"
                maxLength={8}
                value={lotteryCode}
                onChange={(e) => setLotteryCode(e.target.value.toUpperCase())}
                placeholder="Es. 8A7B6C5D"
                className="mt-1 h-11 w-full rounded-sm border border-line bg-white px-3 font-mono text-sm uppercase tracking-wider text-ink outline-none focus:border-gold"
              />
            </div>

            {/* Riepilogo Fiscale 22% */}
            <div className="rounded-sm border border-line p-3.5 text-xs text-graphite">
              <div className="flex justify-between py-1">
                <span>Imponibile IVA (Netto)</span>
                <span className="font-semibold text-ink">
                  {formatPrice(ticket.taxBreakdown.taxableBase)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-t border-line">
                <span>IVA al 22,00% scorporata</span>
                <span className="font-semibold text-ink">
                  {formatPrice(ticket.taxBreakdown.vatAmount)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-line font-bold text-sm text-ink">
                <span>Totale Fiscale Complessivo</span>
                <span>{formatPrice(ticket.total)}</span>
              </div>
            </div>
          </div>

          {/* Colonna Destra: Anteprima Termica o Codice Protocollo Ditron */}
          <div className="flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-graphite-soft">
                Anteprima Dispositivo RT
              </span>
              <div className="inline-flex rounded-sm border border-line p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewTab("thermal")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider transition-colors",
                    previewTab === "thermal"
                      ? "bg-ink text-white"
                      : "text-graphite hover:text-ink",
                  )}
                >
                  <Receipt className="h-3 w-3" />
                  Scontrino
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("ditron")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider transition-colors",
                    previewTab === "ditron"
                      ? "bg-ink text-white"
                      : "text-graphite hover:text-ink",
                  )}
                >
                  <FileCode2 className="h-3 w-3" />
                  Protocollo Ditron
                </button>
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden rounded-sm border border-line bg-pearl">
              {previewTab === "thermal" ? (
                <pre className="h-80 overflow-y-auto p-4 font-mono text-[0.68rem] leading-relaxed text-ink selection:bg-gold-tint">
                  {thermalText}
                </pre>
              ) : (
                <div className="h-80 overflow-y-auto p-4">
                  <p className="mb-2 text-[0.62rem] uppercase tracking-wider text-gold font-bold">
                    Sequenza Comandi Ditron ECR (porta TCP 9100 / Socket RT):
                  </p>
                  <pre className="font-mono text-xs text-navy-deep leading-loose whitespace-pre-wrap">
                    {auraPayload.formattedLines}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer con azione di emissione */}
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
                Scontrino emesso: {successDocId}
              </span>
            ) : null}

            <button
              type="button"
              disabled={isSubmitting || (tenderMethod === "cash" && cashTendered < total)}
              onClick={handleConfirm}
              className={cn(
                "inline-flex h-12 items-center justify-center gap-2 rounded-sm px-6 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-sm transition-all",
                tenderMethod === "cash" && cashTendered < total
                  ? "cursor-not-allowed bg-graphite-soft opacity-60"
                  : "bg-navy hover:bg-gold hover:text-ink",
              )}
            >
              <Printer className="h-4 w-4" />
              {isSubmitting ? "Invio ad Axon Aura RT…" : "Conferma ed Emetti Scontrino"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
