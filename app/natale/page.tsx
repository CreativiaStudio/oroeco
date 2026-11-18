import type { Metadata } from "next";
import { PageHero } from "@/components/catalog/PageHero";
import { CategoryExplorer } from "@/components/catalog/CategoryExplorer";
import { getChristmasProducts } from "@/lib/catalog";
import { getLiveChristmasProducts } from "@/lib/liveCatalog";
import { categoryCopy, subcategoriesByCategory } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Natale — Regali Preziosi e Decorazioni 2026",
  description:
    "Speciale Natale ORO&CO: gioielli in oro e diamanti, decorazioni d'autore, candele profumate e confezioni luxury per i regali più preziosi.",
};

export default async function NatalePage({
  searchParams,
}: {
  searchParams: Promise<{ sub?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialFilter = Array.isArray(params.sub) ? params.sub[0] : params.sub;
  const copy = categoryCopy.natale;
  const liveProducts = await getLiveChristmasProducts();
  const products = liveProducts;
  const filters = subcategoriesByCategory.natale.map((item) => ({
    value: item.slug,
    label: item.label,
  }));

  return (
    <>
      <PageHero
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        image={copy.image}
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Natale" }]}
      />
      <CategoryExplorer
        key={initialFilter ?? "all"}
        products={products}
        filters={filters}
        filterLabel="Selezioni"
        initialFilter={initialFilter}
      />
    </>
  );
}
