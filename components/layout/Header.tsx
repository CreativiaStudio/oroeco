"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { SmartImage } from "@/components/ui/SmartImage";
import { mainNav, type NavItem } from "@/lib/navigation";
import type { Product } from "@/types/product";
import { cn, formatPrice } from "@/lib/utils";
import { selectTotalItems, useCartStore } from "@/store/useCartStore";
import { selectWishlistCount, useWishlistStore } from "@/store/useWishlistStore";

/* ------------------------------ Mega / Dropdown ----------------------------- */

type MegaVisualCard = {
  label: string;
  subtitle: string;
  href: string;
  image: string;
};

const MEGA_VISUAL_CARDS: Record<string, MegaVisualCard[]> = {
  "/gioielli": [
    {
      label: "Anelli & Solitari",
      subtitle: "Diamanti 18 kt",
      href: "/gioielli?sub=anelli",
      image: "/images/products/davite-delucchi/solitario_diamante_01.jpg",
    },
    {
      label: "Collane & Perle",
      subtitle: "Oro e perle Akoya",
      href: "/gioielli?sub=collane",
      image: "/images/products/nihama/nihama_akoya_strand_01.jpg",
    },
    {
      label: "Bracciali Tennis",
      subtitle: "Luce continua",
      href: "/gioielli?sub=bracciali",
      image: "/images/products/davite-delucchi/tennis_diamanti_01.jpg",
    },
    {
      label: "Orecchini d'Autore",
      subtitle: "Oro 18 kt",
      href: "/gioielli?sub=orecchini",
      image: "/images/products/luxury/dana_oro_cerchi_01.jpg",
    },
  ],
  "/orologi": [
    {
      label: "Orologi Uomo",
      subtitle: "Cronografi & Automatici",
      href: "/orologi?sub=uomo",
      image: "/images/products/paul-picot/paul_picot_firshire_moon_01.jpg",
    },
    {
      label: "Orologi Donna",
      subtitle: "Eleganza al polso",
      href: "/orologi?sub=donna",
      image: "/images/products/locman/locman_1960_lady_01.jpg",
    },
    {
      label: "Subacquei & Sport",
      subtitle: "Locman & Paul Picot",
      href: "/orologi?sub=uomo",
      image: "/images/products/locman/locman_montecristo_01.jpg",
    },
  ],
  "/accessori": [
    {
      label: "Bracciali & Pietre",
      subtitle: "Collezione Gerba",
      href: "/accessori?sub=gemelli",
      image: "/images/products/luxury/gerba_bracciale_pietre_01.jpg",
    },
    {
      label: "Gioielli Simbolici",
      subtitle: "Creazioni AMEN",
      href: "/accessori?sub=portachiavi",
      image: "/images/products/luxury/amen_medaglia_01.jpg",
    },
    {
      label: "Confezioni Regalo",
      subtitle: "Astucci ORO&co",
      href: "/accessori?sub=pelletteria",
      image: "/images/products/luxury/luxury_gift_box.jpg",
    },
  ],
  "/casa": [
    {
      label: "Porcellane Lladró",
      subtitle: "Sculture Valencia",
      href: "/casa?sub=statue",
      image: "/images/products/lladro/lladro_angelo_celestiale_01.jpg",
    },
    {
      label: "Tavola Villeroy & Boch",
      subtitle: "Posate e calici",
      href: "/casa?sub=posate",
      image: "/images/products/villeroy/villeroy_posate_01.jpg",
    },
    {
      label: "Vasi & Cristalli",
      subtitle: "Arredo prezioso",
      href: "/casa?sub=vasi",
      image: "/images/products/villeroy/villeroy_perle_vaso_01.jpg",
    },
  ],
  "/natale": [
    {
      label: "Decorazioni Festive",
      subtitle: "L'incanto in casa",
      href: "/natale?sub=decorazioni",
      image: "/images/natale/natale-2.jpg",
    },
    {
      label: "Toy's Delight",
      subtitle: "Villeroy & Boch",
      href: "/natale?sub=regali",
      image: "/images/products/villeroy/villeroy_toys_delight_01.jpg",
    },
    {
      label: "Regali Preziosi",
      subtitle: "Confezione inclusa",
      href: "/natale?sub=regali",
      image: "/images/natale/natale-3.jpg",
    },
  ],
};

const BRAND_VISUAL_CARDS = [
  {
    label: "Gioielleria",
    href: "/storia",
    image: "/images/editorial/modella-1.jpg",
    imageClassName: "",
  },
  {
    label: "Orologi",
    href: "/orologi",
    image: "/images/products/paul-picot/paul_picot_yachtman_01.jpg",
    imageClassName: "object-cover object-[50%_16%] scale-[1.08]",
  },
];

function MegaPanel({ item }: { item: NavItem }) {
  const isBrand = item.href === "/brand";
  const visualCards = MEGA_VISUAL_CARDS[item.href] ?? [];
  const columns = item.columns ?? [];
  const children = item.children ?? [];

  return (
    <div className="w-full border-t border-[#dedede] bg-white text-[#020202] shadow-[0_30px_60px_-45px_rgba(10,10,10,0.35)]">
      {isBrand ? (
        <div className="container-luxe grid grid-cols-1 gap-10 py-10 lg:grid-cols-[1.35fr_1fr]">
          <div className="flex flex-col gap-5">
            <span className="eyebrow-muted">Le Maison</span>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
              {children.map((brand) => (
                <li key={brand.href}>
                  <Link
                    href={brand.href}
                    className="font-serif text-[0.95rem] uppercase tracking-[0.12em] text-[#020202] transition-colors hover:text-gold"
                  >
                    {brand.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {BRAND_VISUAL_CARDS.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group relative overflow-hidden rounded-sm border border-[#eaeaea]"
              >
                <SmartImage
                  src={card.image}
                  alt={card.label}
                  className="aspect-[3/4] w-full"
                  imageClassName={cn(
                    "transition-transform duration-[900ms] ease-out group-hover:scale-105",
                    card.imageClassName,
                  )}
                  sizes="220px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020202]/70 via-[#020202]/10 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-5 font-serif text-[0.9rem] uppercase tracking-[0.18em] text-white">
                  {card.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="container-luxe grid grid-cols-1 gap-8 py-10 lg:grid-cols-[200px_1fr_300px]">
          <div className="flex flex-col gap-5">
            {columns.length > 0 ? (
              columns.map((column) => (
                <div key={column.heading} className="flex flex-col gap-2.5">
                  <span className="eyebrow-muted">{column.heading}</span>
                  <ul className="flex flex-col gap-2">
                    {column.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="font-serif text-[0.95rem] text-[#4e423e] transition-colors hover:text-gold"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <ul className="flex flex-col gap-2">
                {children.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-serif text-[0.95rem] text-[#4e423e] transition-colors hover:text-gold"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            className={cn(
              "grid grid-cols-2 gap-4",
              visualCards.length >= 4 ? "xl:grid-cols-4" : "xl:grid-cols-3",
            )}
          >
            {visualCards.map((card) => (
              <Link key={card.href} href={card.href} className="group flex flex-col gap-3">
                <div className="overflow-hidden border border-[#eaeaea] bg-[#fafafa]">
                  <SmartImage
                    src={card.image}
                    alt={card.label}
                    className="aspect-square w-full"
                    imageClassName="transition-transform duration-[900ms] ease-out group-hover:scale-105"
                    sizes="(min-width: 1280px) 220px, 45vw"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-serif text-[0.9rem] uppercase tracking-[0.12em] text-[#020202]">
                    {card.label}
                  </span>
                  <span className="font-serif text-[0.82rem] italic text-[#6b6b6b]">
                    {card.subtitle}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {item.featured ? (
            <Link
              href={item.featured.href}
              className="group relative hidden min-h-[280px] overflow-hidden rounded-sm border border-[#eaeaea] lg:block"
            >
              <SmartImage
                src={item.featured.image}
                alt={item.featured.title}
                className="absolute inset-0 h-full w-full"
                imageClassName="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
                sizes="300px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020202]/80 via-[#020202]/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-6">
                <span className="eyebrow text-gold-soft">{item.featured.eyebrow}</span>
                <span className="font-serif text-xl text-white">
                  {item.featured.title}
                </span>
                <span className="text-xs leading-relaxed text-white/75">
                  {item.featured.description}
                </span>
                <span className="mt-2 text-[0.7rem] uppercase tracking-[0.22em] text-gold-soft">
                  {item.featured.cta} →
                </span>
              </div>
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* --------------------------------- Header ---------------------------------- */

function openAccountDrawer() {
  window.dispatchEvent(new CustomEvent("oroeco_open_account"));
}

export function Header() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [liveProducts, setLiveProducts] = useState<Product[] | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const itemCount = useCartStore(selectTotalItems);
  const openCart = useCartStore((s) => s.openCart);
  const wishlistCount = useWishlistStore(selectWishlistCount);

  const isHome = pathname === "/";
  const solid = !isHome || scrolled || Boolean(openMenu);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenMenu(null), 140);
  };

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => () => cancelClose(), []);

  useEffect(() => {
    cancelClose();
    setOpenMenu(null);
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
        setOpenMenu(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!searchOpen || liveProducts !== null) return;
    fetch("/api/products/public")
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d) => setLiveProducts(Array.isArray(d.products) ? d.products : []))
      .catch(() => setLiveProducts([]));
  }, [searchOpen, liveProducts]);

  const results = useMemo(() => {
    if (!liveProducts) return [];
    const q = query.trim().toLowerCase();
    if (!q) return liveProducts.filter((p) => p.isFeatured).slice(0, 6);
    return liveProducts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [query, liveProducts]);
  const activeMenu = mainNav.find((item) => item.label === openMenu) ?? null;

  const iconButton = cn(
    "relative inline-flex h-10 w-10 items-center justify-center rounded-sm transition-colors hover:text-gold",
    solid ? "text-[#020202]" : "text-white",
  );

  return (
    <>
      <header
        onMouseLeave={scheduleClose}
        onMouseEnter={cancelClose}
        className={cn(
          "h-16 transition-all duration-300 lg:h-20",
          isHome ? "fixed inset-x-0 top-0 z-40" : "sticky top-0 z-40",
          solid
            ? "border-b border-[#dedede] bg-white/98 text-[#020202] shadow-[0_12px_36px_-28px_rgba(2,2,2,0.22)] backdrop-blur-md"
            : "border-b border-transparent bg-transparent text-white before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:-z-10 before:h-28 before:bg-gradient-to-b before:from-[#17130f]/55 before:via-[#17130f]/20 before:to-transparent",
        )}
      >
        <div className="mx-auto grid h-full max-w-[1600px] grid-cols-[auto_1fr_auto] items-center gap-4 px-5 lg:gap-8 lg:px-10">
          {/* Sinistra */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Apri il menu"
                className={cn(iconButton, "-ml-2")}
              >
                <Menu className="h-5 w-5" strokeWidth={1.35} />
              </button>
              <Logo variant="wordmark" tone={solid ? "dark" : "light"} compact />
            </div>
            <div className="hidden items-center lg:flex">
              <Logo variant="wordmark" tone={solid ? "dark" : "light"} compact />
            </div>
          </div>

          {/* Centro */}
          <div className="hidden items-center justify-center lg:flex">
            <nav aria-label="Navigazione principale">
              <ul className="flex items-center justify-center gap-4 xl:gap-8">
                {mainNav.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));
                  const hasPanel = Boolean(
                    item.columns?.length || item.children?.length,
                  );
                  return (
                    <li
                      key={item.label}
                      onMouseEnter={() => {
                        cancelClose();
                        setOpenMenu(hasPanel ? item.label : null);
                      }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setOpenMenu(null)}
                        className={cn(
                          "group relative inline-flex items-center whitespace-nowrap py-2 font-serif text-[0.70rem] xl:text-[0.78rem] uppercase tracking-[0.13em] xl:tracking-[0.18em] transition-colors hover:text-gold",
                          "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 hover:after:scale-x-100",
                          isActive && "text-gold after:scale-x-100",
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Destra */}
          <div className="flex items-center justify-end gap-3 sm:gap-5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Cerca"
              className={iconButton}
            >
              <Search className="h-5 w-5" strokeWidth={1.35} />
            </button>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("oroeco_open_account"))}
              aria-label="Area Riservata Clienti"
              className={iconButton}
            >
              <User className="h-5 w-5" strokeWidth={1.35} />
            </button>

            <button
              type="button"
              onClick={openCart}
              aria-label="Apri il carrello"
              className={iconButton}
            >
              <ShoppingBag className="h-5 w-5" strokeWidth={1.35} />
              {mounted && itemCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[1.15rem] place-items-center rounded-full bg-gold px-1 text-[0.6rem] font-semibold text-white">
                  {itemCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {activeMenu ? (
          <div
            className="absolute left-0 right-0 top-full hidden lg:block"
            onMouseEnter={cancelClose}
          >
            <MegaPanel item={activeMenu} />
          </div>
        ) : null}
      </header>

      {/* Ricerca */}
      {searchOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Chiudi ricerca"
            onClick={() => setSearchOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          />
          <div className="relative mx-auto mt-[10vh] w-[92%] max-w-2xl overflow-hidden rounded-md border border-line bg-white shadow-[0_40px_90px_-40px_rgba(10,10,10,0.5)]">
            <div className="flex items-center gap-3 border-b border-line px-5">
              <Search className="h-5 w-5 text-gold" strokeWidth={1.6} />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cerca un gioiello, un marchio, un codice…"
                className="h-16 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-graphite-soft"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Chiudi"
                className="text-graphite-soft transition-colors hover:text-ink"
              >
                <X className="h-5 w-5" strokeWidth={1.6} />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto">
              {query.trim() === "" ? (
                <div className="px-5 py-8 text-sm text-graphite-soft">
                  <p className="eyebrow mb-3">Ricerche rapide</p>
                  <div className="flex flex-wrap gap-2">
                    {["Solitario", "Tennis", "Bulova", "Cammeo", "Natale", "Lladró"].map(
                      (term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => setQuery(term)}
                          className="rounded-full border border-line px-3.5 py-1.5 text-xs uppercase tracking-[0.14em] text-graphite transition-colors hover:border-gold hover:text-gold"
                        >
                          {term}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              ) : results.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-graphite-soft">
                  Nessun risultato per «{query}».
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {results.map((product) => (
                    <li key={product.id}>
                      <Link
                        href={`/prodotto/${product.slug}`}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-pearl"
                      >
                        <SmartImage
                          src={product.images[0]}
                          alt={product.name}
                          className="h-14 w-14 shrink-0 rounded-sm border border-line"
                          sizes="56px"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[0.7rem] uppercase tracking-[0.18em] text-gold">
                            {product.brand}
                          </span>
                          <span className="block truncate font-serif text-base text-ink">
                            {product.name}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-medium text-ink">
                          {formatPrice(product.price)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Menu mobile */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Chiudi il menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm animate-drawer-in flex-col bg-white text-[#020202] shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <Logo variant="wordmark" tone="dark" compact />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Chiudi"
                className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-ink transition-colors hover:text-gold"
              >
                <X className="h-5 w-5" strokeWidth={1.6} />
              </button>
            </div>
            <MobileNav onNavigate={() => setMobileOpen(false)} />
            <div className="mt-auto grid gap-2 border-t border-line p-5">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  openAccountDrawer();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#020202] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#4e423e]"
              >
                <User className="h-4 w-4" strokeWidth={1.6} />
                Area Riservata Clienti
              </button>
              <Link
                href="/wishlist"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-sm border border-line px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink"
              >
                <Heart className="h-4 w-4" strokeWidth={1.6} />
                Wishlist
                {mounted && wishlistCount > 0 ? ` (${wishlistCount})` : null}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/* ------------------------------- Mobile nav -------------------------------- */

function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-3">
      <ul className="flex flex-col">
        {mainNav.map((item) => {
          const links =
            item.children ??
            item.columns?.flatMap((column) => column.links) ??
            [];
          const hasChildren = links.length > 0;
          const isExpanded = expanded === item.label;
          return (
            <li key={item.label} className="border-b border-line/70 last:border-0">
              <div className="flex items-center">
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className="flex-1 py-4 pl-3 text-sm font-medium uppercase tracking-[0.16em] text-ink"
                >
                  {item.label}
                </Link>
                {hasChildren ? (
                  <button
                    type="button"
                    aria-label={`Espandi ${item.label}`}
                    aria-expanded={isExpanded}
                    onClick={() =>
                      setExpanded(isExpanded ? null : item.label)
                    }
                    className="grid h-11 w-11 place-items-center text-graphite-soft"
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-300",
                        isExpanded && "rotate-180",
                      )}
                      strokeWidth={1.8}
                    />
                  </button>
                ) : null}
              </div>
              {hasChildren && isExpanded ? (
                <ul className="flex flex-col gap-1 pb-4 pl-3">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={onNavigate}
                        className="block py-2 text-sm text-graphite transition-colors hover:text-gold"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}