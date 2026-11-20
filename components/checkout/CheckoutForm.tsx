"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Gift,
  Lock,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";
import { PaymentLogos } from "@/components/layout/PaymentLogos";
import { SmartImage } from "@/components/ui/SmartImage";
import { trackBeginCheckout } from "@/lib/analytics";
import { STORE_CONTACT } from "@/lib/brandPolicy";
import { cn, formatPrice } from "@/lib/utils";
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_COST,
  calculateTotals,
  useCartStore,
} from "@/store/useCartStore";

type DeliveryMethod = "shipping" | "pickup";
type InvoiceCustomerType = "b2c" | "b2b";

export function CheckoutForm() {
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((s) => s.items);

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("shipping");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [province, setProvince] = useState("");
  const [notes, setNotes] = useState("");

  const [wantsInvoice, setWantsInvoice] = useState(false);
  const [invoiceType, setInvoiceType] = useState<InvoiceCustomerType>("b2c");
  const [companyName, setCompanyName] = useState("");
  const [fiscalCode, setFiscalCode] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [sdiCode, setSdiCode] = useState("");
  const [pec, setPec] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const baseTotals = calculateTotals(mounted ? items : []);
  const shippingFee =
    deliveryMethod === "pickup" || baseTotals.subtotal >= FREE_SHIPPING_THRESHOLD || baseTotals.subtotal === 0
      ? 0
      : SHIPPING_COST;
  const finalTotal = Number((baseTotals.subtotal + shippingFee).toFixed(2));

  const whatsappFallbackHref = `${STORE_CONTACT.whatsappHref}?text=${encodeURIComponent(
    [
      "Buongiorno ORO&CO, desidero concludere il mio ordine con assistenza in gioielleria:",
      ...items.map(
        ({ product, quantity }) =>
          `• ${product.name} × ${quantity} — ${formatPrice(product.price * quantity)}`,
      ),
      `Modalità: ${deliveryMethod === "pickup" ? "Ritiro in gioielleria" : "Spedizione assicurata"}`,
      `Totale: ${formatPrice(finalTotal)}`,
    ].join("\n"),
  )}`;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting || items.length === 0) return;

    setError(null);
    setSubmitting(true);
    trackBeginCheckout(items, finalTotal);

    try {
      const res = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(({ product, quantity }) => ({
            id: product.id,
            sku: product.sku,
            quantity,
          })),
          deliveryMethod,
          customer: {
            firstName,
            lastName,
            email,
            phone,
            address,
            city,
            postalCode,
            province,
            notes,
          },
          invoice: {
            requested: wantsInvoice,
            customerType: invoiceType,
            companyName,
            fiscalCode,
            vatNumber,
            sdiCode,
            pec,
          },
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        url?: string;
        error?: string;
      };

      if (!res.ok || !data.url) {
        setError(data.error || "Impossibile avviare il pagamento sicuro su Stripe.");
        setSubmitting(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Errore di connessione durante il reindirizzamento al pagamento. Riprova.");
      setSubmitting(false);
    }
  }

  if (!mounted) {
    return (
      <div className="container-luxe py-16">
        <div className="h-64 animate-pulse rounded-sm border border-line bg-[#F7F3EC]/60" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-luxe py-20 text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-line bg-[#F7F3EC]">
          <ShoppingBag className="h-8 w-8 text-gold" strokeWidth={1.4} />
        </span>
        <h1 className="mt-6 font-serif text-3xl text-ink">Il tuo carrello è vuoto</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-graphite">
          Aggiungi un gioiello, un orologio o una creazione per la casa per procedere con il pagamento sicuro online.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/gioielli"
            className="inline-flex h-12 items-center justify-center rounded-sm bg-ink px-7 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-gold"
          >
            Esplora i Gioielli
          </Link>
          <Link
            href="/orologi"
            className="inline-flex h-12 items-center justify-center rounded-sm border border-line px-7 text-xs font-semibold uppercase tracking-[0.2em] text-ink transition-colors hover:border-gold hover:text-gold"
          >
            Scopri gli Orologi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-luxe py-12 sm:py-16">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <Link
            href="/gioielli"
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-graphite-soft transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Continua gli acquisti
          </Link>
          <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">
            Checkout Protetto ORO&amp;CO
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-sm border border-[#DEDEDE] bg-[#F7F3EC] px-3.5 py-2 text-xs text-graphite">
          <Lock className="h-3.5 w-3.5 text-gold" />
          Pagamento cifrato TLS · Stripe Europe
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-[1.25fr_0.9fr]">
        {/* COLONNA SINISTRA: CONSEGNA, DATI & FATTURA */}
        <div className="space-y-8">
          {/* Modalità di consegna */}
          <section className="rounded-sm border border-[#DEDEDE] bg-white p-6">
            <h2 className="font-serif text-lg uppercase tracking-[0.12em] text-ink">
              1. Modalità di Consegna
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDeliveryMethod("shipping")}
                className={cn(
                  "flex items-start gap-3 rounded-sm border p-4 text-left transition-colors",
                  deliveryMethod === "shipping"
                    ? "border-[#012236] bg-[#F7F3EC]"
                    : "border-line bg-white hover:border-gold",
                )}
              >
                <Truck className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <div>
                  <p className="text-sm font-semibold text-ink">Spedizione Assicurata</p>
                  <p className="mt-1 text-xs text-graphite">
                    {baseTotals.subtotal >= FREE_SHIPPING_THRESHOLD
                      ? "Gratuita (ordine sopra 150 €)"
                      : `${formatPrice(SHIPPING_COST)} · Gratuita da 150 €`}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMethod("pickup")}
                className={cn(
                  "flex items-start gap-3 rounded-sm border p-4 text-left transition-colors",
                  deliveryMethod === "pickup"
                    ? "border-[#012236] bg-[#F7F3EC]"
                    : "border-line bg-white hover:border-gold",
                )}
              >
                <Store className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <div>
                  <p className="text-sm font-semibold text-ink">Ritiro in Gioielleria</p>
                  <p className="mt-1 text-xs text-graphite">
                    Gratuito · Via Turati 30, San Marzano (SA)
                  </p>
                </div>
              </button>
            </div>
          </section>

          {/* Dati Cliente & Spedizione */}
          <section className="rounded-sm border border-[#DEDEDE] bg-white p-6">
            <h2 className="font-serif text-lg uppercase tracking-[0.12em] text-ink">
              2. I Tuoi Dati {deliveryMethod === "shipping" ? "e Spedizione" : "di Contatto"}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-graphite">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-sm border border-line bg-white px-3 text-sm text-ink focus:border-[#012236] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-graphite">
                  Cognome *
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-sm border border-line bg-white px-3 text-sm text-ink focus:border-[#012236] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-graphite">
                  Email (per conferma ordine) *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-sm border border-line bg-white px-3 text-sm text-ink focus:border-[#012236] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-graphite">
                  Telefono / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-sm border border-line bg-white px-3 text-sm text-ink focus:border-[#012236] focus:outline-none"
                />
              </div>

              {deliveryMethod === "shipping" && (
                <>
                  <div className="sm:col-span-2">
                    <label className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-graphite">
                      Indirizzo e numero civico *
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-sm border border-line bg-white px-3 text-sm text-ink focus:border-[#012236] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-graphite">
                      Città *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-sm border border-line bg-white px-3 text-sm text-ink focus:border-[#012236] focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-graphite">
                        CAP *
                      </label>
                      <input
                        type="text"
                        required
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="mt-1.5 h-11 w-full rounded-sm border border-line bg-white px-3 text-sm text-ink focus:border-[#012236] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-graphite">
                        Prov.
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="SA"
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="mt-1.5 h-11 w-full rounded-sm border border-line bg-white px-3 text-sm uppercase text-ink focus:border-[#012236] focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="sm:col-span-2">
                <label className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-graphite">
                  Biglietto auguri / Note per la gioielleria (facoltativo)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Es. Confezione regalo anniversario, misura anello, orario preferito..."
                  className="mt-1.5 w-full rounded-sm border border-line bg-white px-3 py-2 text-sm text-ink focus:border-[#012236] focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Fattura Elettronica SDI opzionale */}
          <section className="rounded-sm border border-[#DEDEDE] bg-white p-6">
            <label className="flex cursor-pointer items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-gold" />
                <div>
                  <p className="text-sm font-semibold text-ink">
                    Richiedi Fattura Elettronica SDI (facoltativo)
                  </p>
                  <p className="text-xs text-graphite-soft">
                    Per acquisti B2C con Codice Fiscale o aziende con Partita IVA.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={wantsInvoice}
                onChange={(e) => setWantsInvoice(e.target.checked)}
                className="h-4 w-4 accent-[#012236]"
              />
            </label>

            {wantsInvoice && (
              <div className="mt-5 space-y-4 border-t border-line pt-5">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setInvoiceType("b2c")}
                    className={cn(
                      "rounded-sm border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                      invoiceType === "b2c"
                        ? "border-[#012236] bg-[#012236] text-white"
                        : "border-line text-graphite",
                    )}
                  >
                    Privato (CF)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvoiceType("b2b")}
                    className={cn(
                      "rounded-sm border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
                      invoiceType === "b2b"
                        ? "border-[#012236] bg-[#012236] text-white"
                        : "border-line text-graphite",
                    )}
                  >
                    Azienda / P.IVA (SDI)
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {invoiceType === "b2b" && (
                    <>
                      <div className="sm:col-span-2">
                        <label className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-graphite">
                          Ragione Sociale *
                        </label>
                        <input
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="mt-1.5 h-11 w-full rounded-sm border border-line px-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-graphite">
                          Partita IVA *
                        </label>
                        <input
                          type="text"
                          required
                          value={vatNumber}
                          onChange={(e) => setVatNumber(e.target.value)}
                          className="mt-1.5 h-11 w-full rounded-sm border border-line px-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-graphite">
                          Codice Univoco SDI o PEC
                        </label>
                        <input
                          type="text"
                          placeholder="Es. M5UXCR1"
                          value={sdiCode}
                          onChange={(e) => setSdiCode(e.target.value)}
                          className="mt-1.5 h-11 w-full rounded-sm border border-line px-3 text-sm uppercase"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-graphite">
                      Codice Fiscale {invoiceType === "b2c" ? "*" : ""}
                    </label>
                    <input
                      type="text"
                      required={invoiceType === "b2c"}
                      value={fiscalCode}
                      onChange={(e) => setFiscalCode(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-sm border border-line px-3 text-sm uppercase"
                    />
                  </div>
                  {invoiceType === "b2b" && (
                    <div>
                      <label className="block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-graphite">
                        PEC (alternativa a SDI)
                      </label>
                      <input
                        type="email"
                        value={pec}
                        onChange={(e) => setPec(e.target.value)}
                        className="mt-1.5 h-11 w-full rounded-sm border border-line px-3 text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* COLONNA DESTRA: RIEPILOGO & PAY */}
        <aside className="h-fit rounded-sm border border-[#DEDEDE] bg-[#F7F3EC] p-6 lg:sticky lg:top-24">
          <h2 className="font-serif text-lg uppercase tracking-[0.12em] text-ink">
            Riepilogo Ordine ({baseTotals.itemCount})
          </h2>

          <ul className="mt-4 divide-y divide-[#DEDEDE]">
            {items.map(({ product, quantity }) => (
              <li key={product.id} className="flex items-center gap-3.5 py-3.5">
                <SmartImage
                  src={product.images[0]}
                  alt={product.name}
                  className="h-16 w-16 shrink-0 rounded-sm border border-[#DEDEDE] bg-white"
                  sizes="64px"
                  fallbackLabel={product.name}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[0.62rem] uppercase tracking-[0.16em] text-graphite-soft">
                    {product.brand}
                  </p>
                  <p className="line-clamp-2 text-sm font-medium text-ink">{product.name}</p>
                  <p className="mt-0.5 text-xs text-graphite">Qtà: {quantity}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-ink">
                  {formatPrice(product.price * quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center gap-2.5 rounded-sm border border-[#DEDEDE] bg-white/80 px-3.5 py-2.5 text-xs text-graphite">
            <Gift className="h-4 w-4 shrink-0 text-gold" />
            Astuccio originale e confezione regalo inclusi gratuitamente.
          </div>

          <dl className="mt-5 space-y-2.5 border-t border-[#DEDEDE] pt-4 text-sm">
            <div className="flex justify-between text-graphite">
              <dt>Subtotale</dt>
              <dd className="font-medium text-ink">{formatPrice(baseTotals.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-graphite">
              <dt>
                {deliveryMethod === "pickup" ? "Ritiro in gioielleria" : "Spedizione assicurata"}
              </dt>
              <dd className="font-medium text-ink">
                {shippingFee === 0 ? (
                  <span className="text-gold">Gratuita</span>
                ) : (
                  formatPrice(shippingFee)
                )}
              </dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-[#DEDEDE] pt-3">
              <dt className="font-serif text-lg text-ink">Totale IVA incl.</dt>
              <dd className="font-serif text-2xl text-ink">{formatPrice(finalTotal)}</dd>
            </div>
          </dl>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-sm border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-sm bg-[#020202] px-6 text-xs font-semibold uppercase tracking-[0.22em] text-white transition-colors hover:bg-gold disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Lock className="h-4 w-4" />
            {submitting ? "Reindirizzamento sicuro…" : "Paga con Carta, Apple Pay o Klarna"}
          </button>

          <a
            href={whatsappFallbackHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex h-11 w-full items-center justify-center rounded-sm border border-[#DEDEDE] bg-white px-4 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ink transition-colors hover:border-gold hover:text-gold"
          >
            Oppure ordina con Concierge WhatsApp
          </a>

          <div className="mt-6 border-t border-[#DEDEDE] pt-5 text-center">
            <PaymentLogos />
            <p className="mt-3 inline-flex items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.14em] text-graphite-soft">
              <ShieldCheck className="h-3.5 w-3.5 text-gold" />
              Transazione crittografata protetta · Garanzia ORO&amp;CO dal 1992
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
