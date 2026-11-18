"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types/product";
import { useWishlistStore } from "@/store/useWishlistStore";

/** Elenco dei prodotti salvati nella wishlist. */
export function WishlistView() {
  const [mounted, setMounted] = useState(false);
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const ids = useWishlistStore((state) => state.ids);
  const clear = useWishlistStore((state) => state.clear);

  useEffect(() => {
    setMounted(true);
    fetch("/api/products/public")
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d) => setLiveProducts(Array.isArray(d.products) ? d.products : []))
      .catch(() => setLiveProducts([]));
  }, []);

  const products = mounted
    ? liveProducts.filter((product) => ids.includes(product.id))
    : [];

  if (!mounted) {
    return (
      <p className="py-20 text-center text-sm text-graphite-soft">
        Caricamento dei tuoi preferiti…
      </p>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-20 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full border border-line bg-pearl">
          <Heart className="h-7 w-7 text-gold" strokeWidth={1.3} />
        </span>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl text-ink">
            La tua wishlist è vuota
          </h2>
          <p className="text-sm text-graphite">
            Tocca il cuore sui prodotti che ami per ritrovarli qui.
          </p>
        </div>
        <Link
          href="/gioielli"
          className="inline-flex items-center rounded-sm bg-ink px-7 py-3.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-gold"
        >
          Scopri i gioielli
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between border-b border-line pb-5">
        <p className="text-sm text-graphite">
          {products.length}{" "}
          {products.length === 1 ? "pezzo salvato" : "pezzi salvati"}
        </p>
        <button
          type="button"
          onClick={clear}
          className="text-[0.65rem] uppercase tracking-[0.16em] text-graphite-soft transition-colors hover:text-red-600"
        >
          Svuota wishlist
        </button>
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
