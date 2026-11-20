"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Check,
  Gift,
  Heart,
  Minus,
  Plus,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Award,
} from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn, discountPercent, formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { InstallmentBadge } from "@/components/ui/InstallmentBadge";
import { WarrantyModal } from "@/components/product/WarrantyModal";
import { RingSizeGuideModal } from "@/components/product/RingSizeGuideModal";
import { StickyAddToCartBar } from "@/components/product/StickyAddToCartBar";
import { trackAddToCart, trackViewItem } from "@/lib/analytics";
import type { Product } from "@/types/product";

interface ProductDetailProps {
  product: Product;
}

/** Vista di dettaglio prodotto con galleria, attributi, calcolo rate, garanzia e carrello. */
export function ProductDetail({ product }: ProductDetailProps) {
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [showWarranty, setShowWarranty] = useState(false);
  const [showRingGuide, setShowRingGuide] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const wishlistIds = useWishlistStore((state) => state.ids);

  const inWishlist = wishlistIds.includes(product.id);
  const discount = discountPercent(product.price, product.compareAtPrice);

  const attributes = buildAttributes(product);

  // Traccia visualizzazione prodotto (GA4 + Meta CAPI)
  useEffect(() => {
    trackViewItem(product);
  }, [product]);

  const handleAdd = () => {
    addItem(product, quantity);
    trackAddToCart(product, quantity);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1800);
  };

  const isRing =
    product.category === "gioielli" &&
    (product.name.toLowerCase().includes("anello") ||
      product.name.toLowerCase().includes("veretta") ||
      product.name.toLowerCase().includes("solitario") ||
      product.name.toLowerCase().includes("fede") ||
      product.name.toLowerCase().includes("trilogy"));

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Galleria */}
        <div className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-sm border border-line bg-white">
            <SmartImage
              src={product.images[activeImage]}
              alt={product.name}
              className="aspect-square w-full bg-white"
              imageClassName="object-contain"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              fallbackLabel={product.name}
            />
            {product.compareAtPrice && discount > 0 ? (
              <span className="absolute left-4 top-4 rounded-sm bg-gold px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white">
                −{discount}%
              </span>
            ) : null}
          </div>

          {product.images.length > 1 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
              {product.images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`Immagine ${index + 1}`}
                  className={cn(
                    "relative flex-shrink-0 overflow-hidden rounded-sm border bg-white transition-all duration-200",
                    activeImage === index
                      ? "border-gold shadow-sm ring-1 ring-gold"
                      : "border-line opacity-70 hover:border-gold hover:opacity-100",
                  )}
                >
                  <SmartImage
                    src={image}
                    alt={`${product.name} — vista ${index + 1}`}
                    className="h-20 w-20 bg-white"
                    imageClassName="object-contain"
                    sizes="80px"
                    fallbackLabel={product.name}
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Informazioni */}
        <div className="flex flex-col">
          <Link
            href={`/brand/${product.brandSlug}`}
            className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-gold transition-colors hover:text-gold-bright"
          >
            {product.brand}
          </Link>
          <h1 className="mt-3 font-serif text-3xl leading-tight text-ink sm:text-4xl">
            {product.name}
          </h1>

          {product.rating ? (
            <div className="mt-4 flex items-center gap-2">
              <span className="flex items-center gap-0.5 text-gold">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={cn(
                      "h-4 w-4",
                      index < Math.round(product.rating ?? 0)
                        ? "fill-current"
                        : "opacity-30",
                    )}
                    strokeWidth={1.4}
                  />
                ))}
              </span>
              <span className="text-xs text-graphite-soft">
                {product.rating.toFixed(1)} · {product.reviewsCount ?? 0} recensioni
              </span>
            </div>
          ) : null}

          {/* Prezzo & Rate Klarna/PayPal */}
          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="font-serif text-3xl text-ink">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice ? (
              <span className="text-base text-graphite-soft line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            ) : null}
            <span className="text-xs uppercase tracking-[0.14em] text-graphite-soft">
              IVA inclusa
            </span>
          </div>

          <InstallmentBadge price={product.price} className="mt-4" />

          <p className="mt-6 text-sm leading-relaxed text-graphite">
            {product.description}
          </p>

          {/* Guida Taglie Anelli */}
          {isRing ? (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowRingGuide(true)}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold hover:text-gold-bright transition-colors"
              >
                <Ruler className="h-4 w-4" />
                Guida alle taglie e misure anello
              </button>
            </div>
          ) : null}

          {/* Disponibilità */}
          <div className="mt-5 flex items-center gap-2 text-xs uppercase tracking-[0.16em]">
            <span
              className={cn(
                "inline-block h-2 w-2 rounded-full",
                product.inStock ? "bg-green-600" : "bg-red-500",
              )}
            />
            <span className={product.inStock ? "text-green-700" : "text-red-600"}>
              {product.inStock
                ? `Disponibile · ${product.stockQuantity} pezzi in gioielleria`
                : "Non disponibile"}
            </span>
          </div>

          {/* Acquisto */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <div className="inline-flex h-14 items-center rounded-sm border border-line">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                aria-label="Diminuisci quantità"
                className="grid h-full w-12 place-items-center text-graphite transition-colors hover:text-gold"
              >
                <Minus className="h-4 w-4" strokeWidth={1.8} />
              </button>
              <span className="w-10 text-center text-base font-medium text-ink">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((value) => value + 1)}
                aria-label="Aumenta quantità"
                className="grid h-full w-12 place-items-center text-graphite transition-colors hover:text-gold"
              >
                <Plus className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={!product.inStock}
              className={cn(
                "inline-flex h-14 flex-1 items-center justify-center gap-2.5 rounded-sm text-[0.74rem] font-semibold uppercase tracking-[0.2em] text-white transition-colors",
                justAdded
                  ? "bg-green-700"
                  : "bg-ink hover:bg-gold disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {justAdded ? (
                <>
                  <Check className="h-4 w-4" strokeWidth={2} />
                  Aggiunto al carrello
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" strokeWidth={1.8} />
                  Aggiungi al Carrello
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              aria-label={
                inWishlist ? "Rimuovi dalla wishlist" : "Aggiungi alla wishlist"
              }
              className={cn(
                "grid h-14 w-14 shrink-0 place-items-center rounded-sm border transition-colors",
                inWishlist
                  ? "border-gold text-gold"
                  : "border-line text-graphite hover:border-gold hover:text-gold",
              )}
            >
              <Heart
                className={cn("h-5 w-5", inWishlist && "fill-current")}
                strokeWidth={1.6}
              />
            </button>
          </div>

          {/* Vantaggi & Garanzia Ufficiale */}
          <div className="mt-8 grid gap-3 border-y border-line py-6 sm:grid-cols-3">
            <div className="flex items-center gap-2.5 text-xs text-graphite">
              <Truck className="h-4 w-4 text-gold" strokeWidth={1.6} />
              Spedizione assicurata
            </div>
            <div className="flex items-center gap-2.5 text-xs text-graphite">
              <Gift className="h-4 w-4 text-gold" strokeWidth={1.6} />
              Confezione regalo inclusa
            </div>
            <button
              type="button"
              onClick={() => setShowWarranty(true)}
              className="flex items-center gap-2.5 text-xs text-graphite hover:text-gold transition-colors text-left"
            >
              <ShieldCheck className="h-4 w-4 text-gold" strokeWidth={1.6} />
              <span>
                <strong className="text-ink underline decoration-gold/50">Garanzia ORO&amp;CO</strong>
              </span>
            </button>
          </div>

          {/* Attributi tecnici */}
          {attributes.length > 0 ? (
            <div className="mt-8">
              <h2 className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-ink">
                <BadgeCheck className="h-4 w-4 text-gold" strokeWidth={1.6} />
                Scheda tecnica
              </h2>
              <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                {attributes.map((attribute) => (
                  <div
                    key={attribute.label}
                    className="flex items-baseline justify-between gap-4 border-b border-line/70 pb-2.5 text-sm"
                  >
                    <dt className="text-graphite-soft">{attribute.label}</dt>
                    <dd className="text-right font-medium text-ink">
                      {attribute.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          <p className="mt-6 text-[0.68rem] uppercase tracking-[0.16em] text-graphite-soft">
            Cod. art. {product.sku} · EAN {product.barcode}
          </p>
        </div>
      </div>

      {/* Floating Sticky Mobile Bar */}
      <StickyAddToCartBar
        product={product}
        onAddToCart={handleAdd}
        justAdded={justAdded}
      />

      {/* Modali Luxury */}
      <WarrantyModal
        isOpen={showWarranty}
        onClose={() => setShowWarranty(false)}
        brandName={product.brand}
        productName={product.name}
      />

      <RingSizeGuideModal
        isOpen={showRingGuide}
        onClose={() => setShowRingGuide(false)}
      />
    </>
  );
}

function pickStr(raw: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = raw[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return undefined;
}

function buildAttributes(product: Product): { label: string; value: string }[] {
  const raw = (product.attributes ?? {}) as Record<string, unknown>;
  const rows: { label: string; value?: string }[] = [];

  switch (product.category) {
    case "gioielli": {
      const metal = pickStr(raw, "metal");
      const material = pickStr(raw, "material", "Materiale");
      const stones =
        Array.isArray(raw.stones) && raw.stones.length
          ? raw.stones.join(", ")
          : pickStr(raw, "Pietre");

      rows.push(
        { label: "Metallo", value: metal },
        { label: "Caratura", value: pickStr(raw, "carats") },
        {
          label: "Materiale",
          value:
            material &&
            (!metal || material.toLowerCase() !== metal.toLowerCase())
              ? material
              : undefined,
        },
        { label: "Pietre", value: stones },
        { label: "Taglio", value: pickStr(raw, "cut") },
        { label: "Peso pietra", value: pickStr(raw, "caratWeight") },
        {
          label: "Peso",
          value: raw.weightGr ? `${raw.weightGr} g` : pickStr(raw, "Peso"),
        },
        {
          label: "Misura / Dimensioni",
          value: pickStr(raw, "size", "Dimensioni", "Taglie"),
        },
        { label: "Lavorazione", value: pickStr(raw, "Lavorazione", "finish") },
        { label: "Chiusura", value: pickStr(raw, "Chiusura") },
        { label: "Collezione", value: pickStr(raw, "collection", "Collezione") },
        { label: "Genere", value: pickStr(raw, "gender", "Genere") },
        { label: "Colore", value: pickStr(raw, "color", "Colore") },
        { label: "Origine", value: pickStr(raw, "origin", "Origine") },
      );
      break;
    }

    case "orologi": {
      rows.push(
        { label: "Movimento", value: pickStr(raw, "movement", "Movimento") },
        { label: "Calibro", value: pickStr(raw, "Calibro") },
        {
          label: "Materiale cassa",
          value: pickStr(
            raw,
            "caseMaterial",
            "Materiale cassa",
            "Cassa",
            "material",
            "Materiale",
          ),
        },
        {
          label: "Diametro cassa",
          value: raw.caseDiameter
            ? `${raw.caseDiameter} mm`
            : pickStr(raw, "Diametro cassa", "Diametro"),
        },
        { label: "Spessore cassa", value: pickStr(raw, "Spessore cassa") },
        { label: "Vetro", value: pickStr(raw, "glass", "Vetro") },
        { label: "Quadrante", value: pickStr(raw, "Quadrante") },
        {
          label: "Cinturino / Bracciale",
          value: pickStr(raw, "Bracciale", "Cinturino"),
        },
        {
          label: "Impermeabilità",
          value: pickStr(raw, "waterResistance", "Impermeabilità"),
        },
        { label: "Funzioni", value: pickStr(raw, "Funzioni") },
        { label: "Collezione", value: pickStr(raw, "collection", "Collezione") },
        { label: "Genere", value: pickStr(raw, "gender", "Genere") },
        { label: "Colore", value: pickStr(raw, "color", "Colore") },
        { label: "Origine", value: pickStr(raw, "origin", "Origine") },
      );
      break;
    }

    case "accessori": {
      rows.push(
        {
          label: "Materiale",
          value: pickStr(raw, "material", "Materiale"),
        },
        { label: "Collezione", value: pickStr(raw, "collection", "Collezione") },
        { label: "Lavorazione", value: pickStr(raw, "Lavorazione", "finish") },
        {
          label: "Dimensioni",
          value: pickStr(raw, "dimensions", "Dimensioni", "size"),
        },
        { label: "Colore", value: pickStr(raw, "color", "Colore") },
        { label: "Genere", value: pickStr(raw, "gender", "Genere") },
        { label: "Origine", value: pickStr(raw, "origin", "Origine") },
      );
      break;
    }

    case "casa":
    case "natale":
    default: {
      rows.push(
        {
          label: "Materiale",
          value: pickStr(raw, "material", "Materiale"),
        },
        { label: "Collezione", value: pickStr(raw, "collection", "Collezione") },
        {
          label: "Dimensioni",
          value: pickStr(raw, "dimensions", "Dimensioni", "size"),
        },
        { label: "Finitura", value: pickStr(raw, "finish", "Finitura") },
        { label: "Colore", value: pickStr(raw, "color", "Colore") },
        { label: "Scultore", value: pickStr(raw, "sculptor", "Scultore") },
        { label: "Peso", value: pickStr(raw, "Peso") },
        { label: "Anno di lancio", value: pickStr(raw, "Anno di lancio") },
        {
          label: "Sorgente luminosa",
          value: pickStr(raw, "Sorgente luminosa"),
        },
        { label: "Autonomia", value: pickStr(raw, "Autonomia") },
        {
          label: "Lavabile in lavastoviglie",
          value: raw.dishwasherSafe === true ? "Sì" : undefined,
        },
        { label: "Origine", value: pickStr(raw, "origin", "Origine") },
      );
      break;
    }
  }

  return rows
    .filter((row): row is { label: string; value: string } =>
      Boolean(row.value && row.value !== ""),
    )
    .map((row) => ({ label: row.label, value: row.value }));
}
