"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  Barcode,
  Boxes,
  Building2,
  Calculator,
  Check,
  CheckCheck,
  ChevronDown,
  Clock,
  Coins,
  Database,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  History,
  Images,
  LayoutDashboard,
  type LucideIcon,
  Minus,
  Package,
  Pencil,
  PlugZap,
  Plus,
  Receipt,
  RefreshCw,
  RotateCcw,
  ScanBarcode,
  ScrollText,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  ThumbsDown,
  ThumbsUp,
  Truck,
  Upload,
  Users,
  Wifi,
  X,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { SmartImage } from "@/components/ui/SmartImage";
import { ProductInspectorModal } from "@/components/admin/ProductInspectorModal";
import { AdminCrmSection } from "@/components/admin/AdminCrmSection";
import { AdminBillingConnectionSection } from "@/components/admin/AdminBillingConnectionSection";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { findProductByCode, getAllBrands, getAllProducts } from "@/lib/catalog";
import { cn, formatPrice } from "@/lib/utils";
import { useInventoryStore } from "@/store/useInventoryStore";
import type {
  CassaOperator,
  InventoryMovementType,
  InventoryTransaction,
} from "@/types/cassa";
import type { Product, ProductCategory } from "@/types/product";

/* ==========================================================================
   GESTIONALE ORO&CO — Dashboard `/admin`
   Palette dedicata: sfondo #F8F7F4, card #FFFFFF, bordi #E5E0D5,
   sidebar/topbar blu ORO&CO #012236, accenti oro #C5A059.
   Nessuna connessione a database esterni: solo catalogo locale + store Zustand.
   ========================================================================== */

type AdminSection =
  | "overview"
  | "inventory"
  | "media"
  | "invoices"
  | "orders"
  | "crm"
  | "billing_connection"
  | "audit";

interface SectionDef {
  id: AdminSection;
  label: string;
  caption: string;
  icon: LucideIcon;
}

const SECTIONS: SectionDef[] = [
  {
    id: "overview",
    label: "Panoramica & KPI",
    caption: "Stato gioielleria in tempo reale",
    icon: LayoutDashboard,
  },
  {
    id: "inventory",
    label: "Magazzino & Catalogo",
    caption: "Giacenze, prezzi e rettifiche",
    icon: Package,
  },
  {
    id: "media",
    label: "Libreria Media (R2)",
    caption: "Archivio Cloudflare foto & video",
    icon: Images,
  },
  {
    id: "invoices",
    label: "Fatture SDI & Fornitori",
    caption: "Ciclo passivo e attivo",
    icon: FileText,
  },
  {
    id: "orders",
    label: "Ordini & Spedizioni",
    caption: "E-commerce e portavalori",
    icon: ShoppingCart,
  },
  {
    id: "crm",
    label: "CRM Clienti & Orbita",
    caption: "Acquisti, banco e appuntamenti",
    icon: Users,
  },
  {
    id: "billing_connection",
    label: "Connessione Fatturazione & Cassa",
    caption: "SDI, Cassa Aura RT e Pistola",
    icon: PlugZap,
  },
  {
    id: "audit",
    label: "Scatola Nera & Operatori",
    caption: "Registro movimenti",
    icon: ScrollText,
  },
];

/* --------------------------------------------------------------------------
   Etichette e metadati di dominio (locali, nessuna fonte esterna)
   -------------------------------------------------------------------------- */

const CATEGORY_FILTERS: { id: "all" | ProductCategory; label: string }[] = [
  { id: "all", label: "Tutte le categorie" },
  { id: "gioielli", label: "Gioielli" },
  { id: "orologi", label: "Orologi" },
  { id: "accessori", label: "Accessori" },
  { id: "casa", label: "Casa" },
  { id: "natale", label: "Natale" },
];

const OPERATOR_FILTERS: ("Tutti" | CassaOperator)[] = [
  "Tutti",
  "Renato",
  "Carmela",
  "Maria",
];

const MOVEMENT_META: Record<
  InventoryMovementType,
  { label: string; tone: "sale" | "load" | "adjust"; description: string }
> = {
  pos_instore_sale: {
    label: "Vendita Banco POS",
    tone: "sale",
    description: "Scontrino registrato al banco cassa",
  },
  ecom_online_sale: {
    label: "Vendita E-Commerce",
    tone: "sale",
    description: "Ordine evaso dallo storefront online",
  },
  restock: {
    label: "Carico Merce",
    tone: "load",
    description: "Riassortimento da fornitore o rettifica positiva",
  },
  manual_adjustment: {
    label: "Rettifica Manuale",
    tone: "adjust",
    description: "Adeguamento inventario operatore",
  },
  return_restock: {
    label: "Reso a Magazzino",
    tone: "load",
    description: "Rientro articolo integro in giacenza",
  },
  return_damaged: {
    label: "Reso Danneggiato",
    tone: "sale",
    description: "Articolo non rivendibile rimosso dal disponibile",
  },
};

/* --------------------------------------------------------------------------
   Tipi dati dimostrativi per fatture e ordini (coerenti col futuro Supabase)
   -------------------------------------------------------------------------- */

interface PassiveInvoice {
  docNumber: string;
  supplier: string;
  vatId: string;
  date: string;
  taxable: number;
  status: "Pagata" | "In Scadenza";
}

interface ActiveInvoice {
  number: string;
  date: string;
  customer: string;
  recipient: string;
  total: number;
  sdiStatus: "Consegnata" | "In Trasmissione";
}

type OrderStatus = "Da Spedire" | "Ritiro in Gioielleria" | "Consegnato";

interface DemoOrder {
  id: string;
  date: string;
  customer: string;
  city: string;
  amount: number;
  items: number;
  status: OrderStatus;
  fulfillment: string;
  tracking: string;
}

const PASSIVE_INVOICES: PassiveInvoice[] = [
  {
    docNumber: "FPR-2026-0184",
    supplier: "Unoaerre S.p.A.",
    vatId: "IT00723110010",
    date: "10/03/2026",
    taxable: 4820,
    status: "Pagata",
  },
  {
    docNumber: "FPR-2026-0179",
    supplier: "Bulova Italia S.r.l.",
    vatId: "IT04511220962",
    date: "06/03/2026",
    taxable: 3210,
    status: "In Scadenza",
  },
  {
    docNumber: "FPR-2026-0171",
    supplier: "Locman S.p.A.",
    vatId: "IT01584700499",
    date: "28/02/2026",
    taxable: 5640,
    status: "Pagata",
  },
  {
    docNumber: "FPR-2026-0163",
    supplier: "Stroili Oro S.p.A.",
    vatId: "IT03162510280",
    date: "21/02/2026",
    taxable: 1875,
    status: "In Scadenza",
  },
];

const ACTIVE_INVOICES: ActiveInvoice[] = [
  {
    number: "FT-2026-0091",
    date: "11/03/2026",
    customer: "Giulia Ferrara",
    recipient: "0000000",
    total: 2480,
    sdiStatus: "Consegnata",
  },
  {
    number: "FT-2026-0090",
    date: "10/03/2026",
    customer: "Martina Esposito",
    recipient: "M5UXCR1",
    total: 1290,
    sdiStatus: "Consegnata",
  },
  {
    number: "FT-2026-0089",
    date: "09/03/2026",
    customer: "Cerimonia & Eventi S.r.l.",
    recipient: "7X9K2L1",
    total: 3150,
    sdiStatus: "In Trasmissione",
  },
  {
    number: "FT-2026-0088",
    date: "08/03/2026",
    customer: "Luca De Luca",
    recipient: "0000000",
    total: 690,
    sdiStatus: "Consegnata",
  },
];

const INITIAL_ORDERS: DemoOrder[] = [
  {
    id: "ORD-2026-1043",
    date: "11/03/2026 18:42",
    customer: "Giulia Ferrara",
    city: "Salerno (SA)",
    amount: 2480,
    items: 1,
    status: "Da Spedire",
    fulfillment: "Corriere Portavalori Assicurato · Ferrari Group",
    tracking: "FRR-IT-884210",
  },
  {
    id: "ORD-2026-1042",
    date: "11/03/2026 16:05",
    customer: "Antonio Russo",
    city: "San Marzano sul Sarno (SA)",
    amount: 540,
    items: 2,
    status: "Ritiro in Gioielleria",
    fulfillment: "Ritiro in sede · Via Filippo Turati, n. 30",
    tracking: "—",
  },
  {
    id: "ORD-2026-1041",
    date: "10/03/2026 11:20",
    customer: "Martina Esposito",
    city: "Roma (RM)",
    amount: 1290,
    items: 1,
    status: "Consegnato",
    fulfillment: "Corriere Portavalori Assicurato · Brinks Italia",
    tracking: "BRK-IT-556039",
  },
  {
    id: "ORD-2026-1040",
    date: "09/03/2026 09:14",
    customer: "Luca De Luca",
    city: "Nocera Inferiore (SA)",
    amount: 690,
    items: 1,
    status: "Da Spedire",
    fulfillment: "Corriere Portavalori Assicurato · Ferrari Group",
    tracking: "FRR-IT-884166",
  },
  {
    id: "ORD-2026-1039",
    date: "08/03/2026 15:33",
    customer: "Sara Amato",
    city: "Cava de' Tirreni (SA)",
    amount: 1890,
    items: 2,
    status: "Consegnato",
    fulfillment: "Corriere Portavalori Assicurato · Brinks Italia",
    tracking: "BRK-IT-555902",
  },
];

/* --------------------------------------------------------------------------
   Utility di formattazione
   -------------------------------------------------------------------------- */

const VAT_RATE = 0.22;

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

/* --------------------------------------------------------------------------
   Micro-componenti di presentazione
   -------------------------------------------------------------------------- */

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-sm border border-[#E5E0D5] bg-white shadow-[0_18px_44px_-38px_rgba(10,10,10,0.55)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

function CardHeader({
  icon: Icon,
  title,
  caption,
  action,
}: {
  icon: LucideIcon;
  title: string;
  caption?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E0D5] px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-sm bg-[#012236] text-[#C5A059]">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <div>
          <h2 className="font-serif text-lg font-semibold leading-tight text-ink">
            {title}
          </h2>
          {caption ? (
            <p className="text-[0.68rem] uppercase tracking-[0.14em] text-graphite-soft">
              {caption}
            </p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  trend?: string;
}) {
  return (
    <article className="rounded-sm border border-[#E5E0D5] bg-white p-5 shadow-[0_18px_44px_-38px_rgba(10,10,10,0.55)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-graphite-soft">
          {label}
        </p>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-[#F8F7F4] text-[#C5A059]">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
      </div>
      <p className="mt-3 font-serif text-3xl font-bold leading-none text-ink">
        {value}
      </p>
      <p className="mt-2 text-xs text-graphite">{hint}</p>
      {trend ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#C5A059]">
          <Sparkles className="h-3 w-3" />
          {trend}
        </p>
      ) : null}
    </article>
  );
}

function StockBadge({ quantity }: { quantity: number }) {
  if (quantity <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-red-700">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Esaurito
      </span>
    );
  }
  if (quantity === 1) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Ultimo Pezzo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Disponibile
    </span>
  );
}

function MovementBadge({ type }: { type: InventoryMovementType }) {
  const meta = MOVEMENT_META[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider",
        meta.tone === "sale" && "bg-red-50 text-red-700",
        meta.tone === "load" && "bg-emerald-50 text-emerald-700",
        meta.tone === "adjust" && "bg-[#F8F7F4] text-graphite",
      )}
    >
      {meta.label}
    </span>
  );
}

function LiveDot({ tone = "green" }: { tone?: "green" | "amber" }) {
  return (
    <span className="relative flex h-2 w-2">
      <span
        className={cn(
          "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
          tone === "green" ? "bg-emerald-400" : "bg-amber-400",
        )}
      />
      <span
        className={cn(
          "relative inline-flex h-2 w-2 rounded-full",
          tone === "green" ? "bg-emerald-500" : "bg-amber-500",
        )}
      />
    </span>
  );
}

function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-10 text-center text-sm text-graphite-soft">
        {message}
      </td>
    </tr>
  );
}

/* ==========================================================================
   Componente principale
   ========================================================================== */

export function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [mounted, setMounted] = useState(false);

  // Store giacenze locale (Zustand persist · localStorage, nessun DB esterno)
  const stocks = useInventoryStore((state) => state.stocks);
  const transactions = useInventoryStore((state) => state.transactions);
  const restock = useInventoryStore((state) => state.restock);
  const depleteStock = useInventoryStore((state) => state.depleteStock);
  const resetToCatalog = useInventoryStore((state) => state.resetToCatalog);

  useEffect(() => setMounted(true), []);

  // Dati deterministici da catalogo locale
  const products = useMemo(() => getAllProducts(), []);
  const brands = useMemo(() => getAllBrands(), []);

  // Valori "live" solo dopo l'idratazione: SSR e primo render client coincidono.
  const liveStocks = mounted ? stocks : null;
  const liveTransactions: InventoryTransaction[] = mounted ? transactions : [];

  const stockFor = (product: Product): number => {
    if (liveStocks && typeof liveStocks[product.id] === "number") {
      return liveStocks[product.id];
    }
    return product.stockQuantity;
  };

  /* -------------------------- Sezione: Panoramica ------------------------- */

  const kpi = useMemo(() => {
    let totalValue = 0;
    let totalPieces = 0;
    let outOfStock = 0;
    let lowStock = 0;
    for (const product of products) {
      const quantity =
        liveStocks && typeof liveStocks[product.id] === "number"
          ? liveStocks[product.id]
          : product.stockQuantity;
      totalValue += product.price * quantity;
      totalPieces += quantity;
      if (quantity <= 0) outOfStock += 1;
      else if (quantity === 1) lowStock += 1;
    }
    return { totalValue, totalPieces, outOfStock, lowStock };
  }, [products, liveStocks]);

  const todayMovements = useMemo(() => {
    const today = new Date().toDateString();
    return liveTransactions.filter(
      (tx) => new Date(tx.timestamp).toDateString() === today,
    ).length;
  }, [liveTransactions]);

  const recentTransactions = liveTransactions.slice(0, 6);

  /* -------------------------- Sezione: Magazzino -------------------------- */

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | ProductCategory>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [inventoryNotice, setInventoryNotice] = useState<string | null>(null);

  // Prodotti reali da Supabase & Workflow Approvazioni Renato
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loadingDb, setLoadingDb] = useState(false);
  const [approvalTab, setApprovalTab] = useState<"all" | "online" | "cassa_only">("all");
  const [approvingIds, setApprovingIds] = useState<string[]>([]);
  const [bulkApproving, setBulkApproving] = useState(false);

  // Caricamento asincrono prodotti reali da Supabase
  const loadDbProducts = () => {
    setLoadingDb(true);
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          setDbProducts(data.products);
        }
      })
      .catch((err) => console.warn("Fallback catalogo locale:", err))
      .finally(() => setLoadingDb(false));
  };

  useEffect(() => {
    loadDbProducts();
  }, []);

  // Usa prodotti da Supabase se disponibili, altrimenti fallback locale
  const allProducts = dbProducts.length > 0 ? dbProducts : products;

  // Conteggi Canale E-Commerce vs Solo Cassa
  const onlineCount = useMemo(
    () => allProducts.filter((p) => p.approvalStatus === "approved").length,
    [allProducts]
  );
  const cassaOnlyCount = useMemo(
    () => allProducts.filter((p) => p.approvalStatus !== "approved").length,
    [allProducts]
  );

  // Marchi disponibili con conteggio dinamico dei prodotti
  const availableBrands = useMemo(() => {
    const countsBySlug: Record<string, number> = {};
    const countsByName: Record<string, number> = {};

    allProducts.forEach((p) => {
      if (p.brandSlug) countsBySlug[p.brandSlug] = (countsBySlug[p.brandSlug] || 0) + 1;
      if (p.brand) countsByName[p.brand.toLowerCase()] = (countsByName[p.brand.toLowerCase()] || 0) + 1;
    });

    const list = brands.map((b) => {
      const cSlug = countsBySlug[b.slug] || 0;
      const cName = countsByName[b.name.toLowerCase()] || 0;
      return {
        id: b.id,
        slug: b.slug,
        name: b.name,
        count: Math.max(cSlug, cName),
      };
    });

    return list.sort((a, b) => a.name.localeCompare(b.name, "it"));
  }, [allProducts, brands]);

  const filteredProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return allProducts.filter((product) => {
      // Filtro Canale E-Commerce vs Solo Cassa
      if (approvalTab === "online" && product.approvalStatus !== "approved") return false;
      if (approvalTab === "cassa_only" && product.approvalStatus === "approved") return false;

      if (categoryFilter !== "all" && product.category !== categoryFilter) return false;
      if (brandFilter !== "all") {
        const normFilter = brandFilter.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, "").replace(/[^a-z0-9]/g, "");
        const normSlug = (product.brandSlug || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, "").replace(/[^a-z0-9]/g, "");
        const normName = (product.brand || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, "").replace(/[^a-z0-9]/g, "");
        const matches =
          product.brandSlug === brandFilter ||
          product.brand === brandFilter ||
          normSlug === normFilter ||
          normName === normFilter;
        if (!matches) return false;
      }
      if (!needle) return true;
      const haystack = [product.name, product.sku, product.barcode, product.brand]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [allProducts, query, categoryFilter, brandFilter, approvalTab]);

  // Selezione multipla per modifiche massive (es. 30 prodotti in Solo Cassa)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchProcessing, setBatchProcessing] = useState(false);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const allFilteredSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedIds.includes(p.id));

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const handleBatchSetStatus = async (status: "approved" | "rejected") => {
    if (selectedIds.length === 0) return;
    setBatchProcessing(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "batch_update_status",
          ids: selectedIds,
          status,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDbProducts((prev) =>
          prev.map((p) =>
            selectedIds.includes(p.id) ? { ...p, approvalStatus: status } : p
          )
        );
        const label =
          status === "approved"
            ? "ONLINE sull'e-commerce"
            : "in SOLO CASSA (rimossi dal sito web)";
        setInventoryNotice(
          `✓ ${selectedIds.length} prodotti impostati con successo su ${label}!`
        );
        setSelectedIds([]);
      } else {
        setInventoryNotice(`Errore modifica massiva: ${data.error}`);
      }
    } catch (e: any) {
      setInventoryNotice(`Errore modifica massiva: ${e.message}`);
    } finally {
      setBatchProcessing(false);
    }
  };

  // Handler toggle visibilità 1-click (Online E-Commerce ↔ Solo Cassa Banco)
  const handleToggleVisibility = async (product: Product) => {
    const isCurrentlyOnline = product.approvalStatus === "approved";
    const nextStatus = isCurrentlyOnline ? "rejected" : "approved";

    setApprovingIds((prev) => [...prev, product.id]);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_approval", id: product.id, status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setDbProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, approvalStatus: nextStatus } : p))
        );
        if (nextStatus === "approved") {
          setInventoryNotice(`Prodotto "${product.name}" ora ONLINE sull'e-commerce!`);
        } else {
          setInventoryNotice(`Prodotto "${product.name}" rimosso dal sito: ora è SOLO CASSA (disponibile per cassa Aura RT).`);
        }
      }
    } catch (e: any) {
      setInventoryNotice(`Errore cambio visibilità: ${e.message}`);
    } finally {
      setApprovingIds((prev) => prev.filter((id) => id !== product.id));
    }
  };

  // Handler approvazione singolo
  const handleApproveProduct = async (product: Product) => {
    setApprovingIds((prev) => [...prev, product.id]);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_approval", id: product.id, status: "approved" }),
      });
      const data = await res.json();
      if (data.success) {
        setDbProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, approvalStatus: "approved" } : p))
        );
        setInventoryNotice(`Prodotto "${product.name}" approvato! Ora è visibile nello storefront.`);
      }
    } catch (e: any) {
      setInventoryNotice(`Errore approvazione: ${e.message}`);
    } finally {
      setApprovingIds((prev) => prev.filter((id) => id !== product.id));
    }
  };

  // Handler rifiuto singolo
  const handleRejectProduct = async (product: Product) => {
    setApprovingIds((prev) => [...prev, product.id]);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_approval", id: product.id, status: "rejected" }),
      });
      const data = await res.json();
      if (data.success) {
        setDbProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, approvalStatus: "rejected" } : p))
        );
        setInventoryNotice(`Prodotto "${product.name}" rifiutato.`);
      }
    } catch (e: any) {
      setInventoryNotice(`Errore rifiuto: ${e.message}`);
    } finally {
      setApprovingIds((prev) => prev.filter((id) => id !== product.id));
    }
  };

  // Handler approvazione massiva
  const handleBulkApproveFiltered = async () => {
    const idsToApprove = filteredProducts
      .filter((p) => p.approvalStatus !== "approved")
      .map((p) => p.id);

    if (idsToApprove.length === 0) return;

    setBulkApproving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "batch_approve", ids: idsToApprove }),
      });
      const data = await res.json();
      if (data.success) {
        const approvedSet = new Set(idsToApprove);
        setDbProducts((prev) =>
          prev.map((p) => (approvedSet.has(p.id) ? { ...p, approvalStatus: "approved" } : p))
        );
        setInventoryNotice(`${idsToApprove.length} prodotti approvati in blocco con successo!`);
      }
    } catch (e: any) {
      setInventoryNotice(`Errore approvazione massiva: ${e.message}`);
    } finally {
      setBulkApproving(false);
    }
  };

  // Modale Dettagli & Ispezione Prodotto per Renato
  const [inspectingProduct, setInspectingProduct] = useState<Product | null>(null);
  const [isModalProcessing, setIsModalProcessing] = useState(false);

  const handleSaveProductDetails = async (updated: Product) => {
    setIsModalProcessing(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_details",
          id: updated.id,
          updates: {
            name: updated.name,
            category: updated.category,
            subcategoryLabel: updated.subcategoryLabel,
            price: updated.price,
            supplierCost: updated.supplierCost,
            markupMultiplier: updated.markupMultiplier,
            stockQuantity: updated.stockQuantity,
            description: updated.description,
            shortDescription: updated.shortDescription,
            barcode: updated.barcode,
            sku: updated.sku,
            images: updated.images,
            attributes: updated.attributes,
            approvalStatus: updated.approvalStatus,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDbProducts((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
        setInspectingProduct(updated);
        setInventoryNotice(`Prodotto "${updated.name}" salvato con successo!`);
      }
    } catch (e: any) {
      setInventoryNotice(`Errore salvataggio: ${e.message}`);
    } finally {
      setIsModalProcessing(false);
    }
  };

  const handleApproveFromModal = async (productToApprove: Product) => {
    setIsModalProcessing(true);
    try {
      await handleSaveProductDetails(productToApprove);
      await handleApproveProduct(productToApprove);
      setInspectingProduct(null);
    } finally {
      setIsModalProcessing(false);
    }
  };

  const handleRejectFromModal = async (productToReject: Product) => {
    setIsModalProcessing(true);
    try {
      await handleSaveProductDetails(productToReject);
      await handleRejectProduct(productToReject);
      setInspectingProduct(null);
    } finally {
      setIsModalProcessing(false);
    }
  };

  const handleRestockOne = (product: Product) => {
    restock(product.barcode, 1, "Rettifica Admin", "Renato");
    setInventoryNotice(`+1 pz caricato su ${product.name} (SKU ${product.sku}).`);
  };

  const handleDepleteOne = (product: Product) => {
    const available = stockFor(product);
    if (available <= 0) {
      setInventoryNotice(
        `Impossibile scaricare ${product.name}: giacenza già a zero.`,
      );
      return;
    }
    depleteStock(product.barcode, 1, "Rettifica Admin", "Renato");
    setInventoryNotice(`-1 pz scaricato su ${product.name} (SKU ${product.sku}).`);
  };

  const handleResetInventory = () => {
    resetToCatalog();
    setInventoryNotice(
      "Scorte ripristinate ai valori iniziali del catalogo ORO&CO.",
    );
  };

  /* -------------------------- Sezione: Fatture ---------------------------- */

  const [supplierBanner, setSupplierBanner] = useState<string | null>(null);

  const simulateSupplierInvoice = () => {
    const pointLight = findProductByCode("8054112300048"); // Unoaerre · ORC-CO-001
    const bangle = findProductByCode("8054112300116"); // Unoaerre · ORC-BR-002

    if (!pointLight || !bangle) return;

    restock(pointLight.barcode, 2, "Fattura Unoaerre FPR-2026-0184", "Renato");
    restock(bangle.barcode, 1, "Fattura Unoaerre FPR-2026-0184", "Renato");

    setSupplierBanner(
      "Fattura Unoaerre FPR-2026-0184 acquisita: +3 pz caricati a magazzino su 2 articoli (Punto Luce Diamante e Bracciale Rigido). Giacenze aggiornate.",
    );
  };

  /* -------------------------- Sezione: Ordini ----------------------------- */

  const [orders, setOrders] = useState<DemoOrder[]>(INITIAL_ORDERS);
  const [orderFilter, setOrderFilter] = useState<"Tutti" | OrderStatus>("Tutti");

  const orderFilters: ("Tutti" | OrderStatus)[] = [
    "Tutti",
    "Da Spedire",
    "Ritiro in Gioielleria",
    "Consegnato",
  ];

  const filteredOrders = useMemo(
    () =>
      orderFilter === "Tutti"
        ? orders
        : orders.filter((order) => order.status === orderFilter),
    [orders, orderFilter],
  );

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, status } : order,
      ),
    );
  };

  /* -------------------------- Sezione: Audit ------------------------------ */

  const [auditOperator, setAuditOperator] = useState<"Tutti" | CassaOperator>("Tutti");

  const filteredTransactions = useMemo(
    () =>
      auditOperator === "Tutti"
        ? liveTransactions
        : liveTransactions.filter((tx) => tx.operator === auditOperator),
    [liveTransactions, auditOperator],
  );

  const activeMeta = SECTIONS.find((section) => section.id === activeSection) ?? SECTIONS[0];

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-ink">
      <div className="flex min-h-screen">
        {/* ================================================================
            SIDEBAR DI NAVIGAZIONE — BLU ORO&CO #012236 · ACCENTI ORO #C5A059
            ================================================================ */}
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col justify-between bg-[#012236] lg:flex">
          <div>
            <div className="border-b border-white/10 bg-[#011929]/80 px-6 py-6">
              <Logo variant="wordmark" tone="light" className="h-10 w-auto" />
              <p className="mt-3 text-[0.6rem] uppercase tracking-[0.22em] text-[#E2C992]">
                Gestionale Gioielleria
              </p>
            </div>

            <p className="px-6 pt-6 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white/40">
              Sezioni Gestionale
            </p>
            <nav className="mt-3 flex flex-col gap-1 px-3">
              {SECTIONS.map((section) => {
                const isActive = section.id === activeSection;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "group flex items-center gap-3 rounded-sm border px-3 py-2.5 text-left transition-colors",
                      isActive
                        ? "border-[#C5A059]/50 bg-white/10"
                        : "border-transparent hover:border-white/10 hover:bg-white/5",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-sm transition-colors",
                        isActive
                          ? "bg-[#C5A059] text-[#0A0A0A]"
                          : "bg-white/5 text-[#C5A059] group-hover:bg-white/10",
                      )}
                    >
                      <section.icon className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-sm font-semibold",
                          isActive ? "text-white" : "text-white/75 group-hover:text-white",
                        )}
                      >
                        {section.label}
                      </span>
                      <span className="block truncate text-[0.62rem] text-white/40">
                        {section.caption}
                      </span>
                    </span>
                    {section.id === "inventory" && allProducts.length > 0 && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.62rem] font-bold text-white/80" title="Totale articoli in magazzino">
                        {allProducts.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-white/10 bg-[#011929]/80 px-6 py-5">
            <div className="flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.14em] text-white/80">
              <Database className="h-3.5 w-3.5 text-emerald-400" />
              Supabase Dedicato Attivo
            </div>
            <p className="mt-1.5 text-[0.62rem] leading-relaxed text-white/50">
              Connessione istanza Oroeco (cuztyagbckeyljlhhzvr). Keepalive giornaliero attivo.
            </p>
          </div>
        </aside>

        {/* ================================================================
            COLONNA PRINCIPALE: TOPBAR + CONTENUTO
            ================================================================ */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* TOPBAR OPERATIVA */}
          <header className="sticky top-0 z-30 border-b border-[#011929] bg-[#012236] text-white">
            <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3.5 md:px-8">
              <div className="flex items-center gap-3">
                <Logo variant="wordmark" tone="light" className="h-8 w-auto lg:hidden" />
                <div>
                  <p className="text-[0.6rem] uppercase tracking-[0.22em] text-[#C5A059]">
                    Gestionale ORO&amp;CO · Amministrazione
                  </p>
                  <h1 className="font-serif text-xl leading-tight text-white">
                    {activeMeta.label}
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-sm border border-white/15 bg-white/5 px-3 py-1.5 text-[0.68rem] text-white/85">
                  <LiveDot tone="green" />
                  Cassa Axon Aura RT: Online (192.168.1.150:9100)
                </span>
                <span className="inline-flex items-center gap-2 rounded-sm border border-white/15 bg-white/5 px-3 py-1.5 text-[0.68rem] text-white/85">
                  <LiveDot tone="green" />
                  Supabase Cloud: Connesso (Oroeco)
                </span>
                <Link
                  href="/admin/cassa"
                  className="inline-flex items-center gap-2 rounded-sm bg-[#C5A059] px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#0A0A0A] transition-colors hover:bg-[#d4af37]"
                >
                  <ScanBarcode className="h-4 w-4" strokeWidth={2.2} />
                  Apri Cassa Banco &amp; Pistola Barcode
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-sm border border-white/20 px-3.5 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-white/80 transition-colors hover:border-[#C5A059] hover:text-[#C5A059]"
                >
                  <Store className="h-3.5 w-3.5" strokeWidth={2} />
                  Vedi Sito Pubblico
                </Link>
              </div>
            </div>

            {/* Navigazione mobile a scorrimento orizzontale */}
            <nav className="flex gap-2 overflow-x-auto border-t border-white/10 px-4 py-2.5 lg:hidden">
              {SECTIONS.map((section) => {
                const isActive = section.id === activeSection;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-3 py-1.5 text-xs font-semibold transition-colors",
                      isActive
                        ? "border-[#C5A059] bg-[#C5A059] text-[#0A0A0A]"
                        : "border-white/15 text-white/70",
                    )}
                  >
                    <section.icon className="h-3.5 w-3.5" strokeWidth={2} />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            {/* ============================================================
                SEZIONE 1 — PANORAMICA & KPI
                ============================================================ */}
            {activeSection === "overview" && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <KpiCard
                    label="Valore Magazzino a Listino"
                    value={formatPrice(kpi.totalValue)}
                    hint="Somma di prezzo listino × giacenza su tutto il catalogo"
                    icon={Coins}
                    trend="Prezzi IVA inclusa"
                  />
                  <KpiCard
                    label="Pezzi Totali in Stock"
                    value={`${kpi.totalPieces} pz`}
                    hint={`Distribuiti su ${products.length} articoli censiti`}
                    icon={Boxes}
                  />
                  <KpiCard
                    label="Esauriti / Sotto-scorta"
                    value={`${kpi.outOfStock} / ${kpi.lowStock}`}
                    hint="Articoli a giacenza zero oppure con ultimo pezzo"
                    icon={AlertTriangle}
                    trend={kpi.outOfStock > 0 ? "Riassortimento consigliato" : "Scorte regolari"}
                  />
                  <KpiCard
                    label="Movimenti Registrati Oggi"
                    value={`${todayMovements}`}
                    hint={`Registro scatola nera: ${liveTransactions.length} transazioni totali`}
                    icon={History}
                  />
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                  {/* Ultimi movimenti */}
                  <Card>
                    <CardHeader
                      icon={Receipt}
                      title="Ultimi Movimenti Cassa &amp; Magazzino"
                      caption="Scorcio cronologico dal registro transazioni"
                      action={
                        <button
                          type="button"
                          onClick={() => setActiveSection("audit")}
                          className="inline-flex items-center gap-1.5 rounded-sm border border-[#E5E0D5] px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-graphite transition-colors hover:border-[#C5A059] hover:text-ink"
                        >
                          <ScrollText className="h-3.5 w-3.5" />
                          Apri Scatola Nera
                        </button>
                      }
                    />
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-[#E5E0D5] text-[0.62rem] uppercase tracking-[0.14em] text-graphite-soft">
                            <th className="px-5 py-3 font-semibold">Data &amp; Ora</th>
                            <th className="px-5 py-3 font-semibold">Articolo</th>
                            <th className="px-5 py-3 font-semibold">Tipo</th>
                            <th className="px-5 py-3 text-center font-semibold">Q.tà</th>
                            <th className="px-5 py-3 font-semibold">Operatore</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EFEAE0]">
                          {recentTransactions.length === 0 ? (
                            <EmptyRow
                              colSpan={5}
                              message="Nessun movimento registrato. Le vendite dalla cassa e i carichi da magazzino compariranno qui in tempo reale."
                            />
                          ) : (
                            recentTransactions.map((tx) => (
                              <tr key={tx.id} className="transition-colors hover:bg-[#F8F7F4]/70">
                                <td className="whitespace-nowrap px-5 py-3 font-mono text-[0.72rem] text-graphite-soft">
                                  {formatDateTime(tx.timestamp)}
                                </td>
                                <td className="px-5 py-3">
                                  <span className="block font-medium text-ink">
                                    {tx.productName}
                                  </span>
                                  <span className="block font-mono text-[0.62rem] text-graphite-soft">
                                    {tx.barcode}
                                  </span>
                                </td>
                                <td className="px-5 py-3">
                                  <MovementBadge type={tx.movementType} />
                                </td>
                                <td
                                  className={cn(
                                    "px-5 py-3 text-center font-mono font-bold",
                                    tx.changeQuantity >= 0
                                      ? "text-emerald-700"
                                      : "text-red-600",
                                  )}
                                >
                                  {tx.changeQuantity >= 0 ? "+" : ""}
                                  {tx.changeQuantity}
                                </td>
                                <td className="px-5 py-3 text-graphite">{tx.operator}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  {/* Riepilogo connessioni */}
                  <Card>
                    <CardHeader
                      icon={Wifi}
                      title="Stato Connessioni"
                      caption="Integrazioni hardware e fiscali"
                    />
                    <ul className="divide-y divide-[#EFEAE0]">
                      <li className="flex items-start gap-3 px-5 py-4">
                        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-[#F8F7F4] text-[#C5A059]">
                          <Calculator className="h-4 w-4" strokeWidth={2} />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-ink">
                              Cassa Axon Aura RT
                            </p>
                            <LiveDot tone="green" />
                          </div>
                          <p className="text-xs text-graphite">
                            Online · 192.168.1.150:9100 (Ditron LAN ECR)
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3 px-5 py-4">
                        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-[#F8F7F4] text-[#C5A059]">
                          <ShieldCheck className="h-4 w-4" strokeWidth={2} />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-ink">
                              SDI · Agenzia delle Entrate
                            </p>
                            <LiveDot tone="green" />
                          </div>
                          <p className="text-xs text-graphite">
                            Webhook fatture attivo · Codice destinatario cedente 7X9K2L1
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3 px-5 py-4">
                        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-[#F8F7F4] text-[#C5A059]">
                          <Database className="h-4 w-4" strokeWidth={2} />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-ink">
                              Supabase Cloud Dedicato
                            </p>
                            <LiveDot tone="green" />
                          </div>
                          <p className="text-xs text-graphite">
                            Connesso (Istanza Oroeco)
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3 px-5 py-4">
                        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-[#F8F7F4] text-[#C5A059]">
                          <ScanBarcode className="h-4 w-4" strokeWidth={2} />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-ink">
                              Pistola Barcode USB / BT
                            </p>
                            <LiveDot tone="green" />
                          </div>
                          <p className="text-xs text-graphite">
                            Listener globale attivo (&lt;60ms) · EAN-13 ed SKU
                          </p>
                        </div>
                      </li>
                    </ul>
                    <div className="border-t border-[#E5E0D5] px-5 py-4">
                      <Link
                        href="/admin/cassa"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-[#012236] px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#C5A059] transition-colors hover:bg-[#011929]"
                      >
                        <Banknote className="h-4 w-4" />
                        Apri Terminale Cassa Banco
                      </Link>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* ============================================================
                SEZIONE 2 — MAGAZZINO & CATALOGO & APPROVAZIONI
                ============================================================ */}
            {activeSection === "inventory" && (
              <div className="space-y-6">
                <Card className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-sm bg-[#012236] text-[#C5A059]">
                        <Package className="h-5 w-5" strokeWidth={1.9} />
                      </span>
                      <div>
                        <h2 className="font-serif text-xl font-semibold text-ink">
                          Magazzino &amp; Approvazione Catalogo Gioielli
                        </h2>
                        <p className="text-xs text-graphite-soft">
                          {filteredProducts.length} articoli visualizzati · Database Supabase Dedicato Oroeco
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={loadDbProducts}
                        disabled={loadingDb}
                        className="inline-flex items-center gap-1.5 rounded-sm border border-[#E5E0D5] bg-white px-3 py-2 text-[0.65rem] font-bold uppercase tracking-wider text-graphite transition-colors hover:border-[#C5A059] hover:text-ink disabled:opacity-50"
                      >
                        <RefreshCw className={cn("h-3.5 w-3.5", loadingDb && "animate-spin")} />
                        Ricarica DB
                      </button>
                      <button
                        type="button"
                        onClick={handleResetInventory}
                        className="inline-flex items-center gap-2 rounded-sm border border-[#E5E0D5] bg-white px-3 py-2 text-[0.65rem] font-bold uppercase tracking-wider text-graphite transition-colors hover:border-[#C5A059] hover:text-ink"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Ripristina Scorte
                      </button>
                    </div>
                  </div>

                  {/* Tab Canale & Visibilità Web / Cassa */}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-[#E5E0D5] py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[0.68rem] font-bold uppercase tracking-wider text-graphite mr-1">
                        Canale Vendita:
                      </span>
                      <button
                        type="button"
                        onClick={() => setApprovalTab("all")}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-bold transition-colors",
                          approvalTab === "all"
                            ? "bg-[#012236] text-white shadow-xs"
                            : "bg-[#F8F7F4] text-graphite hover:text-ink"
                        )}
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        Tutti i Prodotti Negozio ({allProducts.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setApprovalTab("online")}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-bold transition-colors",
                          approvalTab === "online"
                            ? "bg-emerald-700 text-white shadow-xs"
                            : "bg-[#F8F7F4] text-graphite hover:text-ink"
                        )}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Online su E-Commerce ({onlineCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setApprovalTab("cassa_only")}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-bold transition-colors",
                          approvalTab === "cassa_only"
                            ? "bg-amber-700 text-white shadow-xs"
                            : "bg-[#F8F7F4] text-graphite hover:text-ink"
                        )}
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                        Solo Cassa Banco / Offline ({cassaOnlyCount})
                      </button>
                    </div>

                    {/* Azione di Pubblicazione Massiva */}
                    {cassaOnlyCount > 0 && approvalTab === "cassa_only" && (
                      <button
                        type="button"
                        onClick={handleBulkApproveFiltered}
                        disabled={bulkApproving}
                        className="inline-flex items-center gap-2 rounded-sm bg-emerald-700 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-emerald-800 disabled:opacity-50"
                      >
                        <CheckCheck className="h-4 w-4" />
                        {bulkApproving ? "Pubblicazione in corso…" : `Pubblica Tutti i ${filteredProducts.length} sul Sito`}
                      </button>
                    )}
                  </div>

                  {inventoryNotice ? (
                    <div className="mt-4 flex items-start justify-between gap-3 rounded-sm border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      <span className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.5} />
                        {inventoryNotice}
                      </span>
                      <button
                        type="button"
                        onClick={() => setInventoryNotice(null)}
                        aria-label="Chiudi avviso"
                        className="text-emerald-700/70 hover:text-emerald-900"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}

                  {/* Barra di ricerca + filtri */}
                  <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="flex flex-1 items-center gap-3 rounded-sm border border-[#E5E0D5] bg-[#F8F7F4] px-4 focus-within:border-[#C5A059]">
                      <Search className="h-4 w-4 shrink-0 text-graphite-soft" />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Cerca per nome, SKU, barcode EAN-13 o brand…"
                        className="h-11 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-graphite-soft"
                      />
                      {query ? (
                        <button
                          type="button"
                          onClick={() => setQuery("")}
                          aria-label="Pulisci ricerca"
                          className="text-graphite-soft hover:text-ink"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {CATEGORY_FILTERS.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setCategoryFilter(category.id)}
                          className={cn(
                            "rounded-sm border px-3 py-2 text-[0.65rem] font-bold uppercase tracking-wider transition-colors",
                            categoryFilter === category.id
                              ? "border-[#C5A059] bg-[#C5A059] text-[#0A0A0A]"
                              : "border-[#E5E0D5] bg-white text-graphite hover:border-[#C5A059]",
                          )}
                        >
                          {category.label}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <select
                        value={brandFilter}
                        onChange={(event) => setBrandFilter(event.target.value)}
                        className="h-11 w-full appearance-none rounded-sm border border-[#E5E0D5] bg-white px-4 pr-10 text-sm text-ink outline-none focus:border-[#C5A059] lg:w-64"
                      >
                        <option value="all">Tutti i brand ({allProducts.length})</option>
                        {availableBrands.map((brand) => (
                          <option key={brand.id} value={brand.slug}>
                            {brand.name} ({brand.count})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite-soft" />
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[880px]">
                      <thead>
                        <tr className="border-b border-[#E5E0D5] text-[0.62rem] uppercase tracking-[0.14em] text-graphite-soft bg-[#FAF9F5]">
                          <th className="w-10 px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={allFilteredSelected}
                              onChange={handleToggleSelectAll}
                              aria-label="Seleziona tutti i prodotti filtrati"
                              className="h-4 w-4 rounded border-gray-300 text-gold focus:ring-gold cursor-pointer accent-[#C5A059]"
                              title={allFilteredSelected ? "Deseleziona tutti" : "Seleziona tutti i filtrati"}
                            />
                          </th>
                          <th className="px-3.5 py-3 font-semibold">Articolo</th>
                          <th className="px-3 py-3 font-semibold">Codici &amp; Fornitore</th>
                          <th className="px-3 py-3 font-semibold">Costo &amp; Ricarico</th>
                          <th className="px-3 py-3 text-right font-semibold">Prezzo Pubblico</th>
                          <th className="px-3 py-3 text-center font-semibold">Giacenza</th>
                          <th className="px-3.5 py-3 text-center font-semibold">Canale &amp; Visibilità</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFEAE0]">
                        {filteredProducts.length === 0 ? (
                          <EmptyRow
                            colSpan={7}
                            message="Nessun articolo corrisponde ai filtri selezionati."
                          />
                        ) : (
                          filteredProducts.map((product) => {
                            const quantity = stockFor(product);
                            const isApproved = product.approvalStatus === "approved";
                            const isProcessing = approvingIds.includes(product.id);
                            const isSelected = selectedIds.includes(product.id);

                            return (
                              <tr
                                key={product.id}
                                onClick={() => setInspectingProduct(product)}
                                className={cn(
                                  "cursor-pointer align-middle transition-colors hover:bg-[#F8F7F4]/90",
                                  isSelected
                                    ? "bg-[#C5A059]/15 hover:bg-[#C5A059]/20"
                                    : !isApproved && "bg-amber-50/15"
                                )}
                              >
                                <td className="w-10 px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleSelect(product.id)}
                                    aria-label={`Seleziona ${product.name}`}
                                    className="h-4 w-4 rounded border-gray-300 text-gold focus:ring-gold cursor-pointer accent-[#C5A059]"
                                  />
                                </td>
                                <td className="px-3.5 py-2.5">
                                  <div className="flex items-center gap-2.5">
                                    {product.images && product.images[0] ? (
                                      <SmartImage
                                        src={product.images[0]}
                                        alt={product.name}
                                        sizes="80px"
                                        className="h-11 w-11 shrink-0 rounded-sm border border-[#E5E0D5] object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-dashed border-[#E5E0D5] bg-pearl text-graphite-soft" title="Articolo solo cassa banco">
                                        <Store className="h-5 w-5" />
                                      </div>
                                    )}
                                    <div className="min-w-0 max-w-[240px] xl:max-w-[300px]">
                                      <span className="block text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#C5A059] truncate">
                                        {product.brand} · {product.subcategoryLabel}
                                      </span>
                                      <span className="block truncate font-medium text-ink" title={product.name}>
                                        {product.name}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap">
                                  <span className="block font-mono text-[0.72rem] text-graphite">
                                    SKU: {product.sku}
                                  </span>
                                  <span className="flex items-center gap-1 font-mono text-[0.68rem] text-graphite-soft">
                                    <Barcode className="h-3 w-3" />
                                    {product.barcode}
                                  </span>
                                  {product.supplierName && (
                                    <span className="block truncate text-[0.62rem] text-graphite-soft max-w-[140px]" title={product.supplierName}>
                                      {product.supplierName}
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap">
                                  {product.supplierCost ? (
                                    <div>
                                      <span className="block font-mono text-xs font-semibold text-graphite">
                                        {formatPrice(product.supplierCost)}
                                      </span>
                                      <span className="block text-[0.62rem] text-graphite-soft">
                                        Ricarico: {product.markupMultiplier ? `${product.markupMultiplier}x` : '2.2x'}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-graphite-soft">—</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-right whitespace-nowrap font-serif font-semibold text-ink">
                                  {formatPrice(product.price)}
                                </td>
                                <td className="px-3 py-2.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex flex-col items-center gap-1">
                                    <StockBadge quantity={quantity} />
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleDepleteOne(product)}
                                        disabled={quantity <= 0}
                                        className="h-5 w-5 rounded border border-[#E5E0D5] bg-white text-[0.65rem] font-bold text-graphite hover:text-red-600 disabled:opacity-30"
                                        title="-1 Scarico"
                                      >
                                        -
                                      </button>
                                      <span className="font-mono text-xs font-semibold text-ink min-w-[20px]">
                                        {quantity}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleRestockOne(product)}
                                        className="h-5 w-5 rounded border border-emerald-200 bg-emerald-50 text-[0.65rem] font-bold text-emerald-700 hover:bg-emerald-100"
                                        title="+1 Carico"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3.5 py-2.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-center gap-2">
                                    {/* Toggle 1-Click Visibilità Web / Solo Cassa */}
                                    <button
                                      type="button"
                                      onClick={() => handleToggleVisibility(product)}
                                      disabled={isProcessing}
                                      className={cn(
                                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all shadow-xs cursor-pointer",
                                        isApproved
                                          ? "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                          : "border border-gray-300 bg-gray-50 text-gray-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800"
                                      )}
                                      title={
                                        isApproved
                                          ? "Attualmente ONLINE sul sito. Clicca per togliere dal sito e renderlo SOLO CASSA."
                                          : "Attualmente SOLO CASSA (nascosto dal web). Clicca per PUBBLICARE online sull'e-commerce."
                                      }
                                    >
                                      {isApproved ? (
                                        <>
                                          <Eye className="h-3.5 w-3.5 text-emerald-600" />
                                          <span>Online</span>
                                        </>
                                      ) : (
                                        <>
                                          <EyeOff className="h-3.5 w-3.5 text-gray-400" />
                                          <span>Solo Cassa</span>
                                        </>
                                      )}
                                    </button>

                                    {/* Modifica Scheda Dettagli */}
                                    <button
                                      type="button"
                                      onClick={() => setInspectingProduct(product)}
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-[#E5E0D5] bg-white text-graphite transition-colors hover:border-[#C5A059] hover:text-[#C5A059] cursor-pointer"
                                      title="Modifica dettagli, prezzi e attributi"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* ============================================================
                SEZIONE 3 — FATTURE SDI & FORNITORI
                ============================================================ */}
            {activeSection === "invoices" && (
              <div className="space-y-6">
                {/* Importazione rapida fattura fornitore */}
                <Card className="overflow-hidden">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E5E0D5] bg-[#F8F7F4] px-5 py-5">
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-sm bg-[#012236] text-[#C5A059]">
                        <Upload className="h-5 w-5" strokeWidth={1.9} />
                      </span>
                      <div className="max-w-2xl">
                        <h2 className="font-serif text-xl font-semibold text-ink">
                          Importazione Rapida Fattura Fornitore (XML / PDF)
                        </h2>
                        <p className="mt-1 text-sm leading-relaxed text-graphite">
                          Appena Renato riceve le fatture dai fornitori (Unoaerre, Bulova,
                          Stroili, Locman e gli altri marchi trattati), può caricarle qui
                          per aggiornare automaticamente il catalogo e le giacenze:
                          l&apos;anagrafica articoli, i prezzi di listino e le quantità in
                          stock vengono allineati senza digitazione manuale. Addio al
                          vecchio gestionale Danea.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-stretch gap-2">
                      <button
                        type="button"
                        onClick={simulateSupplierInvoice}
                        className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#C5A059] px-4 py-3 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#0A0A0A] transition-colors hover:bg-[#d4af37]"
                      >
                        <FileSpreadsheet className="h-4 w-4" strokeWidth={2.2} />
                        Simula Carico Fattura Fornitore (Unoaerre +3 pz)
                      </button>
                      <span className="text-center text-[0.62rem] uppercase tracking-[0.14em] text-graphite-soft">
                        Demo interattiva · nessun file reale richiesto
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 text-[0.72rem] text-graphite">
                    <span className="inline-flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#C5A059]" />
                      Riconoscimento automatico codice articolo e barcode EAN-13
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#C5A059]" />
                      Aggiornamento giacenze e prezzi di acquisto
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#C5A059]" />
                      Archiviazione nel cassetto fiscale AdE
                    </span>
                  </div>

                  {supplierBanner ? (
                    <div className="flex items-start justify-between gap-3 border-t border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
                      <span className="flex items-start gap-2">
                        <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                        <span>
                          <strong className="block font-semibold">
                            Carico fattura completato
                          </strong>
                          {supplierBanner}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSupplierBanner(null)}
                        aria-label="Chiudi conferma"
                        className="text-emerald-700/70 hover:text-emerald-900"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </Card>

                {/* Fatture passive fornitori */}
                <Card>
                  <CardHeader
                    icon={Download}
                    title="Fatture Passive Fornitori (Ricevute via SDI Webhook)"
                    caption="Ciclo passivo · allineamento cassetto fiscale"
                    action={
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Cassetto Fiscale AdE Allineato
                      </span>
                    }
                  />
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#E5E0D5] text-[0.62rem] uppercase tracking-[0.14em] text-graphite-soft">
                          <th className="px-5 py-3 font-semibold">N. Documento</th>
                          <th className="px-5 py-3 font-semibold">Fornitore</th>
                          <th className="px-5 py-3 font-semibold">Data</th>
                          <th className="px-5 py-3 text-right font-semibold">Imponibile</th>
                          <th className="px-5 py-3 text-right font-semibold">IVA 22%</th>
                          <th className="px-5 py-3 text-right font-semibold">Totale</th>
                          <th className="px-5 py-3 text-center font-semibold">Stato</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFEAE0]">
                        {PASSIVE_INVOICES.map((invoice) => {
                          const vat = invoice.taxable * VAT_RATE;
                          const total = invoice.taxable + vat;
                          return (
                            <tr
                              key={invoice.docNumber}
                              className="transition-colors hover:bg-[#F8F7F4]/70"
                            >
                              <td className="px-5 py-3 font-mono text-[0.72rem] text-ink">
                                {invoice.docNumber}
                              </td>
                              <td className="px-5 py-3">
                                <span className="flex items-center gap-2 font-medium text-ink">
                                  <Building2 className="h-3.5 w-3.5 text-[#C5A059]" />
                                  {invoice.supplier}
                                </span>
                                <span className="block font-mono text-[0.62rem] text-graphite-soft">
                                  P.IVA {invoice.vatId}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-graphite">{invoice.date}</td>
                              <td className="px-5 py-3 text-right font-mono text-graphite">
                                {formatPrice(invoice.taxable)}
                              </td>
                              <td className="px-5 py-3 text-right font-mono text-graphite">
                                {formatPrice(vat)}
                              </td>
                              <td className="px-5 py-3 text-right font-semibold text-ink">
                                {formatPrice(total)}
                              </td>
                              <td className="px-5 py-3 text-center">
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider",
                                    invoice.status === "Pagata"
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "border-amber-200 bg-amber-50 text-amber-700",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "h-1.5 w-1.5 rounded-full",
                                      invoice.status === "Pagata"
                                        ? "bg-emerald-500"
                                        : "bg-amber-500",
                                    )}
                                  />
                                  {invoice.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Fatture attive emesse */}
                <Card>
                  <CardHeader
                    icon={FileText}
                    title="Fatture Attive Emesse (1-Click dal Banco)"
                    caption="Ciclo attivo · trasmissione SDI"
                    action={
                      <Link
                        href="/admin/cassa"
                        className="inline-flex items-center gap-1.5 rounded-sm bg-[#012236] px-3.5 py-2 text-[0.65rem] font-bold uppercase tracking-wider text-[#C5A059] transition-colors hover:bg-[#011929]"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Emetti Nuova Fattura
                      </Link>
                    }
                  />
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#E5E0D5] text-[0.62rem] uppercase tracking-[0.14em] text-graphite-soft">
                          <th className="px-5 py-3 font-semibold">N. Fattura</th>
                          <th className="px-5 py-3 font-semibold">Cliente</th>
                          <th className="px-5 py-3 font-semibold">Data</th>
                          <th className="px-5 py-3 text-center font-semibold">
                            Cod. Destinatario
                          </th>
                          <th className="px-5 py-3 text-right font-semibold">Totale</th>
                          <th className="px-5 py-3 text-center font-semibold">Stato SDI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFEAE0]">
                        {ACTIVE_INVOICES.map((invoice) => (
                          <tr
                            key={invoice.number}
                            className="transition-colors hover:bg-[#F8F7F4]/70"
                          >
                            <td className="px-5 py-3 font-mono text-[0.72rem] text-ink">
                              {invoice.number}
                            </td>
                            <td className="px-5 py-3 font-medium text-ink">
                              {invoice.customer}
                            </td>
                            <td className="px-5 py-3 text-graphite">{invoice.date}</td>
                            <td className="px-5 py-3 text-center font-mono text-[0.72rem] text-graphite">
                              {invoice.recipient}
                            </td>
                            <td className="px-5 py-3 text-right font-semibold text-ink">
                              {formatPrice(invoice.total)}
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider",
                                  invoice.sdiStatus === "Consegnata"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-sky-200 bg-sky-50 text-sky-700",
                                )}
                              >
                                <BadgeCheck className="h-3.5 w-3.5" />
                                {invoice.sdiStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* ============================================================
                SEZIONE 4 — ORDINI E-COMMERCE & SPEDIZIONI
                ============================================================ */}
            {activeSection === "orders" && (
              <div className="space-y-6">
                <Card className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-sm bg-[#012236] text-[#C5A059]">
                        <Truck className="h-5 w-5" strokeWidth={1.9} />
                      </span>
                      <div>
                        <h2 className="font-serif text-xl font-semibold text-ink">
                          Ordini E-Commerce &amp; Spedizioni Assicurate
                        </h2>
                        <p className="text-xs text-graphite-soft">
                          {filteredOrders.length} ordini visualizzati · aggiornamento stato locale
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {orderFilters.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setOrderFilter(status)}
                          className={cn(
                            "rounded-sm border px-3 py-2 text-[0.65rem] font-bold uppercase tracking-wider transition-colors",
                            orderFilter === status
                              ? "border-[#C5A059] bg-[#C5A059] text-[#0A0A0A]"
                              : "border-[#E5E0D5] bg-white text-graphite hover:border-[#C5A059]",
                          )}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#E5E0D5] text-[0.62rem] uppercase tracking-[0.14em] text-graphite-soft">
                          <th className="px-5 py-3 font-semibold">Ordine</th>
                          <th className="px-5 py-3 font-semibold">Cliente</th>
                          <th className="px-5 py-3 font-semibold">Spedizione / Ritiro</th>
                          <th className="px-5 py-3 text-right font-semibold">Importo</th>
                          <th className="px-5 py-3 text-center font-semibold">Stato</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFEAE0]">
                        {filteredOrders.length === 0 ? (
                          <EmptyRow
                            colSpan={5}
                            message="Nessun ordine con lo stato selezionato."
                          />
                        ) : (
                          filteredOrders.map((order) => (
                            <tr
                              key={order.id}
                              className="align-middle transition-colors hover:bg-[#F8F7F4]/70"
                            >
                              <td className="px-5 py-3">
                                <span className="block font-mono text-[0.72rem] font-semibold text-ink">
                                  {order.id}
                                </span>
                                <span className="block text-[0.65rem] text-graphite-soft">
                                  {order.date}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <span className="flex items-center gap-2 font-medium text-ink">
                                  <Store className="h-3.5 w-3.5 text-[#C5A059]" />
                                  {order.customer}
                                </span>
                                <span className="block text-[0.65rem] text-graphite-soft">
                                  {order.city} · {order.items}{" "}
                                  {order.items === 1 ? "articolo" : "articoli"}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <span className="block text-xs text-graphite">
                                  {order.fulfillment}
                                </span>
                                <span className="block font-mono text-[0.62rem] text-graphite-soft">
                                  Tracking: {order.tracking}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-right font-semibold text-ink">
                                {formatPrice(order.amount)}
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex flex-col items-center gap-2">
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider",
                                      order.status === "Consegnato" &&
                                        "border-emerald-200 bg-emerald-50 text-emerald-700",
                                      order.status === "Da Spedire" &&
                                        "border-amber-200 bg-amber-50 text-amber-700",
                                      order.status === "Ritiro in Gioielleria" &&
                                        "border-sky-200 bg-sky-50 text-sky-700",
                                    )}
                                  >
                                    {order.status}
                                  </span>
                                  <div className="relative">
                                    <select
                                      value={order.status}
                                      onChange={(event) =>
                                        updateOrderStatus(
                                          order.id,
                                          event.target.value as OrderStatus,
                                        )
                                      }
                                      aria-label={`Aggiorna stato ordine ${order.id}`}
                                      className="h-8 appearance-none rounded-sm border border-[#E5E0D5] bg-white px-2.5 pr-7 text-[0.68rem] text-ink outline-none focus:border-[#C5A059]"
                                    >
                                      <option value="Da Spedire">Da Spedire</option>
                                      <option value="Ritiro in Gioielleria">
                                        Ritiro in Gioielleria
                                      </option>
                                      <option value="Consegnato">Consegnato</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-graphite-soft" />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* ============================================================
                SEZIONE 6 — CRM CLIENTI & ORBITA
                ============================================================ */}
            {activeSection === "crm" && <AdminCrmSection />}

            {/* ============================================================
                SEZIONE — LIBRERIA MEDIA CLOUDFLARE R2
                ============================================================ */}
            {activeSection === "media" && <MediaLibrary mode="manage" />}

            {/* ============================================================
                SEZIONE 7 — CONNESSIONE FATTURAZIONE & CASSA
                ============================================================ */}
            {activeSection === "billing_connection" && (
              <AdminBillingConnectionSection />
            )}

            {/* ============================================================
                SEZIONE 5 — SCATOLA NERA & LOG OPERATORI
                ============================================================ */}
            {activeSection === "audit" && (
              <div className="space-y-6">
                <Card className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-sm bg-[#012236] text-[#C5A059]">
                        <ScrollText className="h-5 w-5" strokeWidth={1.9} />
                      </span>
                      <div>
                        <h2 className="font-serif text-xl font-semibold text-ink">
                          Scatola Nera &amp; Log Operatori
                        </h2>
                        <p className="text-xs text-graphite-soft">
                          {filteredTransactions.length} movimenti registrati nel registro
                          transazioni
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {OPERATOR_FILTERS.map((operator) => (
                        <button
                          key={operator}
                          type="button"
                          onClick={() => setAuditOperator(operator)}
                          className={cn(
                            "rounded-sm border px-3 py-2 text-[0.65rem] font-bold uppercase tracking-wider transition-colors",
                            auditOperator === operator
                              ? "border-[#C5A059] bg-[#C5A059] text-[#0A0A0A]"
                              : "border-[#E5E0D5] bg-white text-graphite hover:border-[#C5A059]",
                          )}
                        >
                          {operator}
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card>
                  <CardHeader
                    icon={History}
                    title="Registro Completo Movimentazioni"
                    caption="Tracciabilità integrale magazzino e cassa"
                    action={
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E0D5] bg-[#F8F7F4] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-graphite">
                        <Clock className="h-3.5 w-3.5 text-[#C5A059]" />
                        Ultimi 500 eventi
                      </span>
                    }
                  />
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[960px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#E5E0D5] text-[0.62rem] uppercase tracking-[0.14em] text-graphite-soft">
                          <th className="px-5 py-3 font-semibold">Timestamp</th>
                          <th className="px-5 py-3 font-semibold">Tipo Movimento</th>
                          <th className="px-5 py-3 font-semibold">Articolo / Barcode</th>
                          <th className="px-5 py-3 text-center font-semibold">Delta</th>
                          <th className="px-5 py-3 text-center font-semibold">Giacenza</th>
                          <th className="px-5 py-3 font-semibold">Riferimento</th>
                          <th className="px-5 py-3 font-semibold">Operatore</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFEAE0]">
                        {filteredTransactions.length === 0 ? (
                          <EmptyRow
                            colSpan={7}
                            message="Registro vuoto per il filtro corrente. Ogni vendita dalla cassa, carico o rettifica verrà tracciato automaticamente qui."
                          />
                        ) : (
                          filteredTransactions.map((tx) => (
                            <tr
                              key={tx.id}
                              className="transition-colors hover:bg-[#F8F7F4]/70"
                            >
                              <td className="whitespace-nowrap px-5 py-3 font-mono text-[0.72rem] text-graphite-soft">
                                {formatDateTime(tx.timestamp)}
                              </td>
                              <td className="px-5 py-3">
                                <MovementBadge type={tx.movementType} />
                                <span className="mt-1 block text-[0.62rem] text-graphite-soft">
                                  {MOVEMENT_META[tx.movementType].description}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <span className="block font-medium text-ink">
                                  {tx.productName}
                                </span>
                                <span className="block font-mono text-[0.62rem] text-graphite-soft">
                                  {tx.sku} · {tx.barcode}
                                </span>
                              </td>
                              <td
                                className={cn(
                                  "px-5 py-3 text-center font-mono font-bold",
                                  tx.changeQuantity >= 0
                                    ? "text-emerald-700"
                                    : "text-red-600",
                                )}
                              >
                                {tx.changeQuantity >= 0 ? "+" : ""}
                                {tx.changeQuantity}
                              </td>
                              <td className="px-5 py-3 text-center font-mono text-[0.72rem] text-graphite">
                                {tx.previousQuantity} → {tx.newQuantity}
                              </td>
                              <td className="px-5 py-3">
                                <span className="block font-mono text-[0.68rem] text-graphite">
                                  {tx.referenceId}
                                </span>
                                {tx.notes ? (
                                  <span className="block text-[0.62rem] text-graphite-soft">
                                    {tx.notes}
                                  </span>
                                ) : null}
                              </td>
                              <td className="px-5 py-3">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E0D5] bg-[#F8F7F4] px-2.5 py-1 text-[0.62rem] font-semibold text-graphite">
                                  <Coins className="h-3 w-3 text-[#C5A059]" />
                                  {tx.operator}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Barra Flottante Modifica Massiva (es. 30 prodotti in Solo Cassa) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
          <div className="pointer-events-auto flex flex-wrap items-center gap-3 rounded-full border border-[#011929] bg-[#012236] px-5 py-3 text-white shadow-[0_12px_45px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-2 pr-3 border-r border-white/20">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#C5A059] text-xs font-bold text-[#0A0A0A]">
                {selectedIds.length}
              </span>
              <span className="text-xs font-medium text-white/90">
                {selectedIds.length === 1 ? "selezionato" : "selezionati"}
              </span>
            </div>

            {/* Metti in Solo Cassa */}
            <button
              type="button"
              onClick={() => handleBatchSetStatus("rejected")}
              disabled={batchProcessing}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-amber-600 hover:border-amber-500 disabled:opacity-50 cursor-pointer shadow-xs"
              title="Toglie tutti i prodotti selezionati dall'e-commerce e li riserva alla cassa fisica"
            >
              <EyeOff className="h-3.5 w-3.5 text-amber-400" />
              <span>Metti in Solo Cassa</span>
            </button>

            {/* Pubblica Online */}
            <button
              type="button"
              onClick={() => handleBatchSetStatus("approved")}
              disabled={batchProcessing}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition-all hover:bg-emerald-500 disabled:opacity-50 cursor-pointer shadow-xs"
              title="Pubblica tutti i prodotti selezionati sull'e-commerce"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Pubblica Online</span>
            </button>

            {/* Annulla Selezione */}
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              disabled={batchProcessing}
              className="ml-1 inline-flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
              title="Deseleziona tutti"
            >
              <X className="h-3.5 w-3.5" />
              <span>Deseleziona</span>
            </button>
          </div>
        </div>
      )}

      {/* Modale Ispezione & Approvazione Prodotto Renato */}
      <ProductInspectorModal
        product={inspectingProduct}
        isOpen={!!inspectingProduct}
        onClose={() => setInspectingProduct(null)}
        onSave={handleSaveProductDetails}
        onApprove={handleApproveFromModal}
        onReject={handleRejectFromModal}
        isProcessing={isModalProcessing}
      />
    </div>
  );
}
