"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { selectWishlistCount, useWishlistStore } from "@/store/useWishlistStore";

const WHATSAPP_CONCIERGE = "https://wa.me/393518778689";

export function AccountDrawer() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const wishlistCount = useWishlistStore(selectWishlistCount);

  const close = () => {
    setOpen(false);
    setFeedback(null);
  };

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("oroeco_open_account", handleOpen);
    return () => window.removeEventListener("oroeco_open_account", handleOpen);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setFeedback(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    setFeedback(
      "Accesso clienti online in attivazione. Per consultare un ordine o prenotare un pezzo esclusivo, contatta la gioielleria su WhatsApp.",
    );
  };

  return (
    <>
      <div
        aria-hidden={!open}
        onClick={close}
        className={`fixed inset-0 z-[70] bg-[#020202]/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Area Riservata Clienti"
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-[71] flex h-full w-full max-w-[420px] flex-col border-l border-[#dedede] bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#dedede] px-6 py-6">
          <div>
            <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-[#4e423e]">
              MAISON ORO&amp;CO · DAL 1992
            </p>
            <h2 className="mt-2 font-serif text-2xl text-[#020202]">Area Riservata Clienti</h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Chiudi Area Riservata Clienti"
            className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center border border-[#dedede] text-[#4e423e] transition-colors hover:border-[#020202] hover:text-[#020202]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-[#dedede] px-6 py-6">
            <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-[#4e423e]">
              Accesso Rapido
            </p>
            <p className="mt-3 font-serif text-sm leading-relaxed text-[#4e423e]">
              Ricevi un link privato per consultare i tuoi ordini e le tue prenotazioni.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <label htmlFor="account-drawer-email" className="sr-only">
                Indirizzo email
              </label>
              <input
                id="account-drawer-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="La tua email"
                className="w-full border border-[#dedede] bg-white px-4 py-3 font-sans text-sm text-[#020202] placeholder:text-[#4e423e]/60 focus:border-[#020202] focus:outline-none"
              />
              <button type="submit" className="btn-baggio w-full">
                Accedi con Link Privato
              </button>
            </form>

            {feedback ? (
              <p
                role="status"
                className="mt-4 border-l-2 border-[#020202] bg-[#faf9f7] px-4 py-3 font-sans text-xs leading-relaxed text-[#4e423e]"
              >
                {feedback}
              </p>
            ) : null}
          </div>

          <nav aria-label="Scorciatoie Area Riservata Clienti">
            <ul className="divide-y divide-[#dedede]">
              <li>
                <Link
                  href="/wishlist"
                  onClick={close}
                  className="flex items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-[#faf9f7]"
                >
                  <span className="font-serif text-base text-[#020202]">La mia Lista Desideri</span>
                  <span className="font-sans text-[11px] uppercase tracking-[0.16em] text-[#4e423e]">
                    {wishlistCount}
                  </span>
                </Link>
              </li>
              <li>
                <a
                  href={WHATSAPP_CONCIERGE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-[#faf9f7]"
                >
                  <span className="font-serif text-base text-[#020202]">
                    Concierge della Gioielleria su WhatsApp
                  </span>
                  <span aria-hidden="true" className="font-sans text-[#4e423e]">
                    ↗
                  </span>
                </a>
              </li>
              <li>
                <Link
                  href="/storia#garanzie"
                  onClick={close}
                  className="flex items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-[#faf9f7]"
                >
                  <span className="font-serif text-base text-[#020202]">
                    Certificati &amp; Garanzia Gemmologica
                  </span>
                  <span aria-hidden="true" className="font-sans text-[#4e423e]">
                    →
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/spedizioni-e-resi"
                  onClick={close}
                  className="flex items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-[#faf9f7]"
                >
                  <span className="font-serif text-base text-[#020202]">
                    Spedizioni Assicurate &amp; Resi
                  </span>
                  <span aria-hidden="true" className="font-sans text-[#4e423e]">
                    →
                  </span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="border-t border-[#dedede] px-6 py-4">
          <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#4e423e]">
            San Marzano sul Sarno (SA) · Assistenza al banco
          </p>
        </div>
      </aside>
    </>
  );
}
