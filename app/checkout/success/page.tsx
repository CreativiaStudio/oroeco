"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Mail, MapPin, ShieldCheck, ShoppingBag } from "lucide-react";
import { STORE_CONTACT } from "@/lib/brandPolicy";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";

interface OrderSummary {
  orderNumber: string;
  paymentStatus: string;
  amountTotal: number;
  customerEmail: string | null;
  deliveryMethod: "shipping" | "pickup";
  lineItems: Array<{ description: string | null; quantity: number; amountTotal: number }>;
}

function CheckoutSuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id") || "";
  const clearCart = useCartStore((s) => s.clearCart);
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(Boolean(sessionId));

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    let active = true;
    fetch(`/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data?.ok) setSummary(data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [sessionId]);

  const isPendingPayment = Boolean(
    summary?.paymentStatus && summary.paymentStatus !== "paid",
  );

  return (
    <div className="container-luxe py-16 sm:py-24">
      <div className="mx-auto max-w-2xl rounded-sm border border-[#DEDEDE] bg-[#F7F3EC] p-8 text-center sm:p-12">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#012236] text-[#C5A059]">
          <CheckCircle2 className="h-8 w-8" strokeWidth={1.7} />
        </span>

        <p className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#9A7D43]">
          {isPendingPayment
            ? "Ordine Ricevuto · Pagamento in Verifica"
            : "Ordine Confermato · ORO&CO dal 1992"}
        </p>
        <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">
          {isPendingPayment
            ? "Ordine registrato, pagamento in verifica"
            : "Grazie per il tuo acquisto"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-graphite">
          {isPendingPayment
            ? "Il circuito di pagamento sta completando la contabilizzazione (es. PayPal con addebito bancario). Riceverai conferma automatica appena l'accredito sarà completato."
            : "Abbiamo ricevuto correttamente il pagamento. Il nostro laboratorio di San Marzano sul Sarno sta preparando la tua confezione regalo ufficiale e il certificato di autenticità."}
        </p>

        {loading && (
          <p className="mt-6 text-xs uppercase tracking-[0.16em] text-graphite-soft">
            Verifica dettagli ordine in corso…
          </p>
        )}

        {summary && (
          <div className="mt-8 rounded-sm border border-[#DEDEDE] bg-white p-6 text-left">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 text-sm">
              <span className="font-semibold text-ink">Ordine {summary.orderNumber}</span>
              <span className="font-serif text-lg text-ink">
                {formatPrice(summary.amountTotal)}
              </span>
            </div>

            {summary.customerEmail && (
              <p className="mt-3 flex items-center gap-2 text-xs text-graphite">
                <Mail className="h-3.5 w-3.5 text-gold" />
                Ricevuta inviata a <strong>{summary.customerEmail}</strong>
              </p>
            )}
            <p className="mt-1.5 flex items-center gap-2 text-xs text-graphite">
              <MapPin className="h-3.5 w-3.5 text-gold" />
              {summary.deliveryMethod === "pickup"
                ? `Ritiro gratuito in gioielleria (${STORE_CONTACT.address})`
                : "Spedizione assicurata con corriere portavalori"}
            </p>

            {summary.lineItems.length > 0 && (
              <ul className="mt-4 divide-y divide-line border-t border-line pt-2 text-xs">
                {summary.lineItems.map((li, i) => (
                  <li key={i} className="flex justify-between py-2 text-graphite">
                    <span>
                      {li.description || "Articolo"} × {li.quantity}
                    </span>
                    <span className="font-semibold text-ink">{formatPrice(li.amountTotal)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-[#020202] px-7 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-gold"
          >
            <ShoppingBag className="h-4 w-4" />
            Torna alla Gioielleria
          </Link>
        </div>

        <p className="mt-6 inline-flex items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.14em] text-graphite-soft">
          <ShieldCheck className="h-3.5 w-3.5 text-gold" />
          Assistenza clienti: {STORE_CONTACT.phoneDisplay} · WhatsApp {STORE_CONTACT.whatsappDisplay}
        </p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container-luxe py-24 text-center text-sm text-graphite">
          Caricamento conferma ordine…
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
