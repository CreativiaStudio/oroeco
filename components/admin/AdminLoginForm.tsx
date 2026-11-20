"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Lock, ShieldCheck, UserCheck } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { ADMIN_OPERATORS, type AdminOperatorName } from "@/lib/adminAuth";

interface AdminLoginFormProps {
  nextPath: string;
  isConfigured: boolean;
}

export function AdminLoginForm({ nextPath, isConfigured }: AdminLoginFormProps) {
  const [operator, setOperator] = useState<AdminOperatorName>("Renato");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operator, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "Credenziali non valide.");
        setSubmitting(false);
        return;
      }
      window.location.href = nextPath;
    } catch {
      setError("Errore di rete durante l'accesso. Riprova.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#012236] flex flex-col justify-between px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-md flex-1 flex flex-col justify-center">
        <div className="mb-6 flex justify-center">
          <Logo variant="wordmark" tone="light" className="h-12 w-auto" />
        </div>

        <div className="rounded-sm border border-[#C5A059]/30 bg-[#F7F3EC] p-7 text-[#020202] shadow-2xl sm:p-8">
          <div className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[#9A7D43]">
            <ShieldCheck className="h-4 w-4" strokeWidth={1.8} />
            Accesso Riservato · Gioielleria ORO&amp;CO
          </div>

          <h1 className="mt-2 font-serif text-2xl tracking-tight text-[#020202]">
            Gestionale &amp; Cassa Banco
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-[#4E423E]">
            Seleziona il profilo operatore e inserisci la password per accedere al pannello
            magazzino, CRM e terminale cassa.
          </p>

          {!isConfigured && (
            <div className="mt-4 rounded-sm border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
              Attenzione: impostare la variabile d&apos;ambiente{" "}
              <code className="font-mono font-semibold">ADMIN_PASSWORD</code> sul server per
              abilitare l&apos;accesso.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="admin-operator"
                className="block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#4E423E]"
              >
                Operatore
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {ADMIN_OPERATORS.map((op) => {
                  const selected = op === operator;
                  return (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setOperator(op)}
                      className={`flex items-center justify-center gap-1.5 rounded-sm border px-3 py-2.5 text-xs font-semibold transition-colors ${
                        selected
                          ? "border-[#012236] bg-[#012236] text-white"
                          : "border-[#DEDEDE] bg-white text-[#4E423E] hover:border-[#9A7D43]"
                      }`}
                    >
                      <UserCheck className="h-3.5 w-3.5 shrink-0 text-[#C5A059]" />
                      {op}
                    </button>
                  );
                })}
              </div>
              <input id="admin-operator" type="hidden" name="operator" value={operator} />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#4E423E]"
              >
                Password Gestionale
              </label>
              <div className="relative mt-2">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#9A7D43]">
                  <Lock className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Inserisci la password..."
                  className="h-11 w-full rounded-sm border border-[#DEDEDE] bg-white pl-10 pr-11 text-sm text-[#020202] placeholder:text-[#8a8a8a] focus:border-[#012236] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                  className="absolute inset-y-0 right-2.5 flex items-center px-1.5 text-[#4E423E] hover:text-[#020202]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-sm border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !password}
              className="flex h-12 w-full items-center justify-center rounded-sm bg-[#012236] px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#C5A059] hover:text-[#020202] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Verifica in corso…" : "Accedi al Gestionale"}
            </button>
          </form>

          <div className="mt-6 border-t border-[#DEDEDE] pt-4 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4E423E] transition-colors hover:text-[#9A7D43]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Torna alla Gioielleria pubblica
            </Link>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-[0.65rem] tracking-wide text-white/45">
        ORO&amp;CO Gioielleria · San Marzano sul Sarno (SA) · Connessione cifrata sessione operatore
      </p>
    </div>
  );
}
