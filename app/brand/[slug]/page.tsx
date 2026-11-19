import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CategoryExplorer } from "@/components/catalog/CategoryExplorer";
import { getBrandLogoPath } from "@/lib/brandLogos";
import { getAllBrands, getBrandBySlug } from "@/lib/catalog";
import { getLiveProductsByBrand } from "@/lib/liveCatalog";

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllBrands().map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);

  if (!brand) {
    return { title: "Marchio non trovato" };
  }

  const description =
    brand.description ??
    `Scopri le creazioni ${brand.name} selezionate da ORO&CO.`;

  return {
    title: `${brand.name} — Brand`,
    description,
  };
}

export default async function BrandDetailPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);

  if (!brand) {
    notFound();
  }

  const brandProducts = await getLiveProductsByBrand(brand.slug);

  const filters = Array.from(
    new Map(
      brandProducts.map((product) => [
        product.subcategory,
        product.subcategoryLabel,
      ]),
    ).entries(),
  ).map(([value, label]) => ({ value, label }));

  const eyebrow = [brand.country, `${brandProducts.length} creazioni`]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <section className="bg-[#f7f3ec] border-b border-[#dedede] py-14 sm:py-16">
        <div className="container-luxe">
          <nav
            aria-label="Percorso"
            className="flex flex-wrap items-center gap-2 text-[0.62rem] uppercase tracking-[0.16em] text-[#8a8a8a]"
          >
            <Link href="/" className="transition-colors hover:text-gold">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/brand" className="transition-colors hover:text-gold">
              Brand
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-gold">{brand.name}</span>
          </nav>

          <Link
            href="/brand"
            className="mt-6 inline-flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.2em] text-[#5a5a5a] transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.6} />
            Tutti i 18 marchi
          </Link>

          <div className="mt-8 max-w-2xl">
            <img
              src={getBrandLogoPath(brand.slug)}
              alt={brand.name}
              className="max-h-16 w-auto max-w-[240px] object-contain sm:max-h-20"
            />
            <h1 className="sr-only">{brand.name}</h1>
            <p className="mt-6 text-[0.68rem] uppercase tracking-[0.25em] text-gold">
              {eyebrow}
            </p>
            {brand.description ? (
              <p className="mt-4 text-sm leading-relaxed text-[#5a5a5a]">
                {brand.description}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <CategoryExplorer
        products={brandProducts}
        filters={filters}
        filterType="subcategory"
        filterLabel="Tipologia"
      />
    </>
  );
}
