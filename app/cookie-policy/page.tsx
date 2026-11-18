import type { Metadata } from "next";
import Link from "next/link";
import { Cookie, ShieldCheck, Settings2 } from "lucide-react";
import { CookiePolicyClient } from "@/components/legal/CookiePolicyClient";

export const metadata: Metadata = {
  title: "Informativa sui Cookie (Cookie Policy) — ORO&CO Gioielleria",
  description:
    "Informativa estesa sull'uso dei cookie e delle tecnologie di tracciamento conforme alle Linee Guida del Garante Privacy e al GDPR.",
};

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        {/* Header */}
        <div className="border-b border-[#E5E0D5] pb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FAF8F5] px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-[#C5A059] border border-[#E5E0D5]">
            <Cookie className="h-4 w-4" />
            <span>Linee Guida Cookie Garante Privacy 2021 &amp; GDPR</span>
          </div>
          <h1 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#0A0A0A]">
            Informativa Estesa sui Cookie
          </h1>
          <p className="mt-3 text-sm text-graphite-soft">
            Atelier ORO&amp;CO · Versione Policy 2026.1
          </p>
        </div>

        {/* Client Interactive Settings Button */}
        <CookiePolicyClient />

        {/* Content */}
        <div className="prose prose-neutral max-w-none pt-8 text-graphite space-y-8 leading-relaxed">
          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-semibold text-[#0A0A0A]">
              1. Cosa Sono i Cookie
            </h2>
            <p className="text-sm">
              I cookie sono brevi file di testo che i siti visitati inviano al terminale
              dell&apos;utente (computer, smartphone, tablet), dove vengono memorizzati per essere
              ritrasmessi agli stessi siti alla visita successiva. ORO&amp;CO utilizza i cookie per
              garantire la sicurezza e la piena funzionalità dell&apos;e-commerce e, solo previo tuo
              esplicito consenso, per finalità analitiche e promozionali.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-[#0A0A0A]">
              2. Tipologie di Cookie Utilizzati
            </h2>

            {/* Table Tecnici */}
            <div className="rounded-lg border border-[#E5E0D5] overflow-hidden">
              <div className="bg-[#FAF8F5] px-4 py-3 font-semibold text-sm text-[#0A0A0A] flex items-center justify-between">
                <span>A. Cookie Tecnici &amp; Strettamente Necessari</span>
                <span className="text-xs text-[#C5A059] font-mono uppercase">Esenzione Consenso Art. 122</span>
              </div>
              <div className="p-4 text-xs space-y-2 text-graphite">
                <p>
                  Questi cookie sono indispensabili per navigare nel sito e utilizzare funzioni di
                  base come il carrello acquisti, la gestione della sessione di cassa e la sicurezza
                  anti-frode. Senza questi cookie i servizi richiesti non possono essere forniti.
                </p>
                <ul className="list-disc pl-5 space-y-1 font-mono text-[0.72rem] text-graphite-soft">
                  <li><code>oroeco_cookie_consent_v1</code>: memorizza la scelta privacy effettuata (durata: 6 mesi).</li>
                  <li><code>oroeco_visitor_id</code>: identificativo tecnico univoco della sessione browser.</li>
                  <li><code>oroeco_cart_state</code>: persistenza locale del carrello gioielli.</li>
                </ul>
              </div>
            </div>

            {/* Table Analitici */}
            <div className="rounded-lg border border-[#E5E0D5] overflow-hidden">
              <div className="bg-[#FAF8F5] px-4 py-3 font-semibold text-sm text-[#0A0A0A] flex items-center justify-between">
                <span>B. Cookie Analitici (Google Analytics 4 / GTM)</span>
                <span className="text-xs text-amber-700 font-mono uppercase">Richiede Consenso</span>
              </div>
              <div className="p-4 text-xs space-y-2 text-graphite">
                <p>
                  Raccolgono informazioni in forma aggregata sul numero dei visitatori e su come questi
                  interagiscono con la gioielleria online. Sono implementati con mascheramento dell&apos;indirizzo
                  IP e Google Consent Mode v2 attivato.
                </p>
                <ul className="list-disc pl-5 space-y-1 font-mono text-[0.72rem] text-graphite-soft">
                  <li><code>_ga</code>, <code>_ga_*</code>: statistiche di navigazione aggregate (durata: 14 mesi).</li>
                </ul>
              </div>
            </div>

            {/* Table Marketing */}
            <div className="rounded-lg border border-[#E5E0D5] overflow-hidden">
              <div className="bg-[#FAF8F5] px-4 py-3 font-semibold text-sm text-[#0A0A0A] flex items-center justify-between">
                <span>C. Cookie di Profilazione &amp; Marketing (Meta Pixel &amp; Google Ads)</span>
                <span className="text-xs text-amber-700 font-mono uppercase">Richiede Consenso</span>
              </div>
              <div className="p-4 text-xs space-y-2 text-graphite">
                <p>
                  Utilizzati per creare profili relativi all&apos;utente al fine di inviare messaggi
                  pubblicitari in linea con le preferenze manifestate durante la navigazione.
                </p>
                <ul className="list-disc pl-5 space-y-1 font-mono text-[0.72rem] text-graphite-soft">
                  <li><code>_fbp</code>: Meta Pixel per annunci riservati sui canali Facebook e Instagram (durata: 90 giorni).</li>
                  <li><code>_gcl_au</code>: Google Ads per attribuzione conversioni (durata: 90 giorni).</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-semibold text-[#0A0A0A]">
              3. Come Modificare le Scelte o Disabilitare i Cookie dal Browser
            </h2>
            <p className="text-sm">
              Oltre a utilizzare il nostro pannello interattivo delle preferenze, puoi configurare
              direttamente il tuo browser web per accettare o rifiutare tutti i cookie o cookie
              specifici:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><strong>Google Chrome:</strong> Impostazioni &gt; Privacy e sicurezza &gt; Cookie e altri dati dei siti.</li>
              <li><strong>Apple Safari:</strong> Preferenze &gt; Privacy &gt; Blocca tutti i cookie.</li>
              <li><strong>Mozilla Firefox:</strong> Opzioni &gt; Privacy e sicurezza &gt; Cookie e dati dei siti web.</li>
              <li><strong>Microsoft Edge:</strong> Impostazioni &gt; Cookie e autorizzazioni del sito.</li>
            </ul>
          </section>
        </div>

        {/* Back Link */}
        <div className="mt-12 border-t border-[#E5E0D5] pt-6 flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
          <Link href="/" className="text-[#C5A059] hover:underline">
            &larr; Torna alla Gioielleria
          </Link>
          <Link href="/privacy-policy" className="text-graphite-soft hover:text-black">
            Informativa Privacy &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
