import type { Metadata } from "next";
import Link from "next/link";
import { Truck, RotateCcw, ShieldCheck, Box, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Spedizioni Assicurate & Resi — ORO&CO Gioielleria",
  description:
    "Informazioni sulle spedizioni assicurate con portavalori, soglia di spedizione gratuita oltre 150€ e procedura di recesso entro 14 giorni.",
};

export default function SpedizioniResiPage() {
  return (
    <main className="min-h-screen bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        {/* Header */}
        <div className="border-b border-[#E5E0D5] pb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FAF8F5] px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-[#C5A059] border border-[#E5E0D5]">
            <Truck className="h-4 w-4" />
            <span>Logistica di Lusso &amp; Sicurezza</span>
          </div>
          <h1 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#0A0A0A]">
            Spedizioni Assicurate &amp; Diritto di Recesso
          </h1>
          <p className="mt-3 text-sm text-graphite-soft">
            Consegne blindate in tutta Italia · Reso garantito entro 14 giorni
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral max-w-none pt-10 text-graphite space-y-8 leading-relaxed">
          {/* Section 1: Spedizioni */}
          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-[#0A0A0A] flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-[#C5A059]" />
              <span>1. Spedizione Blindata &amp; Assicurata al 100%</span>
            </h2>
            <p className="text-sm">
              Tutti i preziosi e gli orologi spediti dalla gioielleria ORO&amp;CO viaggiano con
              copertura assicurativa integrale contro furto, smarrimento o danneggiamento durante il
              trasporto.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="rounded-lg border border-[#E5E0D5] bg-[#FAF8F5] p-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C5A059] block">
                  Costi di Spedizione
                </span>
                <p className="font-serif text-lg font-bold text-ink">Gratuita oltre 150 €</p>
                <p className="text-xs text-graphite-soft">
                  Per ordini inferiori a 150,00 €, il contributo fisso per la spedizione assicurata è
                  di soli 9,90 €.
                </p>
              </div>

              <div className="rounded-lg border border-[#E5E0D5] bg-[#FAF8F5] p-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C5A059] block">
                  Tempi di Consegna
                </span>
                <p className="font-serif text-lg font-bold text-ink">24 / 48 Ore</p>
                <p className="text-xs text-graphite-soft">
                  Consegna rapida su tutto il territorio nazionale (72 ore per isole maggiori e zone
                  remote) con tracciamento real-time.
                </p>
              </div>

              <div className="rounded-lg border border-[#E5E0D5] bg-[#FAF8F5] p-4 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#C5A059] block">
                  Packaging Luxury
                </span>
                <p className="font-serif text-lg font-bold text-ink">Cofanetto Regalo</p>
                <p className="text-xs text-graphite-soft">
                  Ogni gioiello viene adagiato nel cofanetto ufficiale con nastro di raso, shopper di
                  gioielleria e certificato di garanzia.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Reso */}
          <section className="space-y-4 pt-4">
            <h2 className="font-serif text-2xl font-semibold text-[#0A0A0A] flex items-center gap-2">
              <RotateCcw className="h-6 w-6 text-[#C5A059]" />
              <span>2. Diritto di Recesso &amp; Reso Semplice (14 Giorni)</span>
            </h2>
            <p className="text-sm">
              Ai sensi dell&apos;art. 52 del D.Lgs. 206/2005 (Codice del Consumo), hai il diritto di
              recedere dal contratto di acquisto, senza alcuna penalità e senza specificarne il
              motivo, entro il termine di <strong>14 (quattordici) giorni</strong> decorrenti dal
              giorno del ricevimento dei prodotti.
            </p>

            <div className="rounded-lg border border-[#E5E0D5] p-5 space-y-3 bg-white">
              <h3 className="font-serif text-base font-semibold text-[#0A0A0A]">
                Come Effettuare un Reso in 3 Passi:
              </h3>
              <ol className="list-decimal pl-5 space-y-2 text-xs">
                <li>
                  <strong>Notifica:</strong> invia una comunicazione scritta via email a{" "}
                  <a href="mailto:info@oroeco.it" className="text-[#C5A059] underline">
                    info@oroeco.it
                  </a>{" "}
                  o via WhatsApp al numero +39 340 373 7604 indicando il numero d&apos;ordine.
                </li>
                <li>
                  <strong>Imballaggio:</strong> riponi il gioiello nel suo cofanetto originale
                  completo di certificato gemmologico e sigillo di sicurezza intatto.
                </li>
                <li>
                  <strong>Ritiro Assicurato:</strong> programmeremo il ritiro tramite nostro corriere
                  fiduciario assicurato direttamente al tuo indirizzo.
                </li>
              </ol>
            </div>

            <p className="text-xs text-graphite-soft leading-relaxed">
              * Nota: per motivi di sicurezza e conformità, il diritto di recesso non si applica ai
              gioielli confezionati su misura o chiaramente personalizzati (es. incisioni
              personalizzate su fedi o anelli richieste dal cliente).
            </p>
          </section>
        </div>

        {/* Back Link */}
        <div className="mt-12 border-t border-[#E5E0D5] pt-6 flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
          <Link href="/" className="text-[#C5A059] hover:underline">
            &larr; Torna alla Gioielleria
          </Link>
          <Link href="/termini-e-condizioni" className="text-graphite-soft hover:text-black">
            Termini &amp; Condizioni &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
