import type { Metadata } from "next";
import { PageHero } from "@/components/catalog/PageHero";
import { CategoryExplorer } from "@/components/catalog/CategoryExplorer";
import { getLiveProductsByCategory } from "@/lib/liveCatalog";
import { categoryCopy, subcategoriesByCategory } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Accessori — Pelletteria, Gemelli e Penne da Regalo",
  description:
    "Accessori di pregio ORO&CO: pelletteria, portachiavi in argento, gemelli da cerimonia e penne da regalo in confezione luxury.",
};

export default async function AccessoriPage({
  searchParams,
}: {
  searchParams: Promise<{ sub?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialFilter = Array.isArray(params.sub) ? params.sub[0] : params.sub;
  const copy = categoryCopy.accessori;
  const products = await getLiveProductsByCategory("accessori");
  const filters = subcategoriesByCategory.accessori.map((item) => ({
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
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Accessori" }]}
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
