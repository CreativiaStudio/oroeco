import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types/product";

/** Griglia prodotti riutilizzabile lato server. */
export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
