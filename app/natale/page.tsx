import type { Metadata } from "next";
import { PageHero } from "@/components/catalog/PageHero";
import { CategoryExplorer } from "@/components/catalog/CategoryExplorer";
import { getLiveChristmasProducts } from "@/lib/liveCatalog";
import { categoryCopy } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Natale — Regali Preziosi e Decorazioni 2026",
  description:
    "Speciale Natale ORO&CO: porcellane Villeroy & Boch, collezioni Cuorematto e Babbo Matto, decorazioni d'autore e idee regalo confezionate su misura.",
};

export default async function NatalePage() {
  const copy = categoryCopy.natale;
  const products = await getLiveChristmasProducts();

  return (
    <>
      <PageHero
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        image={copy.image}
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Natale" }]}
      />
      <CategoryExplorer products={products} filters={[]} />
    </>
  );
}
