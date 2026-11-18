"use client";

import { useEffect, useState } from "react";
import { Settings2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { getStoredConsent, ConsentRecord } from "@/lib/consent";
import { CookieSettingsModal } from "./CookieSettingsModal";

export function CookiePolicyClient() {
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setConsent(getStoredConsent());
    const handleUpdate = () => setConsent(getStoredConsent());
    window.addEventListener("oroeco_consent_updated", handleUpdate);
    return () => window.removeEventListener("oroeco_consent_updated", handleUpdate);
  }, []);

  return (
    <div className="my-8 rounded-lg border border-[#E5E0D5] bg-[#FAF8F5] p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="font-serif text-sm font-semibold text-[#0A0A0A]">
              Stato Attuale del Tuo Consenso
            </span>
          </div>
          <p className="text-xs text-graphite-soft">
            {consent ? (
              <>
                ID Consenso: <code className="font-mono text-[0.7rem] bg-white px-1 py-0.5 rounded border border-[#E5E0D5]">{consent.consentId}</code> · Registrato il:{" "}
                {new Date(consent.timestamp).toLocaleDateString("it-IT", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </>
            ) : (
              "Nessuna preferenza salvata (verranno applicate solo le impostazioni strettamente necessarie)."
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-sm bg-[#0A0A0A] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#C5A059] shadow transition-colors hover:bg-black shrink-0 cursor-pointer"
        >
          <Settings2 className="h-4 w-4 text-[#C5A059]" />
          <span>Modifica Preferenze Cookie</span>
        </button>
      </div>

      <CookieSettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialCategories={consent?.categories}
        onSave={() => setConsent(getStoredConsent())}
      />
    </div>
  );
}
