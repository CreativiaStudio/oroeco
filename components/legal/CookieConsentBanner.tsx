"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Settings2, Check } from "lucide-react";
import {
  getStoredConsent,
  saveConsent,
  updateGoogleConsentMode,
  ConsentCategories,
} from "@/lib/consent";
import { CookieSettingsModal } from "./CookieSettingsModal";

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = getStoredConsent();
    if (!stored) {
      setShowBanner(true);
    } else {
      // Re-apply stored consent to Google Consent Mode
      updateGoogleConsentMode(stored.categories);
    }

    // Listen to custom re-open request from footer
    const handleReopen = () => {
      setShowSettings(true);
    };
    window.addEventListener("oroeco_open_cookie_settings", handleReopen);
    return () => window.removeEventListener("oroeco_open_cookie_settings", handleReopen);
  }, []);

  if (!mounted) return null;

  const handleAcceptAll = async () => {
    const categories: ConsentCategories = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    await saveConsent(categories);
    setShowBanner(false);
  };

  const handleAcceptNecessary = async () => {
    const categories: ConsentCategories = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    await saveConsent(categories);
    setShowBanner(false);
  };

  return (
    <>
      {showBanner && (
        <aside
          role="region"
          aria-label="Consenso Cookie GDPR"
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pointer-events-none"
        >
          <div className="mx-auto max-w-5xl rounded-lg border border-[#E5E0D5] bg-white/95 p-5 sm:p-6 shadow-2xl backdrop-blur-md pointer-events-auto animate-fade-in-up">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Text */}
              <div className="flex items-start gap-3.5 max-w-2xl">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0A0A0A] text-[#C5A059] shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <h3 className="font-serif text-sm sm:text-base font-semibold text-[#0A0A0A]">
                    La Tua Riservatezza nell&apos;Atelier ORO&amp;CO
                  </h3>
                  <p className="text-xs text-graphite-soft leading-relaxed">
                    Utilizziamo cookie tecnici per garantire la corretta funzionalità del carrello e,
                    previo tuo consenso, cookie analitici e di marketing per offrirti
                    un&apos;esperienza sartoriale e annunci dedicati. Puoi modificare le tue scelte in
                    qualsiasi momento. Consulta la nostra{" "}
                    <Link
                      href="/privacy-policy"
                      className="text-[#C5A059] underline underline-offset-2 hover:text-[#A88038]"
                    >
                      Informativa Privacy
                    </Link>{" "}
                    e la{" "}
                    <Link
                      href="/cookie-policy"
                      className="text-[#C5A059] underline underline-offset-2 hover:text-[#A88038]"
                    >
                      Cookie Policy
                    </Link>
                    .
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 lg:justify-end">
                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-[#E5E0D5] bg-white px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-graphite transition-colors hover:border-[#C5A059] hover:text-[#C5A059]"
                >
                  <Settings2 className="h-3.5 w-3.5 text-[#C5A059]" />
                  <span>Personalizza</span>
                </button>
                <button
                  type="button"
                  onClick={handleAcceptNecessary}
                  className="rounded-sm border border-[#E5E0D5] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-graphite transition-colors hover:bg-[#F8F7F4]"
                >
                  Solo Necessari
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="rounded-sm bg-[#0A0A0A] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#C5A059] shadow-sm transition-colors hover:bg-black"
                >
                  Accetta Tutti
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Settings Modal */}
      <CookieSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        initialCategories={getStoredConsent()?.categories}
        onSave={() => setShowBanner(false)}
      />
    </>
  );
}
