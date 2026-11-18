"use client";

import { useEffect } from "react";
import { ShieldCheck, Award, Sparkles, CheckCircle, X, Gem } from "lucide-react";

interface WarrantyModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandName?: string;
  productName?: string;
}

export function WarrantyModal({
  isOpen,
  onClose,
  brandName = "ORO&CO",
  productName,
}: WarrantyModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="warranty-title"
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-sm border border-line bg-white shadow-2xl transition-all"
      >
        {/* Header con pattern dorato */}
        <div className="border-b border-line bg-pearl px-6 py-5 sm:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-6 w-6 text-gold" strokeWidth={1.8} />
              <div>
                <span className="eyebrow text-gold">Certificato Ufficiale</span>
                <h3 id="warranty-title" className="font-serif text-xl text-ink">
                  Garanzia &amp; Autenticità ORO&amp;CO
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Chiudi finestra"
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-graphite-soft transition-colors hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Contenuto */}
        <div className="space-y-6 p-6 sm:p-8">
          {productName ? (
            <div className="rounded-sm border border-line bg-pearl/40 p-3.5 text-xs text-graphite">
              <span className="font-semibold uppercase tracking-wider text-gold">Referenza:</span>{" "}
              <span className="font-medium text-ink">{productName}</span>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex gap-3">
              <Award className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <div>
                <h4 className="font-medium text-sm text-ink">Originalità 100% Garantita</h4>
                <p className="mt-1 text-xs leading-relaxed text-graphite">
                  Ogni gioiello o orologio proviene direttamente dalle case madri ufficiali ({brandName}) con sigillo di garanzia intatto.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Gem className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <div>
                <h4 className="font-medium text-sm text-ink">Perizia Gemmologica</h4>
                <p className="mt-1 text-xs leading-relaxed text-graphite">
                  Metalli nobili (Oro 750‰ - 18kt o Argento 925‰) e gemme naturali selezionate e periziate con caratura incisa.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <div>
                <h4 className="font-medium text-sm text-ink">Lucidatura Gratuita a Vita</h4>
                <p className="mt-1 text-xs leading-relaxed text-graphite">
                  Servizio di controllo castoni, pulizia a ultrasuoni e rodiatura periodica sempre gratuiti presso il nostro banco a San Marzano sul Sarno.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <div>
                <h4 className="font-medium text-sm text-ink">Garanzia Legale 24 Mesi</h4>
                <p className="mt-1 text-xs leading-relaxed text-graphite">
                  Copertura totale su ogni difetto di conformità, con certificato timbrato e firmato da ORO&co — dal 1992.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-gold/30 bg-gold-tint/40 p-4 text-xs leading-relaxed text-graphite">
            <strong className="text-ink">Spedizione Assicurata al 100%:</strong> La spedizione viaggia con corriere blindato o espresso assicurato per l&apos;intero valore di fattura, con consegna tracciata e firma alla consegna.
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-line bg-pearl/30 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-gold"
          >
            Ho Capito
          </button>
        </div>
      </div>
    </div>
  );
}
