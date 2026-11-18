import type { Metadata } from "next";
import { PageHero } from "@/components/catalog/PageHero";
import { CategoryExplorer } from "@/components/catalog/CategoryExplorer";
import { getLiveProductsByCategory } from "@/lib/liveCatalog";
import { categoryCopy, subcategoriesByCategory } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Gioielli — Anelli, Collane, Orecchini e Bracciali",
  description:
    "Gioielli ORO&CO in oro 18 kt e diamanti: anelli solitari, verette e trilogy, collane, orecchini, bracciali tennis e ciondoli certificati.",
};

export default async function GioielliPage({
  searchParams,
}: {
  searchParams: Promise<{ sub?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialFilter = Array.isArray(params.sub) ? params.sub[0] : params.sub;
  const copy = categoryCopy.gioielli;
  const products = await getLiveProductsByCategory("gioielli");
  const filters = subcategoriesByCategory.gioielli.map((item) => ({
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
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Gioielli" }]}
      />
      <CategoryExplorer
        key={initialFilter ?? "all"}
        products={products}
        filters={filters}
        filterLabel="Categorie"
        initialFilter={initialFilter}
      />
    </>
  );
}
