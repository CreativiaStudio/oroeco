"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Gift,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  X,
  CreditCard,
} from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn, formatPrice } from "@/lib/utils";
import {
  FREE_SHIPPING_THRESHOLD,
  calculateTotals,
  useCartStore,
} from "@/store/useCartStore";
import { trackBeginCheckout, trackRemoveFromCart } from "@/lib/analytics";
import { getStoredConsent, getVisitorId } from "@/lib/consent";

/** Drawer laterale del carrello luxury (slide-over da destra) con sync carrelli abbandonati. */
export function CartDrawer() {
  const [mounted, setMounted] = useState(false);
  const [checkoutPreviewOpen, setCheckoutPreviewOpen] = useState(false);
  const isOpen = useCartStore((state) => state.isOpen);
  const items = useCartStore((state) => state.items);
  const closeCart = useCartStore((state) => state.closeCart);
  const removeItem = useCartStore((state) => state.removeItem);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, closeCart]);

  const totals = calculateTotals(items);
  const visible = mounted && isOpen;

  // Sincronizzazione carrelli abbandonati & CRM in background (stile Isabel Pepe)
  useEffect(() => {
    if (!mounted || items.length === 0) return;

    const timer = setTimeout(() => {
      const visitorId = getVisitorId();
      const consent = getStoredConsent();

      fetch("/api/cart/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId,
          consentId: consent?.consentId || null,
          items,
          subtotal: totals.subtotal,
          status: "active",
        }),
      }).catch(() => {});
    }, 1200);

    return () => clearTimeout(timer);
  }, [items, totals.subtotal, mounted]);

  const handleRemove = (product: any, quantity: number) => {
    trackRemoveFromCart(product, quantity);
    removeItem(product.id);
  };

  const handleBeginCheckout = () => {
    trackBeginCheckout(items, totals.total);
    setCheckoutPreviewOpen(true);
  };

  const whatsappCheckoutHref = `https://wa.me/393518778689?text=${encodeURIComponent(
    [
      "Buongiorno ORO&co, desidero concludere il mio ordine con il servizio Concierge:",
      ...items.map(
        ({ product, quantity }) =>
          `• ${product.name} × ${quantity} — ${formatPrice(product.price * quantity)}`,
      ),
      `Totale: ${formatPrice(totals.total)}`,
    ].join("\n"),
  )}`;

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-0 z-[60]",
        visible ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      {/* Overlay */}
      <button
        type="button"
        aria-label="Chiudi il carrello"
        onClick={closeCart}
        className={cn(
          "absolute inset-0 bg-ink/45 backdrop-blur-sm transition-opacity duration-500",
          visible ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Pannello */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrello"
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-[27rem] flex-col bg-white shadow-[0_0_80px_-20px_rgba(10,10,10,0.5)] transition-transform duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)]",
          visible ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Intestazione */}
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-gold" strokeWidth={1.6} />
            <h2 className="font-serif text-xl text-ink">Il tuo Carrello</h2>
            {totals.itemCount > 0 ? (
              <span className="rounded-full bg-pearl px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-graphite">
                {totals.itemCount}{" "}
                {totals.itemCount === 1 ? "articolo" : "articoli"}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Chiudi"
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-graphite transition-colors hover:text-ink"
          >
            <X className="h-5 w-5" strokeWidth={1.6} />
          </button>
        </div>

        {/* Barra spedizione gratuita */}
        {items.length > 0 ? (
          <div className="border-b border-line bg-pearl/70 px-6 py-4">
            <p className="flex items-center gap-2 text-xs text-graphite">
              <Truck className="h-4 w-4 text-gold" strokeWidth={1.6} />
              {totals.freeShipping ? (
                <span className="font-medium text-ink">
                  Complimenti! Hai sbloccato la spedizione assicurata gratuita.
                </span>
              ) : (
                <span>
                  Aggiungi{" "}
                  <strong className="text-ink">
                    {formatPrice(totals.remainingForFreeShipping)}
                  </strong>{" "}
                  per la spedizione gratuita!
                </span>
              )}
            </p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold to-gold-bright transition-all duration-700 ease-out"
                style={{ width: `${totals.progress}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[0.62rem] uppercase tracking-[0.16em] text-graphite-soft">
              <span>0 €</span>
              <span>{formatPrice(FREE_SHIPPING_THRESHOLD)}</span>
            </div>
          </div>
        ) : null}

        {/* Righe */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 px-8 text-center">
              <span className="grid h-20 w-20 place-items-center rounded-full border border-line bg-pearl">
                <ShoppingBag className="h-7 w-7 text-gold" strokeWidth={1.3} />
              </span>
              <div className="space-y-1.5">
                <p className="font-serif text-xl text-ink">
                  Il carrello è vuoto
                </p>
                <p className="text-sm text-graphite">
                  Scopri i gioielli e gli orologi della selezione ORO&amp;CO.
                </p>
              </div>
              <Link
                href="/gioielli"
                onClick={closeCart}
                className="inline-flex items-center justify-center rounded-sm bg-ink px-6 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-gold"
              >
                Esplora la collezione
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {items.map(({ product, quantity }) => (
                <li key={product.id} className="flex gap-4 p-5">
                  <Link
                    href={`/prodotto/${product.slug}`}
                    onClick={closeCart}
                    className="shrink-0"
                  >
                    <SmartImage
                      src={product.images[0]}
                      alt={product.name}
                      className="h-24 w-20 rounded-sm border border-line"
                      sizes="80px"
                      fallbackLabel={product.name}
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-graphite-soft">
                      {product.brand}
                    </span>
                    <Link
                      href={`/prodotto/${product.slug}`}
                      onClick={closeCart}
                      className="line-clamp-2 font-serif text-[0.95rem] leading-snug text-ink transition-colors hover:text-gold"
                    >
                      {product.name}
                    </Link>
                    <span className="mt-1 text-sm font-semibold text-ink">
                      {formatPrice(product.price)}
                    </span>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-sm border border-line">
                        <button
                          type="button"
                          onClick={() => decrement(product.id)}
                          aria-label="Diminuisci quantità"
                          className="grid h-8 w-8 place-items-center text-graphite transition-colors hover:text-gold"
                        >
                          <Minus className="h-3.5 w-3.5" strokeWidth={1.8} />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-ink">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => increment(product.id)}
                          aria-label="Aumenta quantità"
                          className="grid h-8 w-8 place-items-center text-graphite transition-colors hover:text-gold"
                        >
                          <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(product, quantity)}
                        aria-label="Rimuovi articolo"
                        className="inline-flex items-center gap-1 text-[0.65rem] uppercase tracking-[0.14em] text-graphite-soft transition-colors hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.6} />
                        Rimuovi
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Riepilogo */}
        {items.length > 0 ? (
          <div className="border-t border-line bg-white px-6 py-5">
            <div className="mb-4 flex items-start gap-2.5 rounded-sm bg-gold-tint/70 px-3.5 py-3">
              <Gift className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.6} />
              <p className="text-xs leading-relaxed text-graphite">
                <span className="font-medium text-ink">
                  Confezione regalo luxury inclusa
                </span>{" "}
                in ogni ordine, con astuccio firmato e biglietto personalizzabile.
              </p>
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-graphite">
                <dt>Subtotale</dt>
                <dd className="font-medium text-ink">
                  {formatPrice(totals.subtotal)}
                </dd>
              </div>
              <div className="flex items-center justify-between text-graphite">
                <dt>Spedizione assicurata</dt>
                <dd className="font-medium text-ink">
                  {totals.freeShipping ? (
                    <span className="text-gold font-medium">Gratuita</span>
                  ) : (
                    formatPrice(totals.shipping)
                  )}
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <dt className="font-serif text-lg text-ink">Totale</dt>
                <dd className="font-serif text-xl text-ink">
                  {formatPrice(totals.total)}
                </dd>
              </div>
            </dl>

            {/* Klarna / PayPal rate preview nel carrello */}
            {totals.total >= 100 ? (
              <div className="mt-3 flex items-center justify-between rounded-sm border border-line bg-pearl/50 px-3 py-2 text-xs text-graphite">
                <div className="flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-gold shrink-0" />
                  <span>
                    3 rate da <strong>{formatPrice(totals.total / 3)}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[0.6rem] font-semibold uppercase text-graphite-soft">
                  <span className="text-pink-600">Klarna</span>
                  <span>·</span>
                  <span className="text-sky-700">PayPal</span>
                </div>
              </div>
            ) : null}

            {checkoutPreviewOpen ? (
              <div className="mt-5 rounded-sm border border-gold/40 bg-[#f7f3ec] p-4">
                <p className="font-serif text-base uppercase tracking-[0.12em] text-[#020202]">
                  Checkout Protetto &amp; Concierge ORO&amp;co
                </p>
                <p className="mt-2 text-xs leading-relaxed text-graphite">
                  Concludi subito il tuo ordine con assistenza prioritaria in
                  gioielleria oppure prenota il ritiro a San Marzano sul Sarno.
                </p>
                <a
                  href={whatsappCheckoutHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-sm bg-[#020202] px-4 py-3 text-center font-serif text-[0.7rem] uppercase tracking-[0.2em] text-white transition-colors hover:bg-gold"
                >
                  Concludi su WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => setCheckoutPreviewOpen(false)}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-sm border border-line bg-white px-4 py-3 text-center font-serif text-[0.7rem] uppercase tracking-[0.2em] text-[#020202] transition-colors hover:border-gold hover:text-gold"
                >
                  Torna al riepilogo
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleBeginCheckout}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-ink px-6 py-4 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-gold"
              >
                Procedi all&apos;Ordine
              </button>
            )}
            <p className="mt-3 flex items-center justify-center gap-2 text-[0.65rem] uppercase tracking-[0.14em] text-graphite-soft">
              <ShieldCheck className="h-3.5 w-3.5 text-gold" strokeWidth={1.6} />
              Pagamenti protetti · Klarna · PayPal · Bonifico
            </p>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
