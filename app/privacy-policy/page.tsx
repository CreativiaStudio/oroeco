import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Mail, MapPin, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Informativa sulla Privacy (GDPR) — ORO&CO Gioielleria",
  description:
    "Informativa sul trattamento dei dati personali ai sensi del Regolamento UE 2016/679 (GDPR) per i clienti e visitatori della gioielleria ORO&CO.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        {/* Header */}
        <div className="border-b border-[#E5E0D5] pb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#FAF8F5] px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-[#C5A059] border border-[#E5E0D5]">
            <ShieldCheck className="h-4 w-4" />
            <span>Regolamento UE 2016/679 (GDPR)</span>
          </div>
          <h1 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#0A0A0A]">
            Informativa sul Trattamento dei Dati Personali
          </h1>
          <p className="mt-3 text-sm text-graphite-soft">
            Ultimo aggiornamento: Novembre 2026 · Versione Policy: 2026.1
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral max-w-none pt-10 text-graphite space-y-8 leading-relaxed">
          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-semibold text-[#0A0A0A]">
              1. Titolare del Trattamento
            </h2>
            <p>
              Il Titolare del trattamento dei dati personali raccolti attraverso questo sito web è:
            </p>
            <div className="rounded-lg border border-[#E5E0D5] bg-[#FAF8F5] p-5 space-y-2 text-sm">
              <p className="font-semibold text-[#0A0A0A]">
                ORO&amp;CO Gioielleria
              </p>
              <p className="flex items-center gap-2 text-graphite">
                <MapPin className="h-4 w-4 text-[#C5A059] shrink-0" />
                <span>San Marzano sul Sarno (SA) · Italia</span>
              </p>
              <p className="flex items-center gap-2 text-graphite">
                <Phone className="h-4 w-4 text-[#C5A059] shrink-0" />
                <span>Gioielleria: +39 340 373 7604</span>
              </p>
              <p className="flex items-center gap-2 text-graphite">
                <Mail className="h-4 w-4 text-[#C5A059] shrink-0" />
                <span>Email Privacy: info@oroeco.it</span>
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-semibold text-[#0A0A0A]">
              2. Dati Raccolti e Finalità del Trattamento
            </h2>
            <p>I dati personali forniti dall&apos;utente sono trattati per le seguenti finalità:</p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                <strong>Gestione Ordini e Spedizioni Assicurate:</strong> elaborazione degli ordini
                e-commerce, spedizione dei gioielli con corrieri fiduciari portavalori, comunicazioni
                sullo stato della spedizione.
              </li>
              <li>
                <strong>Adempimenti Fiscali e Contabili:</strong> emissione di scontrino fiscale
                telematico (tramite registratore di cassa Aura RT) o fattura elettronica tramite il
                Sistema di Interscambio (SDI) dell&apos;Agenzia delle Entrate (obbligo ex art. 2220 c.c.).
              </li>
              <li>
                <strong>Assistenza Clienti e Garanzie:</strong> gestione del post-vendita,
                rilascio dei certificati di autenticità e gemmologici, gestione garanzia legale di 24
                mesi.
              </li>
              <li>
                <strong>Analisi Statistica e Miglioramento (previo consenso):</strong> monitoraggio
                aggregato e anonimizzato del traffico tramite Google Analytics 4 con IP mascherato.
              </li>
              <li>
                <strong>Marketing e Annunci Personalizzati (previo consenso):</strong> comunicazioni
                commerciali riservate e retargeting tramite Meta Pixel e Google Ads.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-semibold text-[#0A0A0A]">
              3. Registro Consensi con Prova Elettronica (Art. 7.1 GDPR)
            </h2>
            <p>
              In ottemperanza al principio di responsabilizzazione (accountability), ORO&amp;CO
              registra su database sicuro un identificativo univoco (<code>consent_id</code>) associato
              a un identificativo tecnico anonimo (<code>visitor_id</code>), con timestamp ISO,
              categorie consentite, hash dell&apos;IP e versione della policy. Tale registro
              costituisce la prova inattaccabile del consenso espresso liberamente dall&apos;utente.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-semibold text-[#0A0A0A]">
              4. Conservazione dei Dati
            </h2>
            <p>
              I dati fiscali e di fatturazione sono conservati per un periodo minimo di 10 anni in
              ottemperanza alle vigenti disposizioni del Codice Civile e della normativa tributaria
              italiana. I dati relativi al consenso privacy sono conservati per la durata della sessione
              o fino alla revoca dello stesso.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-2xl font-semibold text-[#0A0A0A]">
              5. Diritti dell&apos;Interessato (Artt. 15-22 GDPR)
            </h2>
            <p>In ogni momento, l&apos;utente ha il diritto di:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Chiedere la conferma dell&apos;esistenza o meno di propri dati personali;</li>
              <li>Ottenerne l&apos;accesso, la rettifica o la cancellazione (diritto all&apos;oblio);</li>
              <li>Chiedere la limitazione del trattamento o opporsi allo stesso;</li>
              <li>Richiedere la portabilità dei dati in formato strutturato e leggibile da dispositivo automatico;</li>
              <li>Proporre reclamo all&apos;Autorità Garante per la Protezione dei Dati Personali (Piazza Venezia 11, 00187 Roma, www.garanteprivacy.it).</li>
            </ul>
            <p className="text-sm">
              Per esercitare tali diritti è sufficiente inviare una comunicazione a{" "}
              <a href="mailto:info@oroeco.it" className="text-[#C5A059] underline">
                info@oroeco.it
              </a>
              .
            </p>
          </section>
        </div>

        {/* Back Link */}
        <div className="mt-12 border-t border-[#E5E0D5] pt-6 flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
          <Link href="/" className="text-[#C5A059] hover:underline">
            &larr; Torna alla Gioielleria
          </Link>
          <Link href="/cookie-policy" className="text-graphite-soft hover:text-black">
            Consulta la Cookie Policy &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
