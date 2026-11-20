"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn, discountPercent, formatPrice } from "@/lib/utils";
import { useWishlistStore } from "@/store/useWishlistStore";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  className?: string;
}

/** Card prodotto editoriale, in stile Maison. */
export function ProductCard({ product, priority, className }: ProductCardProps) {
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const wishlistIds = useWishlistStore((state) => state.ids);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const inWishlist = mounted && wishlistIds.includes(product.id);
  const discount = discountPercent(product.price, product.compareAtPrice);
  const hoverImage = product.images[1];

  const badge = product.isNew
    ? "Nuovo"
    : product.isChristmas
      ? "Natale 2026"
      : null;

  return (
    <article
      className={cn(
        "group relative flex flex-col bg-transparent transition-transform duration-500",
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-white border border-[#eaeaea] transition-colors duration-500 group-hover:border-[#d5cbb8]">
        <SmartImage
          src={product.images[0]}
          alt={product.name}
          className={cn(
            "absolute inset-0 h-full w-full bg-white transition-opacity duration-700 ease-out",
            hoverImage && "group-hover:opacity-0",
          )}
          imageClassName="object-contain transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          fallbackLabel={product.name}
        />

        {hoverImage ? (
          <SmartImage
            src={hoverImage}
            alt={product.name}
            className="absolute inset-0 h-full w-full bg-white opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100"
            imageClassName="object-contain transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            fallbackLabel={product.name}
          />
        ) : null}

        {/* Badge */}
        <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-col items-start gap-1.5">
          {badge ? (
            <span className="bg-ink/80 px-2 py-0.5 text-[0.55rem] font-medium uppercase tracking-[0.16em] text-white">
              {badge}
            </span>
          ) : null}
          {discount > 0 ? (
            <span className="bg-gold/90 px-2 py-0.5 text-[0.55rem] font-medium uppercase tracking-[0.16em] text-white">
              −{discount}%
            </span>
          ) : null}
        </div>

        {/* Wishlist */}
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-label={
            inWishlist ? "Rimuovi dalla wishlist" : "Aggiungi alla wishlist"
          }
          aria-pressed={inWishlist}
          className={cn(
            "absolute right-2.5 top-2.5 z-30 grid h-8 w-8 place-items-center bg-transparent transition-colors",
            inWishlist ? "text-gold" : "text-ink/50 hover:text-ink",
          )}
        >
          <Heart
            className={cn("h-4 w-4", inWishlist && "fill-current")}
            strokeWidth={1.4}
          />
        </button>
      </div>

      {/* Didascalia */}
      <div className="flex flex-1 flex-col items-center gap-1 pt-4 text-center">
        <span className="font-serif text-[0.66rem] uppercase tracking-[0.24em] text-[#6b615c]">
          {product.brand}
        </span>
        <h3 className="font-serif text-[0.88rem] font-normal uppercase tracking-[0.08em] text-[#020202] transition-colors group-hover:text-gold line-clamp-2">
          {product.name}
        </h3>
        <div className="mt-0.5 flex flex-wrap items-baseline justify-center gap-2">
          <span className="font-serif text-[0.95rem] text-[#020202]">
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice ? (
            <span className="font-serif text-xs text-neutral-400 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          ) : null}
          {product.price >= 100 ? (
            <span className="text-[0.62rem] text-graphite-soft">
              · 3 rate da {formatPrice(product.price / 3)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Intera card cliccabile: un unico link sovrapposto apre il prodotto. */}
      <Link
        href={`/prodotto/${product.slug}`}
        aria-label={product.name}
        className="absolute inset-0 z-10"
      />
    </article>
  );
}
