"use client";

import { useState } from "react";
import { Check, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

/** Form newsletter con conferma locale (nessuna chiamata esterna). */
export function NewsletterForm({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const dark = tone === "dark";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!email) return;
        setDone(true);
        setEmail("");
      }}
      className="w-full max-w-md"
    >
      <div
        className={cn(
          "flex items-center gap-2 rounded-sm border p-1.5 transition-colors",
          dark
            ? "border-white/20 bg-white/5 focus-within:border-gold"
            : "border-line bg-white focus-within:border-gold",
        )}
      >
        <Mail
          className={cn("ml-2.5 h-4 w-4 shrink-0", dark ? "text-gold-soft" : "text-gold")}
          strokeWidth={1.6}
        />
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="La tua email"
          className={cn(
            "h-10 flex-1 bg-transparent text-sm outline-none",
            dark
              ? "text-white placeholder:text-white/50"
              : "text-ink placeholder:text-graphite-soft",
          )}
        />
        <button
          type="submit"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-sm px-4 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] transition-colors",
            dark
              ? "bg-gold text-white hover:bg-gold-bright"
              : "bg-ink text-white hover:bg-gold",
          )}
        >
          {done ? <Check className="h-3.5 w-3.5" strokeWidth={2} /> : null}
          {done ? "Iscritto" : "Iscriviti"}
        </button>
      </div>
      <p
        className={cn(
          "mt-3 text-xs leading-relaxed",
          dark ? "text-white/55" : "text-graphite-soft",
        )}
      >
        {done
          ? "Grazie! Riceverai in anteprima le nuove collezioni e gli inviti in gioielleria."
          : "Iscriviti per ricevere in anteprima collezioni, promozioni e inviti agli eventi."}
      </p>
    </form>
  );
}
