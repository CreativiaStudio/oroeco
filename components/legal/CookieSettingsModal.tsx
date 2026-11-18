"use client";

import { useState } from "react";
import { ShieldCheck, X, Check, Lock } from "lucide-react";
import { ConsentCategories, saveConsent } from "@/lib/consent";

interface CookieSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategories?: ConsentCategories;
  onSave?: (categories: ConsentCategories) => void;
}

export function CookieSettingsModal({
  isOpen,
  onClose,
  initialCategories = { necessary: true, analytics: false, marketing: false, preferences: false },
  onSave,
}: CookieSettingsModalProps) {
  const [analytics, setAnalytics] = useState(initialCategories.analytics);
  const [marketing, setMarketing] = useState(initialCategories.marketing);
  const [preferences, setPreferences] = useState(initialCategories.preferences);

  if (!isOpen) return null;

  const handleSave = async () => {
    const categories: ConsentCategories = {
      necessary: true,
      analytics,
      marketing,
      preferences,
    };
    await saveConsent(categories);
    if (onSave) onSave(categories);
    onClose();
  };

  const handleAcceptAll = async () => {
    const categories: ConsentCategories = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    await saveConsent(categories);
    if (onSave) onSave(categories);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-lg border border-[#E5E0D5] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E0D5] bg-[#F8F7F4] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#0A0A0A] text-[#C5A059]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-serif text-lg font-semibold text-[#0A0A0A]">
                Preferenze di Riservatezza &amp; Cookie
              </h3>
              <p className="text-xs text-graphite-soft">
                Conformità GDPR (Reg. UE 2016/679) · ORO&amp;CO Gioielleria
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1.5 text-graphite-soft hover:bg-black/5 hover:text-black transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Categories */}
        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-5 divide-y divide-[#EFEAE0]">
          {/* 1. Necessari */}
          <div className="pt-2 first:pt-0">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-sm font-semibold text-ink">
                    1. Cookie Tecnici &amp; Necessari
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-[#EFEAE0] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-graphite">
                    <Lock className="h-3 w-3 text-[#C5A059]" />
                    Sempre Attivi
                  </span>
                </div>
                <p className="text-xs text-graphite-soft leading-relaxed">
                  Indispensabili per la sicurezza della gioielleria online, la memorizzazione del
                  carrello, la chiusura degli ordini e la registrazione legale del consenso. Non
                  possono essere disattivati.
                </p>
              </div>
              <div className="pt-1">
                <div className="h-5 w-9 rounded-full bg-emerald-600 p-0.5 cursor-not-allowed opacity-90">
                  <div className="h-4 w-4 rounded-full bg-white shadow-sm translate-x-4" />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Analitici */}
          <div className="pt-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="font-serif text-sm font-semibold text-ink">
                  2. Cookie Analitici &amp; Misurazione Prestazioni
                </span>
                <p className="text-xs text-graphite-soft leading-relaxed">
                  Ci permettono di raccogliere dati statistici aggregati e rigorosamente anonimizzati
                  tramite Google Analytics 4 (GA4 con IP mascherato) per comprendere le collezioni
                  più apprezzate e migliorare l&apos;esperienza utente.
                </p>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setAnalytics(!analytics)}
                  className={`h-5 w-9 rounded-full p-0.5 transition-colors cursor-pointer ${
                    analytics ? "bg-[#C5A059]" : "bg-neutral-300"
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      analytics ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* 3. Marketing & Profilazione */}
          <div className="pt-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="font-serif text-sm font-semibold text-ink">
                  3. Cookie di Marketing &amp; Retargeting Luxury
                </span>
                <p className="text-xs text-graphite-soft leading-relaxed">
                  Utilizzati per mostrarti comunicazioni riservate, promozioni speciali e annunci
                  personalizzati sulle nostre creazioni su piattaforme esterne (Meta Pixel e Google
                  Ads). Se disattivati, vedrai annunci generici non personalizzati.
                </p>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setMarketing(!marketing)}
                  className={`h-5 w-9 rounded-full p-0.5 transition-colors cursor-pointer ${
                    marketing ? "bg-[#C5A059]" : "bg-neutral-300"
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      marketing ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* 4. Funzionali & Preferenze */}
          <div className="pt-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="font-serif text-sm font-semibold text-ink">
                  4. Cookie di Preferenza &amp; Funzionalità
                </span>
                <p className="text-xs text-graphite-soft leading-relaxed">
                  Consentono al sito di ricordare scelte personalizzate, come i gioielli salvati
                  nella Wishlist personale e i filtri di caratura e metallo applicati nel catalogo.
                </p>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setPreferences(!preferences)}
                  className={`h-5 w-9 rounded-full p-0.5 transition-colors cursor-pointer ${
                    preferences ? "bg-[#C5A059]" : "bg-neutral-300"
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      preferences ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E0D5] bg-[#FAF8F5] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold uppercase tracking-wider text-graphite-soft hover:text-black transition-colors"
          >
            Annulla
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-sm border border-[#C5A059] bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#C5A059] transition-colors hover:bg-[#F8F7F4]"
            >
              Salva Selezione
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="rounded-sm bg-[#0A0A0A] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#C5A059] shadow transition-colors hover:bg-black"
            >
              Accetta Tutti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
