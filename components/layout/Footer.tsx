"use client";

import Link from "next/link";
import { Clock, MapPin, MessageSquare, Phone, ShieldCheck, Cookie } from "lucide-react";
import { InstagramFeedStrip } from "@/components/layout/InstagramFeedStrip";
import { Logo } from "@/components/layout/Logo";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import { PaymentLogos } from "@/components/layout/PaymentLogos";
import { OFFICIAL_STORE_HOURS } from "@/lib/brandPolicy";

const collections = [
  { label: "Gioielli", href: "/gioielli" },
  { label: "Orologi", href: "/orologi" },
  { label: "Accessori", href: "/accessori" },
  { label: "Casa & Arredo", href: "/casa" },
  { label: "Brand", href: "/brand" },
  { label: "Speciale Natale", href: "/natale" },
];

const assistance = [
  { label: "Spedizioni e Resi", href: "/spedizioni-e-resi" },
  { label: "Garanzia e Certificati", href: "/storia#garanzie" },
  { label: "Pagamenti e Finanziamenti", href: "/storia#pagamenti" },
  { label: "Privacy Policy (GDPR)", href: "/privacy-policy" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Termini e Condizioni", href: "/termini-e-condizioni" },
];

function InstagramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

/** Footer Maison di lusso: striscia Instagram, newsletter nel blu firma, colonne e pagamenti. */
export function Footer() {
  const openCookieSettings = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("oroeco_open_cookie_settings"));
    }
  };

  return (
    <footer className="mt-24">
      {/* Sezione Superiore — Striscia Instagram della Gioielleria */}
      <InstagramFeedStrip />

      {/* Sezione Centrale — Newsletter & Colonne nel Blu Firma */}
      <div className="bg-[#012236] text-white">
        {/* Fascia Newsletter */}
        <div className="border-b border-white/10 py-14">
          <div className="container-luxe grid items-center gap-8 lg:grid-cols-[1.3fr_1fr]">
            <div className="space-y-3">
              <span className="eyebrow text-gold-soft">La Maison ORO&amp;CO</span>
              <h2 className="max-w-lg font-serif text-3xl uppercase tracking-[0.1em] text-white">
                Entra nel mondo ORO&amp;CO
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-white/60">
                Dal 1992 selezioniamo gioielli, orologi e oggetti preziosi a San Marzano sul Sarno.
                <br className="hidden sm:inline" />
                Iscriviti alla newsletter per scoprire le novità in anteprima e le edizioni speciali.
              </p>
            </div>
            <div className="lg:justify-self-end">
              <NewsletterForm tone="dark" />
            </div>
          </div>
        </div>

        {/* 4 Colonne ariose */}
        <div className="container-luxe grid grid-cols-1 gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
          {/* Colonna 1: Identità & Autenticità */}
          <div className="space-y-5">
            <Logo variant="wordmark" tone="light" className="h-12" />
            <p className="max-w-xs text-sm leading-relaxed text-white/60">
              Gioielleria e Alta Orologeria dal 1992. Periti gemmologi, pezzi
              certificati e assistenza al banco di Renato e famiglia.
            </p>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-gold-soft">
              <ShieldCheck className="h-4 w-4" strokeWidth={1.6} />
              Autenticità certificata 100%
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={openCookieSettings}
                className="inline-flex items-center gap-2 rounded-sm border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition-colors hover:border-gold hover:text-gold"
              >
                <Cookie className="h-3.5 w-3.5" />
                Gestisci preferenze cookie
              </button>
            </div>
          </div>

          {/* Colonna 2: Collezioni */}
          <div className="space-y-4">
            <h3 className="font-serif text-xs uppercase tracking-[0.26em] text-gold-soft">
              Collezioni
            </h3>
            <ul className="space-y-2.5">
              {collections.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="link-luxe text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonna 3: Assistenza & Legale */}
          <div className="space-y-4">
            <h3 className="font-serif text-xs uppercase tracking-[0.26em] text-gold-soft">
              Assistenza &amp; Legale
            </h3>
            <ul className="space-y-2.5">
              {assistance.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="link-luxe text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonna 4: Gioielleria & Concierge */}
          <div className="space-y-5">
            <h3 className="font-serif text-xs uppercase tracking-[0.26em] text-gold-soft">
              Gioielleria &amp; Concierge
            </h3>
            <ul className="space-y-4 text-sm text-white/70">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.6} />
                <span>
                  Via Filippo Turati, n. 30 — 84010 San Marzano sul Sarno (SA)
                </span>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.6} />
                <a href="tel:+390815186476" className="hover:text-white">
                  081 518 6476
                </a>
              </li>
              <li className="flex gap-3">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.6} />
                <a
                  href="https://wa.me/393518778689"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  WhatsApp: 351 877 8689
                </a>
              </li>
              <li className="flex gap-3">
                <InstagramIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <a
                  href="https://www.instagram.com/gioielleria_oroeco/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  @gioielleria_oroeco
                </a>
              </li>
              <li className="flex gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.6} />
                <span className="flex flex-col gap-0.5 leading-snug">
                  <span>{OFFICIAL_STORE_HOURS.monday}</span>
                  <span>{OFFICIAL_STORE_HOURS.tueSat}</span>
                  <span className="text-gold-soft">{OFFICIAL_STORE_HOURS.december}</span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sezione Finale — Pagamenti & Copyright */}
      <div className="border-t border-white/10 bg-[#011929] py-8">
        <div className="container-luxe flex flex-col items-center justify-between gap-6 lg:flex-row">
          <div className="flex flex-col items-center gap-3 lg:items-start">
            <span className="text-[0.62rem] uppercase tracking-[0.18em] text-white/50">
              Pagamenti protetti
            </span>
            <PaymentLogos />
          </div>

          <div className="flex flex-col items-center gap-1.5 text-center lg:items-end lg:text-right">
            <p className="text-xs text-white/45">
              © {new Date().getFullYear()} ORO&amp;CO Gioielleria di Calabrese Speranza — P.IVA 03525160655
            </p>
            <p className="text-xs text-white/45">
              Sviluppato da{" "}
              <a
                href="https://www.creativiastudio.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gold-soft underline-offset-4 transition-colors hover:text-gold hover:underline"
              >
                Creativia Studio
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
