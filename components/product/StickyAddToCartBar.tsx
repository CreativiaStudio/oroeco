"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types/product";

interface StickyAddToCartBarProps {
  product: Product;
  onAddToCart: () => void;
  justAdded: boolean;
}

export function StickyAddToCartBar({
  product,
  onAddToCart,
  justAdded,
}: StickyAddToCartBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled down past 450px
      if (window.scrollY > 450) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-line shadow-[0_-4px_25px_rgba(0,0,0,0.08)] py-3 px-4 sm:hidden transition-transform duration-300">
      <div className="flex items-center gap-3">
        <SmartImage
          src={product.images[0]}
          alt={product.name}
          className="h-12 w-10 shrink-0 rounded-sm border border-line"
          sizes="40px"
          fallbackLabel={product.name}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[0.62rem] uppercase tracking-wider font-semibold text-gold truncate">
            {product.brand}
          </p>
          <h4 className="text-xs font-serif text-ink truncate">
            {product.name}
          </h4>
          <p className="text-xs font-semibold text-ink">
            {formatPrice(product.price)}
          </p>
        </div>
        <button
          type="button"
          onClick={onAddToCart}
          disabled={!product.inStock}
          className={`shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-sm text-xs font-semibold uppercase tracking-wider text-white transition-colors ${
            justAdded ? "bg-green-700" : "bg-ink hover:bg-gold disabled:opacity-50"
          }`}
        >
          {justAdded ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Aggiunto
            </>
          ) : (
            <>
              <ShoppingBag className="h-3.5 w-3.5" />
              Acquista
            </>
          )}
        </button>
      </div>
    </div>
  );
}
