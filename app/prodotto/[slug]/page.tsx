import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ProductDetail } from "@/components/product/ProductDetail";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { getLiveAllApprovedProducts, getLiveProductBySlug } from "@/lib/liveCatalog";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getLiveProductBySlug(slug);
  if (!product) return { title: "Prodotto non trovato" };
  return {
    title: `${product.name} — ${product.brand}`,
    description: product.shortDescription ?? product.description.slice(0, 155),
    openGraph: {
      title: `${product.name} — ${product.brand}`,
      description: product.shortDescription ?? product.description.slice(0, 155),
      images: [{ url: product.images[0] }],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getLiveProductBySlug(slug);
  if (!product) notFound();

  const allApproved = await getLiveAllApprovedProducts();
  const related = allApproved
    .filter(
      (item) => item.category === product.category && item.id !== product.id,
    )
    .slice(0, 4);

  const categoryLabels: Record<string, string> = {
    gioielli: "Gioielli",
    orologi: "Orologi",
    accessori: "Accessori",
    casa: "Casa",
    natale: "Natale",
  };

  return (
    <>
      <nav
        aria-label="Percorso"
        className="border-b border-line bg-pearl/50"
      >
        <div className="container-luxe flex items-center gap-1.5 py-4 text-[0.62rem] uppercase tracking-[0.16em] text-graphite-soft">
          <Link href="/" className="transition-colors hover:text-gold">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" strokeWidth={2} />
          <Link
            href={`/${product.category}`}
            className="transition-colors hover:text-gold"
          >
            {categoryLabels[product.category] ?? product.category}
          </Link>
          <ChevronRight className="h-3 w-3" strokeWidth={2} />
          <span className="truncate text-gold">{product.brand}</span>
        </div>
      </nav>

      <div className="container-luxe py-12 sm:py-16">
        <ProductDetail product={product} />
      </div>

      {related.length > 0 ? (
        <section className="border-t border-line bg-pearl/40 py-20">
          <div className="container-luxe">
            <SectionHeading
              eyebrow="Potrebbe interessarti"
              title="Dalla stessa collezione"
              className="mb-12"
            />
            <ProductGrid products={related} />
          </div>
        </section>
      ) : null}
    </>
  );
}
