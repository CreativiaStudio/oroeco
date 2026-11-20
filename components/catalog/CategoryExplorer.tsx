"use client";

import { useMemo, useState } from "react";
import { Filter, RotateCcw, Search, SlidersHorizontal, Sparkles, Watch, Gem, X } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

export interface ExplorerFilter {
  value: string;
  label: string;
}

type SortKey = "rilevanza" | "prezzo-asc" | "prezzo-desc" | "novita";

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "rilevanza", label: "Rilevanza" },
  { value: "novita", label: "Novità" },
  { value: "prezzo-asc", label: "Prezzo: crescente" },
  { value: "prezzo-desc", label: "Prezzo: decrescente" },
];

interface CategoryExplorerProps {
  products: Product[];
  filters: ExplorerFilter[];
  /** Dimensione su cui applicare i filtri. */
  filterType?: "subcategory" | "brand";
  filterLabel?: string;
  initialFilter?: string;
}

/** Griglia prodotti con filtri facet avanzati (materiale, movimento, pietre, prezzo) e ordinamento. */
export function CategoryExplorer({
  products,
  filters,
  filterType = "subcategory",
  filterLabel = "Filtra",
  initialFilter,
}: CategoryExplorerProps) {
  const [active, setActive] = useState<string>(initialFilter ?? "all");
  const [sort, setSort] = useState<SortKey>("rilevanza");

  // Ricerca istantanea e disponibilità
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);

  // Secondary facet filters
  const [materialFilter, setMaterialFilter] = useState<string>("all");
  const [movementFilter, setMovementFilter] = useState<string>("all");
  const [stoneFilter, setStoneFilter] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of products) {
      const key =
        filterType === "brand" ? product.brandSlug : product.subcategory;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [products, filterType]);

  const isOnlyJewelry = useMemo(
    () => products.length > 0 && products.every((p) => p.category === "gioielli"),
    [products],
  );
  const isOnlyWatches = useMemo(
    () => products.length > 0 && products.every((p) => p.category === "orologi"),
    [products],
  );
  const isOnlyHomeOrChristmas = useMemo(
    () =>
      products.length > 0 &&
      products.every((p) => p.category === "casa" || p.category === "natale"),
    [products],
  );
  const isOnlyAccessories = useMemo(
    () => products.length > 0 && products.every((p) => p.category === "accessori"),
    [products],
  );

  const materialOptions = useMemo(() => {
    if (isOnlyJewelry) {
      return [
        { value: "oro", label: "Oro (18 kt & 9 kt)" },
        { value: "argento", label: "Argento 925‰" },
        { value: "acciaio", label: "Acciaio 316L" },
        { value: "bronzo", label: "Bronzo placcato" },
      ];
    }
    if (isOnlyWatches) {
      return [
        { value: "acciaio", label: "Acciaio 316L" },
        { value: "titanio", label: "Titanio" },
        { value: "pelle_silicone", label: "Pelle / Silicone" },
      ];
    }
    if (isOnlyHomeOrChristmas) {
      return [
        { value: "porcellana_cristallo", label: "Porcellana / Cristallo" },
        { value: "legno_vetro", label: "Legno / Vetro" },
      ];
    }
    if (isOnlyAccessories) {
      return [
        { value: "pelle_silicone", label: "Pelle" },
        { value: "acciaio", label: "Acciaio 316L" },
        { value: "argento", label: "Argento 925‰" },
      ];
    }
    const allOptions = [
      { value: "oro", label: "Oro (18 kt & 9 kt)" },
      { value: "argento", label: "Argento 925‰" },
      { value: "acciaio", label: "Acciaio 316L" },
      { value: "bronzo", label: "Bronzo placcato" },
      { value: "titanio", label: "Titanio" },
      { value: "pelle_silicone", label: "Pelle / Silicone" },
      { value: "porcellana_cristallo", label: "Porcellana / Cristallo" },
      { value: "legno_vetro", label: "Legno / Vetro" },
    ];
    const textAll = products
      .map((p) => {
        const attrs = p.attributes as Record<string, unknown> | undefined;
        return String(
          attrs?.caseMaterial ||
            attrs?.["Materiale cassa"] ||
            attrs?.metal ||
            attrs?.material ||
            attrs?.Materiale ||
            "",
        ).toLowerCase();
      })
      .join(" ");
    return allOptions.filter((opt) => {
      if (opt.value === "oro") return textAll.includes("oro");
      if (opt.value === "argento") return textAll.includes("argento");
      if (opt.value === "acciaio") return textAll.includes("acciaio");
      if (opt.value === "bronzo") return textAll.includes("bronzo");
      if (opt.value === "titanio") return textAll.includes("titan");
      if (opt.value === "pelle_silicone") {
        return /pelle|silicone|polimero|saffiano|cuoio/.test(textAll);
      }
      if (opt.value === "porcellana_cristallo") {
        return /porcellana|cristallo|ceramica/.test(textAll);
      }
      if (opt.value === "legno_vetro") {
        return /legno|bamb|vetro|midollino/.test(textAll);
      }
      return false;
    });
  }, [
    products,
    isOnlyJewelry,
    isOnlyWatches,
    isOnlyHomeOrChristmas,
    isOnlyAccessories,
  ]);

  const materialFieldLabel = isOnlyJewelry
    ? "Metallo:"
    : isOnlyWatches
      ? "Materiale cassa:"
      : "Materiale:";

  const materialAllLabel = isOnlyJewelry
    ? "Tutti i metalli"
    : "Tutti i materiali";

  // Determine which facet groups are relevant for the current product set
  const hasMovements = useMemo(() => {
    return products.some((p) => Boolean(p.attributes?.movement));
  }, [products]);

  const hasMetals = useMemo(() => {
    return (
      materialOptions.length > 0 &&
      products.some((p) => {
        const attrs = p.attributes as Record<string, unknown> | undefined;
        return Boolean(
          attrs?.caseMaterial ||
            attrs?.["Materiale cassa"] ||
            attrs?.metal ||
            attrs?.material ||
            attrs?.Materiale,
        );
      })
    );
  }, [products, materialOptions]);

  const hasStones = useMemo(() => {
    if (isOnlyHomeOrChristmas || isOnlyAccessories) return false;
    return products.some(
      (p) =>
        (p.attributes?.stones && p.attributes.stones.length > 0) ||
        Boolean((p.attributes as Record<string, unknown>)?.pearlType),
    );
  }, [products, isOnlyHomeOrChristmas, isOnlyAccessories]);

  const hasActiveFacets =
    materialFilter !== "all" ||
    movementFilter !== "all" ||
    stoneFilter !== "all" ||
    priceFilter !== "all" ||
    searchQuery.trim() !== "" ||
    onlyInStock;

  const resetAllFacets = () => {
    setMaterialFilter("all");
    setMovementFilter("all");
    setStoneFilter("all");
    setPriceFilter("all");
    setSearchQuery("");
    setOnlyInStock(false);
  };

  const visible = useMemo(() => {
    // 1. Primary filter (subcategory / brand)
    let filtered =
      active === "all"
        ? products
        : products.filter((product) =>
            filterType === "brand"
              ? product.brandSlug === active
              : product.subcategory === active,
          );

    // 1b. Free-text search (name, brand, SKU, short description, metal/material, subcategory)
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter((p) => {
        const haystack = [
          p.name,
          p.brand,
          p.sku,
          p.shortDescription ?? "",
          p.attributes?.metal ?? "",
          p.attributes?.material ?? "",
          p.subcategoryLabel,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      });
    }

    // 1c. Only products available in gioielleria
    if (onlyInStock) {
      filtered = filtered.filter((p) => p.inStock && p.stockQuantity > 0);
    }

    // 2. Material filter
    if (materialFilter !== "all") {
      filtered = filtered.filter((p) => {
        const attrs = p.attributes as Record<string, unknown> | undefined;
        const rawMat = String(
          attrs?.caseMaterial ||
            attrs?.["Materiale cassa"] ||
            attrs?.metal ||
            attrs?.material ||
            attrs?.Materiale ||
            "",
        ).toLowerCase();
        if (materialFilter === "oro") {
          return rawMat.includes("oro");
        }
        if (materialFilter === "argento") {
          return rawMat.includes("argento");
        }
        if (materialFilter === "acciaio") {
          return rawMat.includes("acciaio");
        }
        if (materialFilter === "bronzo") {
          return rawMat.includes("bronzo");
        }
        if (materialFilter === "titanio") {
          return rawMat.includes("titan");
        }
        if (materialFilter === "pelle_silicone") {
          return /pelle|silicone|polimero|saffiano|cuoio/.test(rawMat);
        }
        if (materialFilter === "porcellana_cristallo") {
          return (
            rawMat.includes("porcellana") ||
            rawMat.includes("cristallo") ||
            rawMat.includes("ceramica") ||
            rawMat.includes("vetro")
          );
        }
        if (materialFilter === "legno_vetro") {
          return /legno|bamb|vetro|midollino/.test(rawMat);
        }
        return true;
      });
    }

    // 3. Movement filter
    if (movementFilter !== "all") {
      filtered = filtered.filter((p) => {
        const mov = (p.attributes?.movement || "").toLowerCase();
        const name = p.name.toLowerCase();
        if (movementFilter === "automatico") {
          return mov.includes("automatic") || mov.includes("meccanic");
        }
        if (movementFilter === "crono") {
          return mov.includes("crono") || name.includes("crono");
        }
        if (movementFilter === "quarzo") {
          return mov.includes("quarz") || mov.includes("precisionist");
        }
        return true;
      });
    }

    // 4. Stone filter
    if (stoneFilter !== "all") {
      filtered = filtered.filter((p) => {
        const stones = (p.attributes?.stones || []).map((s) => s.toLowerCase());
        const hasPearl =
          stones.some((s) => /perla|perle/i.test(s)) ||
          Boolean((p.attributes as Record<string, unknown>)?.pearlType);
        if (stoneFilter === "diamante") {
          return stones.some((s) => s.includes("diamant"));
        }
        if (stoneFilter === "gemme_colore") {
          return stones.some((s) => /zaffir|rubin|smerald/i.test(s));
        }
        if (stoneFilter === "perla") {
          return hasPearl;
        }
        if (stoneFilter === "topazio_zirconi") {
          return stones.some((s) => /topazio|ametista|zircon|labradorite/i.test(s));
        }
        return true;
      });
    }

    // 5. Price filter
    if (priceFilter !== "all") {
      filtered = filtered.filter((p) => {
        if (priceFilter === "under50") return p.price < 50;
        if (priceFilter === "50_150") return p.price >= 50 && p.price <= 150;
        if (priceFilter === "150_500") return p.price > 150 && p.price <= 500;
        if (priceFilter === "over500") return p.price > 500;
        return true;
      });
    }

    // 6. Sorting
    const sorted = [...filtered];
    switch (sort) {
      case "prezzo-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "prezzo-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "novita":
        sorted.sort(
          (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
        );
        break;
      default:
        break;
    }
    return sorted;
  }, [
    products,
    active,
    filterType,
    sort,
    materialFilter,
    movementFilter,
    stoneFilter,
    priceFilter,
    searchQuery,
    onlyInStock,
  ]);

  return (
    <section className="container-luxe py-14 sm:py-16">
      {/* Barra filtri primaria */}
      <div
        className={cn(
          "flex flex-col gap-6 border-b border-line pb-6 lg:flex-row lg:items-center",
          filters.length > 0 ? "lg:justify-between" : "lg:justify-end",
        )}
      >
        {filters.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-graphite-soft">
              <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.6} />
              {filterLabel}
            </span>
            <button
              type="button"
              onClick={() => setActive("all")}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-medium transition-colors",
                active === "all"
                  ? "border-gold bg-gold text-white"
                  : "border-line text-graphite hover:border-gold hover:text-gold",
              )}
            >
              Tutti
              <span className="ml-1.5 opacity-60">{products.length}</span>
            </button>
            {filters.map((filter) => {
              const count = counts.get(filter.value) ?? 0;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setActive(filter.value)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-xs font-medium transition-colors",
                    active === filter.value
                      ? "border-gold bg-gold text-white"
                      : "border-line text-graphite hover:border-gold hover:text-gold",
                    count === 0 && "opacity-40",
                  )}
                >
                  {filter.label}
                  <span className="ml-1.5 opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="flex items-center gap-3 self-end lg:self-auto">
          <label
            htmlFor="sort"
            className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-graphite-soft"
          >
            Ordina
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            className="rounded-sm border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-gold"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Barra filtri secondari (Faccette contestuali per Categoria, Movimento, Pietra e Prezzo) */}
      <div className="mt-4 flex flex-wrap items-center gap-3 border-b border-line/60 pb-4 text-xs">
        <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-graphite-soft">
          <Filter className="h-3 w-3 text-gold" />
          Filtri rapidi:
        </span>

        {/* Ricerca testuale libera */}
        <div className="relative w-full sm:w-60">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-graphite-soft"
            strokeWidth={1.8}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cerca modello, brand o codice..."
            aria-label="Cerca modello, brand o codice"
            className="w-full min-w-0 rounded border border-line bg-white py-1 pl-8 pr-7 text-xs text-ink outline-none transition-colors placeholder:text-graphite-soft/70 focus:border-gold"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Cancella ricerca"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-graphite-soft transition-colors hover:bg-graphite/10 hover:text-graphite"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Metallo / Materiale contestuale */}
        {hasMetals && (
          <div className="flex items-center gap-1">
            <span className="mr-1 flex items-center gap-1 text-[0.65rem] uppercase tracking-wider text-graphite-soft/80">
              <Sparkles className="h-3 w-3 text-gold" /> {materialFieldLabel}
            </span>
            <select
              value={materialFilter}
              onChange={(e) => setMaterialFilter(e.target.value)}
              className={cn(
                "rounded border px-2.5 py-1 text-xs outline-none transition-colors",
                materialFilter !== "all"
                  ? "border-gold bg-gold/10 font-medium text-gold"
                  : "border-line bg-white text-graphite hover:border-graphite-soft",
              )}
            >
              <option value="all">{materialAllLabel}</option>
              {materialOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Movimento Orologi */}
        {hasMovements && (
          <div className="flex items-center gap-1">
            <span className="text-[0.65rem] uppercase tracking-wider text-graphite-soft/80 mr-1 flex items-center gap-1">
              <Watch className="h-3 w-3 text-gold" /> Movimento:
            </span>
            <select
              value={movementFilter}
              onChange={(e) => setMovementFilter(e.target.value)}
              className={cn(
                "rounded border px-2.5 py-1 text-xs outline-none transition-colors",
                movementFilter !== "all"
                  ? "border-gold bg-gold/10 font-medium text-gold"
                  : "border-line bg-white text-graphite hover:border-graphite-soft",
              )}
            >
              <option value="all">Tutti i movimenti</option>
              <option value="automatico">Meccanico / Automatico</option>
              <option value="crono">Cronografo</option>
              <option value="quarzo">Quarzo / Precisionist 262 kHz</option>
            </select>
          </div>
        )}

        {/* Pietre Preziose */}
        {hasStones && (
          <div className="flex items-center gap-1">
            <span className="text-[0.65rem] uppercase tracking-wider text-graphite-soft/80 mr-1 flex items-center gap-1">
              <Gem className="h-3 w-3 text-gold" /> Gemme:
            </span>
            <select
              value={stoneFilter}
              onChange={(e) => setStoneFilter(e.target.value)}
              className={cn(
                "rounded border px-2.5 py-1 text-xs outline-none transition-colors",
                stoneFilter !== "all"
                  ? "border-gold bg-gold/10 font-medium text-gold"
                  : "border-line bg-white text-graphite hover:border-graphite-soft",
              )}
            >
              <option value="all">Tutte le gemme</option>
              <option value="diamante">Diamanti Naturali</option>
              <option value="gemme_colore">Zaffiri, Rubini o Smeraldi</option>
              <option value="perla">Perle Coltivate</option>
              <option value="topazio_zirconi">Topazio, Ametista & Zirconi</option>
            </select>
          </div>
        )}

        {/* Fascia Prezzo */}
        <div className="flex items-center gap-1">
          <span className="text-[0.65rem] uppercase tracking-wider text-graphite-soft/80 mr-1">
            Prezzo:
          </span>
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className={cn(
              "rounded border px-2.5 py-1 text-xs outline-none transition-colors",
              priceFilter !== "all"
                ? "border-gold bg-gold/10 font-medium text-gold"
                : "border-line bg-white text-graphite hover:border-graphite-soft",
            )}
          >
            <option value="all">Tutti i prezzi</option>
            <option value="under50">Meno di 50 €</option>
            <option value="50_150">50 € – 150 €</option>
            <option value="150_500">150 € – 500 €</option>
            <option value="over500">Oltre 500 € (Alta Gamma)</option>
          </select>
        </div>

        {/* Disponibili in gioielleria */}
        <button
          type="button"
          onClick={() => setOnlyInStock((prev) => !prev)}
          aria-pressed={onlyInStock}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.7rem] font-medium transition-colors",
            onlyInStock
              ? "border-gold bg-gold/10 text-gold"
              : "border-line bg-white text-graphite hover:border-graphite-soft",
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              onlyInStock ? "bg-gold" : "bg-graphite-soft/50",
            )}
          />
          Disponibili in gioielleria
        </button>

        {/* Pulsante reset rapido */}
        {hasActiveFacets && (
          <button
            type="button"
            onClick={resetAllFacets}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-graphite/10 px-3 py-1 text-[0.7rem] font-medium text-graphite transition-colors hover:bg-gold hover:text-white"
          >
            <RotateCcw className="h-3 w-3" />
            Azzera filtri
          </button>
        )}
      </div>

      {/* Conteggio e feedback */}
      <div className="mt-3 flex items-center justify-between text-xs text-graphite-soft">
        <span>
          Mostrando <strong className="text-ink">{visible.length}</strong> {visible.length === 1 ? "prodotto" : "prodotti"}
          {hasActiveFacets && ` (filtrati da ${products.length} complessivi)`}
        </span>
      </div>

      {/* Griglia */}
      {visible.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-serif text-xl text-graphite">
            Nessun prodotto trovato con questa combinazione di filtri.
          </p>
          {hasActiveFacets && (
            <button
              type="button"
              onClick={resetAllFacets}
              className="mt-4 inline-flex items-center gap-2 rounded-sm border border-gold px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gold transition-colors hover:bg-gold hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reimposta tutti i filtri
            </button>
          )}
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
