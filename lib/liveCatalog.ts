import { getDbProducts } from "@/lib/db";
import {
  getProductsByCategory,
  getChristmasProducts,
  getProductsByBrand,
  getProductBySlug,
  getAllProducts,
  getFeaturedProducts,
} from "@/lib/catalog";
import type { Product, ProductCategory } from "@/types/product";

/**
 * Recupera i prodotti approvati per una categoria specifica.
 * Interroga prioritariamente il database Supabase dedicato di Oroeco.
 * Se offline o in assenza di rete, ricorre al catalogo locale tipizzato (fallback trasparente).
 */
export async function getLiveProductsByCategory(
  category: ProductCategory
): Promise<Product[]> {
  try {
    const all = await getDbProducts();
    return all.filter(
      (p) => p.category === category && p.approvalStatus === "approved"
    );
  } catch (err) {
    console.warn("[LiveCatalog] Supabase fallback to local for category:", category);
    return getProductsByCategory(category);
  }
}

/**
 * Recupera la selezione speciale di Natale.
 */
export async function getLiveChristmasProducts(): Promise<Product[]> {
  try {
    const all = await getDbProducts();
    return all.filter(
      (p) => (p.isChristmas || p.category === "natale") && p.approvalStatus === "approved"
    );
  } catch (err) {
    console.warn("[LiveCatalog] Supabase fallback to local for Christmas products");
    return getChristmasProducts();
  }
}

/**
 * Recupera i prodotti approvati di un brand.
 */
export async function getLiveProductsByBrand(brandSlugOrName: string): Promise<Product[]> {
  const needle = brandSlugOrName.toLowerCase();
  try {
    const all = await getDbProducts();
    return all.filter(
      (p) =>
        (p.brandSlug === needle || p.brand.toLowerCase() === needle) &&
        p.approvalStatus === "approved"
    );
  } catch (err) {
    console.warn("[LiveCatalog] Supabase fallback to local for brand:", brandSlugOrName);
    return getProductsByBrand(brandSlugOrName);
  }
}

/**
 * Recupera un singolo prodotto per slug (live da Supabase con fallback locale solo su errore rete).
 */
export async function getLiveProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    const all = await getDbProducts();
    return all.find((p) => p.slug === slug && p.approvalStatus === "approved");
  } catch (err) {
    console.warn("[LiveCatalog] Supabase fallback to local for slug:", slug);
    return getProductBySlug(slug);
  }
}

/**
 * Recupera tutti i prodotti approvati per la vista globale Brand.
 */
export async function getLiveAllApprovedProducts(): Promise<Product[]> {
  try {
    const all = await getDbProducts();
    return all.filter((p) => p.approvalStatus === "approved");
  } catch (err) {
    console.warn("[LiveCatalog] Supabase fallback to local for all approved products");
    return getAllProducts();
  }
}

/**
 * Recupera i prodotti in evidenza per la home.
 */
export async function getLiveFeaturedProducts(): Promise<Product[]> {
  try {
    const all = await getDbProducts();
    return all.filter((p) => p.isFeatured && p.approvalStatus === "approved");
  } catch (err) {
    console.warn("[LiveCatalog] Supabase fallback to local for featured products");
    return getFeaturedProducts();
  }
}
