import type { Metadata } from "next";
import { PageHero } from "@/components/catalog/PageHero";
import { CategoryExplorer } from "@/components/catalog/CategoryExplorer";
import { getLiveProductsByCategory } from "@/lib/liveCatalog";
import { categoryCopy, subcategoriesByCategory } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Orologi — Alta Orologeria Uomo e Donna",
  description:
    "Orologi Bulova, Locman, Paul Picot e Guess: automatici, cronografi e subacquei per uomo e donna, con garanzia internazionale.",
};

export default async function OrologiPage({
  searchParams,
}: {
  searchParams: Promise<{ sub?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialFilter = Array.isArray(params.sub) ? params.sub[0] : params.sub;
  const copy = categoryCopy.orologi;
  const products = await getLiveProductsByCategory("orologi");
  const filters = subcategoriesByCategory.orologi.map((item) => ({
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
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Orologi" }]}
      />
      <CategoryExplorer
        key={initialFilter ?? "all"}
        products={products}
        filters={filters}
        filterLabel="Genere"
        initialFilter={initialFilter}
      />
    </>
  );
}
