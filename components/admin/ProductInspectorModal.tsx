"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Barcode,
  Building2,
  Calculator,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Image as ImageIcon,
  Package,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Store,
  ThumbsDown,
  Trash2,
  X,
} from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn, formatPrice } from "@/lib/utils";
import type { Product, ProductCategory } from "@/types/product";

interface ProductInspectorModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProduct: Product) => Promise<void>;
  onApprove: (product: Product) => Promise<void>;
  onReject: (product: Product) => Promise<void>;
  isProcessing?: boolean;
}

const CATEGORY_OPTIONS: { id: ProductCategory; label: string }[] = [
  { id: "gioielli", label: "Gioielli" },
  { id: "orologi", label: "Orologi" },
  { id: "accessori", label: "Accessori" },
  { id: "casa", label: "Casa" },
  { id: "natale", label: "Natale" },
];

export function ProductInspectorModal({
  product,
  isOpen,
  onClose,
  onSave,
  onApprove,
  onReject,
  isProcessing = false,
}: ProductInspectorModalProps) {
  // Local form state cloned from product
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProductCategory>("gioielli");
  const [subcategoryLabel, setSubcategoryLabel] = useState("");
  const [supplierCost, setSupplierCost] = useState<number>(0);
  const [markupMultiplier, setMarkupMultiplier] = useState<number>(2.2);
  const [price, setPrice] = useState<number>(0);
  const [stockQuantity, setStockQuantity] = useState<number>(1);
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");

  // Technical attributes
  const [metal, setMetal] = useState("");
  const [carats, setCarats] = useState("");
  const [stones, setStones] = useState("");
  const [weightGr, setWeightGr] = useState("");
  const [size, setSize] = useState("");
  const [material, setMaterial] = useState("");

  const [copiedBarcode, setCopiedBarcode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state when product changes
  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setCategory(product.category || "gioielli");
      setSubcategoryLabel(product.subcategoryLabel || "");
      setSupplierCost(product.supplierCost || 0);
      setMarkupMultiplier(product.markupMultiplier || 2.2);
      setPrice(product.price || 0);
      setStockQuantity(product.stockQuantity ?? 1);
      setShortDescription(product.shortDescription || "");
      setDescription(product.description || "");
      const imgs = Array.isArray(product.images) && product.images.length > 0 ? product.images : [];
      setGalleryImages(imgs);
      setActiveImageIndex(0);
      setImageUrl(imgs[0] || "");
      setSku(product.sku || "");
      setBarcode(product.barcode || "");

      const attrs = product.attributes || {};
      setMetal(attrs.metal || "");
      setCarats(attrs.carats || attrs.caratWeight || "");
      setStones(Array.isArray(attrs.stones) ? attrs.stones.join(", ") : "");
      setWeightGr(attrs.weightGr ? String(attrs.weightGr) : "");
      setSize(attrs.size || "");
      setMaterial(attrs.material || "");
      setSaveSuccess(false);
    }
  }, [product]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  // Calculations
  const taxableBase = price > 0 ? +(price / 1.22).toFixed(2) : 0;
  const vatAmount = price > 0 ? +(price - taxableBase).toFixed(2) : 0;
  const grossMargin = price > 0 && supplierCost > 0 ? +(price - supplierCost).toFixed(2) : 0;

  // Recalculate price when markup changes
  const applyMarkup = (multiplier: number) => {
    setMarkupMultiplier(multiplier);
    if (supplierCost > 0) {
      const calculated = Math.round(supplierCost * multiplier);
      setPrice(calculated);
    }
  };

  // Recalculate markup when price changes manually
  const handlePriceChange = (newPrice: number) => {
    setPrice(newPrice);
    if (supplierCost > 0 && newPrice > 0) {
      setMarkupMultiplier(+(newPrice / supplierCost).toFixed(2));
    }
  };

  // Recalculate price when cost changes
  const handleCostChange = (newCost: number) => {
    setSupplierCost(newCost);
    if (newCost > 0 && markupMultiplier > 0) {
      setPrice(Math.round(newCost * markupMultiplier));
    }
  };

  const buildUpdatedProduct = (statusOverride?: "approved" | "rejected" | "pending_approval"): Product => {
    const updatedAttributes = {
      ...product.attributes,
      ...(metal ? { metal } : {}),
      ...(carats ? { carats, caratWeight: carats } : {}),
      ...(stones ? { stones: stones.split(",").map((s) => s.trim()) } : {}),
      ...(weightGr ? { weightGr: parseFloat(weightGr) } : {}),
      ...(size ? { size } : {}),
      ...(material ? { material } : {}),
    };

    return {
      ...product,
      name,
      category,
      subcategoryLabel,
      price,
      supplierCost,
      markupMultiplier,
      stockQuantity,
      shortDescription,
      description,
      sku,
      barcode,
      images: galleryImages.length > 0 ? galleryImages : product.images,
      attributes: updatedAttributes,
      approvalStatus: statusOverride || product.approvalStatus || "pending_approval",
    };
  };

  const handleSaveInternal = async () => {
    const updated = buildUpdatedProduct();
    await onSave(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleApproveInternal = async () => {
    const updated = buildUpdatedProduct("approved");
    await onApprove(updated);
  };

  const handleRejectInternal = async () => {
    const updated = buildUpdatedProduct("rejected");
    await onReject(updated);
  };

  const copyBarcodeToClipboard = () => {
    if (barcode) {
      navigator.clipboard.writeText(barcode);
      setCopiedBarcode(true);
      setTimeout(() => setCopiedBarcode(false), 2000);
    }
  };

  const isPending = product.approvalStatus === "pending_approval";
  const isApproved = product.approvalStatus === "approved";
  const isRejected = product.approvalStatus === "rejected";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 lg:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-[#E5E0D5] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#E5E0D5] bg-[#F8F7F4] px-6 py-4">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                isApproved
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {isApproved ? (
                <>
                  <Eye className="h-3.5 w-3.5 text-emerald-600" />
                  Online su E-Commerce
                </>
              ) : (
                <>
                  <EyeOff className="h-3.5 w-3.5 text-gray-500" />
                  Solo Cassa Banco (Offline)
                </>
              )}
            </span>

            <span className="text-xs uppercase tracking-[0.14em] text-graphite-soft">
              {product.brand} · {subcategoryLabel || product.subcategory}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/prodotto/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-sm border border-[#E5E0D5] bg-white px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-[#C5A059] hover:text-[#C5A059]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Vedi Scheda sul Sito</span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="rounded-sm p-1.5 text-graphite-soft transition-colors hover:bg-white hover:text-ink"
              title="Chiudi (ESC)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Colonna Sinistra: Media, Fornitore & Barcode (5 colonne) */}
            <div className="space-y-5 lg:col-span-5">
              {/* Box Galleria & Immagini Ufficiali */}
              <div className="overflow-hidden rounded-md border border-[#E5E0D5] bg-[#F8F7F4]">
                {/* Immagine Principale Attiva */}
                <div className="group relative aspect-square w-full bg-white">
                  <SmartImage
                    src={galleryImages[activeImageIndex] || imageUrl || product.images[0]}
                    alt={name}
                    className="h-full w-full object-cover"
                  />

                  {/* Badge Contatore Foto */}
                  <div className="absolute left-2.5 top-2.5 z-10 flex items-center gap-1.5 rounded-full bg-black/75 px-2.5 py-1 text-[0.65rem] font-medium text-white shadow backdrop-blur-sm">
                    <ImageIcon className="h-3 w-3 text-[#C5A059]" />
                    <span>
                      Foto {activeImageIndex + 1} di {Math.max(galleryImages.length, 1)}
                    </span>
                  </div>

                  {/* Frecce Navigazione Galleria (visibili se > 1 foto) */}
                  {galleryImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextIdx = activeImageIndex > 0 ? activeImageIndex - 1 : galleryImages.length - 1;
                          setActiveImageIndex(nextIdx);
                          setImageUrl(galleryImages[nextIdx]);
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-ink shadow-md transition-all hover:bg-white hover:scale-110 active:scale-95 cursor-pointer"
                        title="Foto Precedente"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextIdx = activeImageIndex < galleryImages.length - 1 ? activeImageIndex + 1 : 0;
                          setActiveImageIndex(nextIdx);
                          setImageUrl(galleryImages[nextIdx]);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-ink shadow-md transition-all hover:bg-white hover:scale-110 active:scale-95 cursor-pointer"
                        title="Foto Successiva"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Carosello Miniature Galleria */}
                {galleryImages.length > 1 && (
                  <div className="border-t border-[#E5E0D5] bg-[#FAF8F5] p-2.5">
                    <div className="mb-1.5 flex items-center justify-between text-[0.65rem] font-bold uppercase tracking-wider text-graphite-soft">
                      <span>Miniature Galleria ({galleryImages.length} scatti)</span>
                      <span className="text-[#C5A059]">Clicca per ingrandire</span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {galleryImages.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setActiveImageIndex(idx);
                            setImageUrl(img);
                          }}
                          className={cn(
                            "group/thumb relative h-14 w-14 shrink-0 overflow-hidden rounded border transition-all cursor-pointer",
                            activeImageIndex === idx
                              ? "border-[#C5A059] ring-2 ring-[#C5A059]/60 shadow-sm scale-105"
                              : "border-[#E5E0D5] opacity-65 hover:opacity-100 hover:border-[#C5A059]"
                          )}
                          title={`Vedi foto ${idx + 1}`}
                        >
                          <SmartImage
                            src={img}
                            alt={`${name} - foto ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute bottom-0 right-0 rounded-tl bg-black/70 px-1 font-mono text-[0.55rem] font-bold text-white">
                            {idx + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Editor URL Foto Attiva */}
                <div className="border-t border-[#E5E0D5] bg-white p-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-[0.68rem] font-bold uppercase tracking-wider text-graphite-soft">
                      URL Foto Attiva ({activeImageIndex + 1} di {Math.max(galleryImages.length, 1)})
                    </label>
                    <span className="text-[0.65rem] font-medium text-[#C5A059]">
                      {galleryImages.length > 1 ? `${galleryImages.length} foto ufficiali` : "Singola foto"}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => {
                      const newUrl = e.target.value;
                      setImageUrl(newUrl);
                      setGalleryImages((prev) => {
                        const copy = [...prev];
                        copy[activeImageIndex] = newUrl;
                        return copy;
                      });
                    }}
                    placeholder="/images/products/... o https://..."
                    className="mt-1 w-full rounded-sm border border-[#E5E0D5] bg-white px-2.5 py-1.5 font-mono text-xs text-ink outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              {/* Provenienza Fattura & Fornitore */}
              <div className="rounded-md border border-[#E5E0D5] bg-[#F8F7F4] p-4 text-xs">
                <div className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-wider text-[#C5A059]">
                  <Building2 className="h-4 w-4" />
                  <span>Origine Fattura Fornitore</span>
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-graphite-soft">Fornitore:</span>
                    <span className="font-semibold text-ink">{product.supplierName || product.brand}</span>
                  </div>
                  {product.invoiceRef && (
                    <div className="flex justify-between">
                      <span className="text-graphite-soft">Documento:</span>
                      <span className="flex items-center gap-1 font-mono text-[0.7rem] text-graphite">
                        <FileSpreadsheet className="h-3.5 w-3.5 text-[#C5A059]" />
                        {product.invoiceRef}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-graphite-soft">Data Rilevazione:</span>
                    <span className="text-graphite font-mono">
                      {product.createdAt ? new Date(product.createdAt).toLocaleDateString("it-IT") : "Recente"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hardware Barcode & Cassa */}
              <div className="rounded-md border border-[#E5E0D5] bg-white p-4 text-xs shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-wider text-ink">
                    <Barcode className="h-4 w-4 text-[#C5A059]" />
                    <span>Barcode &amp; Cassa Aura RT</span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[0.62rem] font-bold text-emerald-700">
                    <ShieldCheck className="h-3 w-3" /> EAN-13 Pronto
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  <div>
                    <label className="text-[0.65rem] text-graphite-soft uppercase">Codice a Barre (EAN-13)</label>
                    <div className="mt-0.5 flex gap-2">
                      <input
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        className="w-full rounded-sm border border-[#E5E0D5] bg-[#F8F7F4] px-2.5 py-1.5 font-mono text-xs font-bold text-ink outline-none focus:border-[#C5A059]"
                      />
                      <button
                        type="button"
                        onClick={copyBarcodeToClipboard}
                        className="shrink-0 rounded-sm border border-[#E5E0D5] px-2 py-1 text-graphite hover:bg-[#F8F7F4]"
                        title="Copia Barcode"
                      >
                        {copiedBarcode ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[0.65rem] text-graphite-soft uppercase">Codice Articolo Interno (SKU)</label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="mt-0.5 w-full rounded-sm border border-[#E5E0D5] bg-[#F8F7F4] px-2.5 py-1.5 font-mono text-xs text-ink outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Colonna Destra: Dati Commerciali, Ricarico, Prezzo e Specifiche (7 colonne) */}
            <div className="space-y-5 lg:col-span-7">
              {/* Titolo & Classificazione */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[0.68rem] font-bold uppercase tracking-wider text-graphite-soft">
                    Nome / Titolo del Prodotto
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-sm border border-[#E5E0D5] bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[0.68rem] font-bold uppercase tracking-wider text-graphite-soft">
                      Macro Categoria
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ProductCategory)}
                      className="mt-1 w-full rounded-sm border border-[#E5E0D5] bg-white px-3 py-1.5 text-xs text-ink outline-none focus:border-[#C5A059]"
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[0.68rem] font-bold uppercase tracking-wider text-graphite-soft">
                      Sottocategoria / Tipologia
                    </label>
                    <input
                      type="text"
                      value={subcategoryLabel}
                      onChange={(e) => setSubcategoryLabel(e.target.value)}
                      placeholder="es. Anelli Solitari, Cronografi..."
                      className="mt-1 w-full rounded-sm border border-[#E5E0D5] bg-white px-3 py-1.5 text-xs text-ink outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>
              </div>

              {/* Box Finanziario: Costo, Ricarico & Prezzo Pubblico (Il Cuore per Renato) */}
              <div className="rounded-md border-2 border-[#C5A059]/40 bg-gradient-to-br from-[#FDFBF7] to-[#F8F7F4] p-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-[#C5A059]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-ink">
                      Calcolo Margini &amp; Prezzo di Vendita
                    </span>
                  </div>
                  <span className="text-[0.65rem] text-graphite-soft">IVA 22% inclusa</span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3">
                  {/* Costo Fornitore */}
                  <div>
                    <label className="block text-[0.68rem] font-bold uppercase tracking-wider text-graphite-soft">
                      Costo Ingrosso (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={supplierCost}
                      onChange={(e) => handleCostChange(parseFloat(e.target.value) || 0)}
                      className="mt-1 w-full rounded-sm border border-[#E5E0D5] bg-white px-3 py-2 font-mono text-sm font-bold text-ink outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  {/* Moltiplicatore Ricarico */}
                  <div>
                    <label className="block text-[0.68rem] font-bold uppercase tracking-wider text-graphite-soft">
                      Ricarico (x)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={markupMultiplier}
                      onChange={(e) => applyMarkup(parseFloat(e.target.value) || 1)}
                      className="mt-1 w-full rounded-sm border border-[#E5E0D5] bg-white px-3 py-2 font-mono text-sm font-bold text-[#C5A059] outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  {/* Prezzo Pubblico */}
                  <div>
                    <label className="block text-[0.68rem] font-bold uppercase tracking-wider text-emerald-800">
                      Prezzo Pubblico (€)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={price}
                      onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                      className="mt-1 w-full rounded-sm border-2 border-emerald-600 bg-white px-3 py-2 font-mono text-sm font-extrabold text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                {/* Preset Rapidi Ricarico */}
                <div className="mt-2.5 flex items-center gap-1.5 text-[0.65rem]">
                  <span className="text-graphite-soft">Preset rapidi:</span>
                  {[2.0, 2.2, 2.5, 3.0].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => applyMarkup(preset)}
                      className={`rounded px-1.5 py-0.5 font-mono font-bold transition-colors ${
                        markupMultiplier === preset
                          ? "bg-[#C5A059] text-white"
                          : "border border-[#E5E0D5] bg-white text-graphite hover:border-[#C5A059]"
                      }`}
                    >
                      {preset}x
                    </button>
                  ))}
                </div>

                {/* Scorporo IVA e Margine */}
                <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-[#E5E0D5] pt-3 text-[0.7rem]">
                  <div className="rounded bg-white p-2 border border-[#E5E0D5]/70">
                    <span className="block text-graphite-soft text-[0.62rem]">Imponibile Netto</span>
                    <span className="font-mono font-bold text-graphite">{formatPrice(taxableBase)}</span>
                  </div>
                  <div className="rounded bg-white p-2 border border-[#E5E0D5]/70">
                    <span className="block text-graphite-soft text-[0.62rem]">IVA 22%</span>
                    <span className="font-mono font-bold text-graphite">{formatPrice(vatAmount)}</span>
                  </div>
                  <div className="rounded bg-emerald-50 p-2 border border-emerald-200">
                    <span className="block text-emerald-700 text-[0.62rem] font-bold">Margine Lordo</span>
                    <span className="font-mono font-extrabold text-emerald-800">+{formatPrice(grossMargin)}</span>
                  </div>
                </div>
              </div>

              {/* Specifiche Tecniche Gioielleria / Orologeria */}
              <div className="rounded-md border border-[#E5E0D5] bg-white p-4">
                <div className="flex items-center gap-2 border-b border-[#E5E0D5] pb-2 text-xs font-bold uppercase tracking-wider text-ink">
                  <Sparkles className="h-4 w-4 text-[#C5A059]" />
                  <span>Specifiche Tecniche &amp; Attributi</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[0.65rem] font-bold uppercase text-graphite-soft">Metallo / Titolo</label>
                    <input
                      type="text"
                      value={metal}
                      onChange={(e) => setMetal(e.target.value)}
                      placeholder="es. Oro Bianco 18 kt (750‰)"
                      className="mt-0.5 w-full rounded-sm border border-[#E5E0D5] bg-[#F8F7F4] px-2.5 py-1.5 text-xs text-ink outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="text-[0.65rem] font-bold uppercase text-graphite-soft">Caratura / Pietre</label>
                    <input
                      type="text"
                      value={carats}
                      onChange={(e) => setCarats(e.target.value)}
                      placeholder="es. Diamanti 0.45 ct G-VS"
                      className="mt-0.5 w-full rounded-sm border border-[#E5E0D5] bg-[#F8F7F4] px-2.5 py-1.5 text-xs text-ink outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="text-[0.65rem] font-bold uppercase text-graphite-soft">Peso Grammi</label>
                    <input
                      type="text"
                      value={weightGr}
                      onChange={(e) => setWeightGr(e.target.value)}
                      placeholder="es. 4.20 gr"
                      className="mt-0.5 w-full rounded-sm border border-[#E5E0D5] bg-[#F8F7F4] px-2.5 py-1.5 text-xs text-ink outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  <div>
                    <label className="text-[0.65rem] font-bold uppercase text-graphite-soft">Misura / Diametro</label>
                    <input
                      type="text"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      placeholder="es. Misura 14 o 42 mm"
                      className="mt-0.5 w-full rounded-sm border border-[#E5E0D5] bg-[#F8F7F4] px-2.5 py-1.5 text-xs text-ink outline-none focus:border-[#C5A059]"
                    />
                  </div>
                </div>
              </div>

              {/* Giacenza di Magazzino */}
              <div className="flex items-center justify-between rounded-md border border-[#E5E0D5] bg-[#F8F7F4] p-3 text-xs">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-graphite" />
                  <span className="font-bold text-ink">Giacenza Iniziale Gioielleria:</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(parseInt(e.target.value, 10) || 0)}
                    className="w-20 rounded-sm border border-[#E5E0D5] bg-white px-2.5 py-1 text-center font-mono font-bold text-ink outline-none focus:border-[#C5A059]"
                  />
                  <span className="text-graphite-soft font-mono">pezzi</span>
                </div>
              </div>

              {/* Descrizione */}
              <div className="space-y-2">
                <label className="block text-[0.68rem] font-bold uppercase tracking-wider text-graphite-soft">
                  Descrizione per la Scheda E-Commerce
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-sm border border-[#E5E0D5] bg-white p-3 text-xs text-ink outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer con Azioni */}
        <div className="flex shrink-0 items-center justify-between border-t border-[#E5E0D5] bg-[#F8F7F4] px-6 py-4">
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                <Check className="h-4 w-4" /> Modifiche salvate con successo!
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveInternal}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 rounded-sm border border-[#E5E0D5] bg-white px-4 py-2 text-xs font-semibold text-graphite transition-colors hover:border-[#C5A059] hover:text-[#C5A059] disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Salva Modifiche
            </button>

            {isApproved ? (
              <button
                type="button"
                onClick={handleRejectInternal}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 rounded-sm border border-gray-300 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
              >
                <EyeOff className="h-4 w-4 text-gray-500" />
                Togli dal Sito (Rendi Solo Cassa)
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApproveInternal}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 rounded-sm bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-emerald-800 disabled:opacity-50"
              >
                <Eye className="h-4 w-4" />
                Pubblica sull&apos;E-Commerce
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}