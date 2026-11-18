"use client";

import { useEffect } from "react";
import { Ruler, MessageSquare, X, Info } from "lucide-react";

interface RingSizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ringSizes = [
  { it: 8, diam: 15.28, circ: 48.0 },
  { it: 9, diam: 15.61, circ: 49.0 },
  { it: 10, diam: 15.92, circ: 50.0 },
  { it: 11, diam: 16.24, circ: 51.0 },
  { it: 12, diam: 16.56, circ: 52.0 },
  { it: 13, diam: 16.88, circ: 53.0 },
  { it: 14, diam: 17.20, circ: 54.0 },
  { it: 15, diam: 17.52, circ: 55.0 },
  { it: 16, diam: 17.83, circ: 56.0 },
  { it: 17, diam: 18.15, circ: 57.0 },
  { it: 18, diam: 18.47, circ: 58.0 },
  { it: 19, diam: 18.79, circ: 59.0 },
  { it: 20, diam: 19.11, circ: 60.0 },
  { it: 22, diam: 19.75, circ: 62.0 },
  { it: 24, diam: 20.38, circ: 64.0 },
  { it: 26, diam: 21.02, circ: 66.0 },
];

export function RingSizeGuideModal({ isOpen, onClose }: RingSizeGuideModalProps) {
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
        aria-labelledby="ring-guide-title"
        className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-sm border border-line bg-white shadow-2xl transition-all"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-line bg-pearl px-6 py-4 sm:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Ruler className="h-5 w-5 text-gold" strokeWidth={1.8} />
              <div>
                <span className="eyebrow text-gold">Misure Ufficiali</span>
                <h3 id="ring-guide-title" className="font-serif text-xl text-ink">
                  Guida alle Taglie Anelli
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

        {/* Istruzioni pratiche */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="rounded-sm border border-line bg-pearl/40 p-4 text-xs leading-relaxed text-graphite space-y-2">
            <div className="flex items-center gap-2 font-medium text-ink">
              <Info className="h-4 w-4 text-gold shrink-0" />
              Come misurare il tuo dito o un anello esistente:
            </div>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Metodo Diametro:</strong> Prendi un anello che ti calza bene e misura il <em>diametro interno esatto</em> con un righello o calibro (escludendo il bordo).</li>
              <li><strong>Metodo Circonferenza:</strong> Avvolgi una striscia di carta o un filo intorno al dito, segna il punto di incontro con una penna e misura la lunghezza in mm.</li>
              <li>In caso di dubbio tra due misure, ti consigliamo sempre di scegliere la <strong>misura più grande</strong>.</li>
            </ul>
          </div>

          {/* Tabella taglie */}
          <div>
            <h4 className="font-serif text-sm text-ink mb-3">Tabella di Conversione Standard Italia / Europa</h4>
            <div className="overflow-x-auto rounded-sm border border-line">
              <table className="w-full text-left text-xs">
                <thead className="bg-pearl text-graphite border-b border-line">
                  <tr>
                    <th className="px-3 py-2 font-semibold uppercase tracking-wider">Misura IT</th>
                    <th className="px-3 py-2 font-semibold uppercase tracking-wider">Diametro (mm)</th>
                    <th className="px-3 py-2 font-semibold uppercase tracking-wider">Circonferenza (mm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-ink">
                  {ringSizes.map((row) => (
                    <tr key={row.it} className="hover:bg-pearl/30 transition-colors">
                      <td className="px-3 py-2 font-semibold text-gold">{row.it}</td>
                      <td className="px-3 py-2">{row.diam.toFixed(2)} mm</td>
                      <td className="px-3 py-2">{row.circ.toFixed(1)} mm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* WhatsApp Helper */}
          <div className="rounded-sm border border-gold/30 bg-gold-tint/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-graphite">
              <strong className="text-ink">Dubbi sulla misura?</strong>
              <p>Il nostro laboratorio orafo effettua la messa a misura gratuita per quasi tutti i modelli.</p>
            </div>
            <a
              href="https://wa.me/393518778689?text=Salve%20vorrei%20consulenza%20su%20misura%20anello"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 shrink-0 rounded-sm bg-green-700 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-green-800 transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Chiedi a Renato
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-line bg-pearl/40 px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm bg-ink px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-gold transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
