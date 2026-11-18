import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ShieldCheck, Scale, Award } from "lucide-react";

export const metadata: Metadata = {
  title: "Termini e Condizioni di Vendita — ORO&CO Gioielleria",
  description:
    "Condizioni generali di vendita e-commerce, garanzie legali di autenticità e modalità di acquisto per i gioielli e gli orologi della gioielleria ORO&CO.",
};

export default function TerminiCondizioniPage() {
  return (
    <main className="min-h-screen bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        {/* Header */}
        <div className="border-b border-[#E5E0D5] pb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FAF8F5] px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-[#C5A059] border border-[#E5E0D5]">
            <Scale className="h-4 w-4" />
            <span>Condizioni Generali di Vendita E-Commerce</span>
          </div>
          <h1 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#0A0A0A]">
            Termini &amp; Condizioni di Vendita
          </h1>
          <p className="mt-3 text-sm text-graphite-soft">
            Gioielleria ORO&amp;CO dal 1992 · San Marzano sul Sarno
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral max-w-none pt-10 text-graphite space-y-8 leading-relaxed">
          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-semibold text-[#0A0A0A]">
              1. Oggetto del Contratto
            </h2>
            <p className="text-sm">
              Le presenti Condizioni Generali di Vendita disciplinano l&apos;acquisto a distanza di
              creazioni di alta gioielleria, orologeria, argenteria e articoli da regalo effettuato
              tramite la piattaforma web ufficiale di <strong>ORO&amp;CO Gioielleria</strong> da
              parte di consumatori finali e professionisti.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-semibold text-[#0A0A0A]">
              2. Prezzi, IVA e Fatturazione Fiscale
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                Tutti i prezzi visualizzati nel catalogo online sono espressi in <strong>Euro (€)</strong> e
                si intendono <strong>comprensivi di IVA al 22%</strong>.
              </li>
              <li>
                Per ogni ordine completato viene emesso regolare scontrino fiscale telematico o,
                qualora il cliente ne faccia esplicita richiesta indicando Partita IVA o Codice
                Fiscale e codice destinatario SDI/PEC, fattura elettronica inviata tramite il
                Sistema di Interscambio.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-semibold text-[#0A0A0A]">
              3. Modalità di Pagamento Sicuro
            </h2>
            <p className="text-sm">
              La sicurezza dei pagamenti è garantita da protocolli di cifratura SSL a 256 bit. Sono
              accettati i seguenti metodi:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div className="rounded border border-[#E5E0D5] bg-[#FAF8F5] p-3 space-y-1">
                <span className="font-bold text-[#0A0A0A]">Carte di Credito &amp; Debito</span>
                <p className="text-graphite-soft">Visa, Mastercard, American Express tramite gateway Stripe.</p>
              </div>
              <div className="rounded border border-[#E5E0D5] bg-[#FAF8F5] p-3 space-y-1">
                <span className="font-bold text-[#0A0A0A]">PayPal &amp; Paga in 3 Rate</span>
                <p className="text-graphite-soft">Pagamento istantaneo o dilazionato in 3 rate mensili a tasso zero.</p>
              </div>
              <div className="rounded border border-[#E5E0D5] bg-[#FAF8F5] p-3 space-y-1">
                <span className="font-bold text-[#0A0A0A]">Klarna</span>
                <p className="text-graphite-soft">Paga in 3 rate senza interessi per acquisti fino a 2.000 €.</p>
              </div>
              <div className="rounded border border-[#E5E0D5] bg-[#FAF8F5] p-3 space-y-1">
                <span className="font-bold text-[#0A0A0A]">Bonifico Bancario Anticipato</span>
                <p className="text-graphite-soft">Spedizione avviata al momento dell&apos;effettivo accredito contabile.</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-semibold text-[#0A0A0A]">
              4. Garanzia di Autenticità &amp; Certificati Gemmologici
            </h2>
            <div className="rounded-lg border border-[#C5A059]/40 bg-[#FAF8F5] p-5 space-y-2 text-sm">
              <div className="flex items-center gap-2 font-serif font-semibold text-[#0A0A0A]">
                <Award className="h-5 w-5 text-[#C5A059]" />
                <span>Garanzia Ufficiale e Certificato Atelier</span>
              </div>
              <p className="text-xs text-graphite leading-relaxed">
                Ogni gioiello in oro 18 kt (750‰), diamante naturale, pietra preziosa o perla è
                accompagnato dal relativo <strong>Certificato di Garanzia e Autenticità ORO&amp;CO</strong> con
                indicazione analitica di caratura, purezza, colore, taglio e peso in grammi. Tutti i
                prodotti beneficiano inoltre della <strong>Garanzia Legale di Conformità di 24 Mesi</strong> ai
                sensi degli artt. 128 e ss. del Codice del Consumo.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-semibold text-[#0A0A0A]">
              5. Foro Competente
            </h2>
            <p className="text-sm">
              Per qualsiasi controversia derivante dall&apos;applicazione o interpretazione delle
              presenti Condizioni Generali, se il cliente è un consumatore ai sensi del Codice del
              Consumo, la competenza territoriale inderogabile è del giudice del luogo di residenza o
              di domicilio del consumatore. Negli altri casi, è competente in via esclusiva il Foro di
              Nocera Inferiore (SA).
            </p>
          </section>
        </div>

        {/* Back Link */}
        <div className="mt-12 border-t border-[#E5E0D5] pt-6 flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
          <Link href="/" className="text-[#C5A059] hover:underline">
            &larr; Torna alla Gioielleria
          </Link>
          <Link href="/spedizioni-e-resi" className="text-graphite-soft hover:text-black">
            Spedizioni &amp; Resi &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
