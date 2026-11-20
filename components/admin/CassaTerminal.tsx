"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Barcode,
  Calculator,
  Check,
  ChevronDown,
  Clock,
  Coins,
  CreditCard,
  FileText,
  LogOut,
  Minus,
  Percent,
  Plus,
  Printer,
  Receipt,
  RotateCcw,
  ScanBarcode,
  Search,
  Sparkles,
  Store,
  Trash2,
  User,
  X,
} from "lucide-react";
import { AuraReceiptModal } from "@/components/admin/AuraReceiptModal";
import { SdiInvoiceModal } from "@/components/admin/SdiInvoiceModal";
import { findProductByCode, getAllProducts, searchProducts } from "@/lib/catalog";
import { playPosBeep, useBarcodeScanner } from "@/lib/useBarcodeScanner";
import { cn, formatPrice } from "@/lib/utils";
import { useInventoryStore } from "@/store/useInventoryStore";
import {
  type CassaOperator,
  type CassaTicket,
  type CassaTicketLine,
  type DiscountMode,
  OPERATOR_PROFILES,
  type PaymentMethod,
  QUICK_DISCOUNTS,
  type SdiCustomerData,
  type SdiInvoicePayload,
  type TaxBreakdown,
} from "@/types/cassa";
import type { Product } from "@/types/product";

type ScanState = "idle" | "ok" | "error";

interface Toast {
  id: number;
  tone: "success" | "error" | "info";
  title: string;
  message: string;
}

export function CassaTerminal() {
  const barcodeRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [clock, setClock] = useState("");

  // Operatore attivo al banco (Renato, Carmela, Maria)
  const [operator, setOperator] = useState<CassaOperator>("Renato");
  const [operatorMenuOpen, setOperatorMenuOpen] = useState(false);

  // Linee di vendita scontrino
  const [ticketLines, setTicketLines] = useState<CassaTicketLine[]>([]);

  // Barcode & stato scanner
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanMessage, setScanMessage] = useState(
    "In attesa di scansione… punta la pistola laser sul codice a barre.",
  );

  // Ricerca manuale
  const [searchQuery, setSearchQuery] = useState("");

  // Sconti negoziati
  const [discountMode, setDiscountMode] = useState<DiscountMode>("percent");
  const [discountValueStr, setDiscountValueStr] = useState("");

  // Pagamento veloce banco & calcolo resto
  const [quickPaymentMethod, setQuickPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashTenderedStr, setCashTenderedStr] = useState("");

  // Modali fiscali
  const [auraModalOpen, setAuraModalOpen] = useState(false);
  const [sdiModalOpen, setSdiModalOpen] = useState(false);

  // Feedback Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Zustand Store Giacenze
  const getStock = useInventoryStore((state) => state.getStock);
  const batchDepleteStock = useInventoryStore((state) => state.batchDepleteStock);

  const quickProducts = useMemo(() => getAllProducts().slice(0, 6), []);

  useEffect(() => setMounted(true), []);

  // Orologio tempo reale
  useEffect(() => {
    const tick = () =>
      setClock(
        new Intl.DateTimeFormat("it-IT", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(new Date()),
      );
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const pushToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4500);
  }, []);

  // Calcolo subtotale e sconti
  const subtotal = useMemo(
    () => ticketLines.reduce((acc, line) => acc + line.lineTotal, 0),
    [ticketLines],
  );

  const itemCount = useMemo(
    () => ticketLines.reduce((acc, line) => acc + line.quantity, 0),
    [ticketLines],
  );

  const parsedDiscount = Number.parseFloat(discountValueStr.replace(",", ".")) || 0;

  const discountAmount = useMemo(() => {
    if (parsedDiscount <= 0 || subtotal <= 0) return 0;
    if (discountMode === "percent") {
      return (subtotal * Math.min(100, parsedDiscount)) / 100;
    }
    return Math.min(subtotal, parsedDiscount);
  }, [subtotal, parsedDiscount, discountMode]);

  const total = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);

  // Calcolo fiscale IVA 22% scorporata
  const taxBreakdown: TaxBreakdown = useMemo(() => {
    const taxableBase = total > 0 ? Number((total / 1.22).toFixed(2)) : 0;
    const vatAmount = total > 0 ? Number((total - taxableBase).toFixed(2)) : 0;
    return {
      subtotal,
      discountAmount,
      taxableBase,
      vatRate: 22.0,
      vatAmount,
      total,
    };
  }, [subtotal, discountAmount, total]);

  // Calcolo Resto
  const cashTendered = Number.parseFloat(cashTenderedStr.replace(",", ".")) || 0;
  const changeDue = Math.max(0, cashTendered - total);

  // Aggiunta prodotto alla vendita
  const addProductToTicket = useCallback(
    (product: Product, quantity = 1) => {
      const availableStock = getStock(product.id);
      if (availableStock <= 0) {
        pushToast({
          tone: "info",
          title: "Articolo esaurito a magazzino",
          message: `Attenzione: ${product.name} risulta a giacenza 0. La vendita forzerà lo scarico.`,
        });
      }

      setTicketLines((current) => {
        const existingIdx = current.findIndex((line) => line.product.id === product.id);
        if (existingIdx >= 0) {
          const updated = [...current];
          const nextQty = updated[existingIdx].quantity + quantity;
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: nextQty,
            lineTotal: updated[existingIdx].unitPrice * nextQty,
          };
          return updated;
        }

        const newLine: CassaTicketLine = {
          product,
          quantity,
          unitPrice: product.price,
          lineDiscount: 0,
          lineTotal: product.price * quantity,
        };
        return [...current, newLine];
      });
    },
    [getStock, pushToast],
  );

  // Elaborazione scansione barcode
  const handleBarcodeScanned = useCallback(
    (rawCode: string) => {
      const code = rawCode.trim();
      if (!code) return;

      const product = findProductByCode(code);
      if (product) {
        addProductToTicket(product);
        playPosBeep(1450, 0.08);
        setScanState("ok");
        setScanMessage(`Scansionato: ${product.brand} — ${product.name} (${formatPrice(product.price)})`);
        pushToast({
          tone: "success",
          title: "Articolo Riconosciuto",
          message: `${product.name} aggiunto allo scontrino.`,
        });
      } else {
        playPosBeep(450, 0.2); // Tono grave di errore
        setScanState("error");
        setScanMessage(`Codice «${code}» non trovato a catalogo.`);
        pushToast({
          tone: "error",
          title: "Codice Sconosciuto",
          message: `Nessun gioiello o orologio associato a ${code}.`,
        });
      }

      window.setTimeout(() => setScanState("idle"), 1400);
    },
    [addProductToTicket, pushToast],
  );

  // Hook globale per pistola barcode hardware (<60ms)
  useBarcodeScanner({
    onScan: handleBarcodeScanned,
    minChars: 4,
    enabled: !auraModalOpen && !sdiModalOpen,
  });

  const changeLineQuantity = (productId: string, delta: number) => {
    setTicketLines((current) =>
      current.flatMap((line) => {
        if (line.product.id !== productId) return [line];
        const next = line.quantity + delta;
        if (next <= 0) return [];
        return [
          {
            ...line,
            quantity: next,
            lineTotal: line.unitPrice * next,
          },
        ];
      }),
    );
  };

  const removeLine = (productId: string) => {
    setTicketLines((current) => current.filter((line) => line.product.id !== productId));
  };

  const resetTicket = useCallback(() => {
    setTicketLines([]);
    setDiscountValueStr("");
    setSearchQuery("");
    setCashTenderedStr("");
    setScanMessage("In attesa di scansione… punta la pistola laser sul codice a barre.");
    barcodeRef.current?.focus();
  }, []);

  // Costruzione oggetto ticket cassa
  const currentTicket: CassaTicket = useMemo(() => {
    const saleNum = `ORC-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.floor(
      Math.random() * 8999 + 1000,
    )}`;

    return {
      id: saleNum,
      ticketNumber: saleNum,
      operator,
      items: ticketLines,
      itemCount,
      subtotal,
      discountMode,
      discountValue: parsedDiscount,
      discountAmount,
      taxBreakdown,
      total,
      paymentMethod: quickPaymentMethod,
      cashTendered,
      changeDue,
      createdAt: new Date().toISOString(),
    };
  }, [
    operator,
    ticketLines,
    itemCount,
    subtotal,
    discountMode,
    parsedDiscount,
    discountAmount,
    taxBreakdown,
    total,
    quickPaymentMethod,
    cashTendered,
    changeDue,
  ]);

  // Completamento vendita con scalo sincronizzato magazzino
  const finalizeSale = useCallback(
    (saleType: "scontrino" | "fattura", docId: string) => {
      // 1. Scalo immediato della giacenza
      const itemsToDeplete = ticketLines.map((line) => ({
        barcodeOrSku: line.product.barcode || line.product.sku,
        quantity: line.quantity,
        product: line.product,
      }));

      batchDepleteStock(itemsToDeplete, docId, operator);

      // 2. Feedback
      pushToast({
        tone: "success",
        title: saleType === "scontrino" ? "Scontrino Registrato" : "Fattura Trasmessa",
        message: `${docId} completato. Giacenze scalate per ${itemCount} articoli.`,
      });

      // 3. Sincronizzazione transazione atomica su Supabase dedicato (background)
      try {
        fetch("/api/pos/sale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            saleNumber: docId,
            saleType: saleType === "scontrino" ? "scontrino_rt" : "fattura_sdi",
            operator,
            paymentMethod: quickPaymentMethod,
            subtotal,
            discountMode,
            discountValue: parsedDiscount,
            discountAmount,
            taxableBase: taxBreakdown.taxableBase,
            vatAmount: taxBreakdown.vatAmount,
            totalAmount: total,
            cashTendered,
            cashChange: changeDue,
            items: ticketLines.map((line) => ({
              barcode: line.product.barcode,
              sku: line.product.sku,
              name: line.product.name,
              brand: line.product.brand,
              price: line.unitPrice,
              quantity: line.quantity,
            })),
            rtReceiptNumber: saleType === "scontrino" ? docId : undefined,
            sdiIdentifier: saleType === "fattura" ? docId : undefined,
          }),
        }).catch((err) => {
          console.warn("[Oroeco POS] Supabase sync deferred:", err);
        });
      } catch (err) {
        console.warn("[Oroeco POS] Fetch unavailable:", err);
      }

      // 4. Reset vendita
      resetTicket();
    },
    [
      ticketLines,
      batchDepleteStock,
      operator,
      itemCount,
      pushToast,
      resetTicket,
      quickPaymentMethod,
      subtotal,
      discountMode,
      parsedDiscount,
      discountAmount,
      taxBreakdown,
      total,
      cashTendered,
      changeDue,
    ],
  );

  const searchResults = useMemo(() => {
    return searchQuery.trim() ? searchProducts(searchQuery).slice(0, 8) : [];
  }, [searchQuery]);

  const activeProfile = OPERATOR_PROFILES[operator];

  return (
    <div className="min-h-screen bg-pearl pb-16">
      {/* =========================================================================
          BARRA SUPERIORE BANCO & OPERATORE
          ========================================================================= */}
      <header className="sticky top-0 z-40 border-b border-navy-deep bg-navy text-white shadow-md">
        <div className="container-luxe flex flex-wrap items-center justify-between gap-4 py-3.5">
          {/* Logo & Bottone Ritorno */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-white/20 transition-colors hover:border-gold hover:text-gold"
              aria-label="Torna allo storefront"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            </Link>
            <div className="flex items-center gap-2.5">
              <span className="grid h-10 w-10 place-items-center rounded-sm border border-gold/50 bg-navy-deep text-gold">
                <Store className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <div>
                <h1 className="font-serif text-lg leading-tight text-white">
                  Cassa Banco · ORO&amp;CO
                </h1>
                <p className="text-[0.62rem] uppercase tracking-[0.2em] text-gold-soft">
                  Via Filippo Turati, 30 · San Marzano sul Sarno (SA) · dal 1992
                </p>
              </div>
            </div>
          </div>

          {/* Selettore Operatore Ergonomico (Renato, Carmela, Maria) & Orologio */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Dropdown Operatore */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOperatorMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-2.5 rounded-sm border border-white/20 bg-white/10 px-3.5 py-2 text-xs transition-colors hover:border-gold"
              >
                <User className="h-4 w-4 text-gold" />
                <span className="text-white/80">Operatore:</span>
                <strong className="font-semibold text-white">{activeProfile.name}</strong>
                <span className={cn("rounded-sm px-1.5 py-0.5 text-[0.58rem] font-bold", activeProfile.colorClass)}>
                  {activeProfile.titleBadge}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-gold-soft" />
              </button>

              {operatorMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-sm border border-line bg-white p-2 shadow-2xl z-50 text-ink">
                  <p className="px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-graphite-soft">
                    Cambio Operatore Banco
                  </p>
                  {(["Renato", "Carmela", "Maria"] as CassaOperator[]).map((opName) => {
                    const prof = OPERATOR_PROFILES[opName];
                    const isCurrent = opName === operator;
                    return (
                      <button
                        key={opName}
                        type="button"
                        onClick={() => {
                          setOperator(opName);
                          setOperatorMenuOpen(false);
                          pushToast({
                            tone: "info",
                            title: `Operatore: ${prof.name}`,
                            message: `Sessione cassa assegnata a ${prof.role}.`,
                          });
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-sm px-2.5 py-2 text-left text-xs transition-colors",
                          isCurrent ? "bg-pearl font-bold text-ink" : "hover:bg-pearl/60 text-graphite",
                        )}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">{prof.name}</p>
                          <p className="text-[0.62rem] text-graphite-soft truncate">{prof.role}</p>
                        </div>
                        <span className={cn("shrink-0 rounded-sm px-1.5 py-0.5 text-[0.55rem] font-bold", prof.colorClass)}>
                          {prof.titleBadge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Orologio */}
            <div className="inline-flex items-center gap-2 rounded-sm border border-white/15 bg-white/5 px-3 py-2 text-xs tracking-wider text-white">
              <Clock className="h-4 w-4 text-gold-soft" strokeWidth={1.8} />
              <span>{mounted ? clock : "—"}</span>
            </div>

            <button
              type="button"
              onClick={async () => {
                await fetch("/api/admin/auth/logout", { method: "POST" }).catch(() => null);
                window.location.href = "/admin/login";
              }}
              className="inline-flex items-center gap-1.5 rounded-sm border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-red-200 transition-colors hover:border-red-300 hover:bg-red-500/20 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
              Esci
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          AREA PRINCIPALE: GRIGLIA BANCO A 2 COLONNE
          ========================================================================= */}
      <main className="container-luxe grid gap-8 pt-6 lg:grid-cols-[1fr_26rem]">
        {/* =======================================================================
            COLONNA SINISTRA: HARDWARE BARCODE SCANNER & RICERCA CATALOGO
            ======================================================================= */}
        <div className="space-y-6">
          {/* SEZIONE 1: PISTOLA OTTICA BARCODE (LISTENER GLOBALE) */}
          <section className="rounded-sm border border-line bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-sm bg-navy text-gold">
                  <ScanBarcode className="h-4 w-4" strokeWidth={2} />
                </span>
                <h2 className="font-serif text-xl font-semibold text-ink">
                  Pistola Barcode Hardware
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-sm bg-pearl px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-graphite">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                Laser USB / BT Attivo (&lt;60ms)
              </span>
            </div>

            {/* Input ottico con feedback immediato */}
            <div
              className={cn(
                "flex items-center gap-3.5 rounded-sm border-2 px-4 py-1 transition-all",
                scanState === "ok" && "animate-flash-green border-green-500 bg-green-50",
                scanState === "error" && "border-red-400 bg-red-50",
                scanState === "idle" && "border-line focus-within:border-gold",
              )}
            >
              {scanState === "ok" ? (
                <Check className="h-6 w-6 shrink-0 text-green-600" strokeWidth={2.5} />
              ) : (
                <Barcode className="h-6 w-6 shrink-0 text-gold" strokeWidth={1.8} />
              )}
              <input
                ref={barcodeRef}
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleBarcodeScanned(barcodeInput);
                    setBarcodeInput("");
                  }
                }}
                placeholder="Punta la pistola barcode o digita il codice EAN/SKU…"
                className="h-14 flex-1 bg-transparent font-mono text-lg tracking-wider text-ink outline-none placeholder:font-sans placeholder:text-sm placeholder:tracking-normal placeholder:text-graphite-soft"
              />
              {barcodeInput && (
                <button
                  type="button"
                  onClick={() => {
                    handleBarcodeScanned(barcodeInput);
                    setBarcodeInput("");
                  }}
                  className="rounded-sm bg-navy px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-gold hover:text-ink"
                >
                  Inserisci
                </button>
              )}
            </div>

            <p
              className={cn(
                "mt-3 text-sm transition-colors",
                scanState === "ok"
                  ? "font-semibold text-green-700"
                  : scanState === "error"
                    ? "font-semibold text-red-600"
                    : "text-graphite-soft",
              )}
            >
              {scanMessage}
            </p>
          </section>

          {/* SEZIONE 2: RICERCA MANUALE RAPIDA PER NOME, CODICE, BRAND */}
          <section className="rounded-sm border border-line bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-sm bg-navy text-gold">
                  <Search className="h-4 w-4" strokeWidth={2} />
                </span>
                <h2 className="font-serif text-xl font-semibold text-ink">
                  Ricerca Manuale Catalogo
                </h2>
              </div>
              <span className="text-xs text-graphite-soft">
                Cerca tra oltre 50 preziosi
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-sm border border-line px-4 focus-within:border-gold">
              <Search className="h-4 w-4 shrink-0 text-graphite-soft" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Es. «solitario», «Bulova», «anello», «Unoaerre»…"
                className="h-12 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-graphite-soft"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Pulisci ricerca"
                  className="text-graphite-soft hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Risultati ricerca */}
            {searchResults.length > 0 ? (
              <ul className="mt-4 max-h-80 divide-y divide-line overflow-y-auto rounded-sm border border-line">
                {searchResults.map((product) => {
                  const stock = getStock(product.id);
                  return (
                    <li key={product.id}>
                      <button
                        type="button"
                        onClick={() => {
                          addProductToTicket(product);
                          playPosBeep(1200, 0.06);
                          pushToast({
                            tone: "success",
                            title: "Articolo Aggiunto",
                            message: `${product.brand} — ${product.name}`,
                          });
                        }}
                        className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-pearl"
                      >
                        <div className="min-w-0">
                          <span className="block text-[0.62rem] font-bold uppercase tracking-[0.16em] text-gold">
                            {product.brand} · {product.subcategoryLabel}
                          </span>
                          <span className="block truncate font-serif text-base text-ink">
                            {product.name}
                          </span>
                          <div className="flex items-center gap-2 font-mono text-[0.65rem] text-graphite-soft">
                            <span>SKU: {product.sku}</span>
                            <span>·</span>
                            <span>EAN: {product.barcode}</span>
                            <span>·</span>
                            <span
                              className={cn(
                                "font-sans font-semibold",
                                stock > 0 ? "text-green-700" : "text-red-600",
                              )}
                            >
                              Giacenza: {stock} pz
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="block text-sm font-bold text-ink">
                            {formatPrice(product.price)}
                          </span>
                          <span className="mt-1 inline-flex items-center gap-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-gold">
                            <Plus className="h-3 w-3" strokeWidth={2.5} />
                            Aggiungi
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : searchQuery.trim() ? (
              <p className="mt-4 rounded-sm border border-line bg-pearl px-4 py-6 text-center text-sm text-graphite-soft">
                Nessun prezioso trovato per «{searchQuery}».
              </p>
            ) : (
              <div className="mt-5">
                <p className="mb-2.5 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-graphite-soft">
                  Articoli Rapidi da Banco
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        addProductToTicket(product);
                        playPosBeep(1200, 0.06);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-pearl px-3.5 py-1.5 text-xs text-graphite transition-colors hover:border-gold hover:bg-gold-tint/40 hover:text-ink"
                    >
                      <Plus className="h-3 w-3 text-gold" strokeWidth={2.5} />
                      <span className="truncate max-w-[140px]">{product.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* =======================================================================
            COLONNA DESTRA: SCONTRINO VENDITA, SCONTI, TOTALI & AZIONI
            ======================================================================= */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="flex max-h-[calc(100vh-6rem)] flex-col rounded-sm border border-line bg-white shadow-lg">
            {/* Intestazione Scontrino */}
            <div className="flex items-center justify-between border-b border-line bg-pearl px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-gold" />
                <h2 className="font-serif text-lg font-semibold text-ink">
                  Scontrino in Corso
                </h2>
              </div>
              <span className="rounded-full bg-navy px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-white">
                {itemCount} {itemCount === 1 ? "pezzo" : "pezzi"}
              </span>
            </div>

            {/* Lista Articoli */}
            <div className="flex-1 overflow-y-auto">
              {ticketLines.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                  <Calculator className="h-10 w-10 text-gold-soft" strokeWidth={1.4} />
                  <p className="font-serif text-lg text-ink">
                    Nessun articolo aggiunto
                  </p>
                  <p className="text-xs leading-relaxed text-graphite-soft max-w-xs">
                    Scansiona con la pistola barcode o usa la ricerca catalogo per avviare la vendita.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {ticketLines.map((line) => {
                    const stock = getStock(line.product.id);
                    return (
                      <li key={line.product.id} className="p-4 transition-colors hover:bg-pearl/40">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="block text-[0.6rem] font-bold uppercase tracking-[0.16em] text-gold">
                              {line.product.brand}
                            </span>
                            <p className="truncate font-serif text-sm font-medium text-ink">
                              {line.product.name}
                            </p>
                            <span className="block font-mono text-[0.62rem] text-graphite-soft">
                              {line.product.sku} · Giacenza: {stock} pz
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLine(line.product.id)}
                            aria-label="Rimuovi articolo"
                            className="text-graphite-soft transition-colors hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Modifica Quantità */}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="inline-flex items-center rounded-sm border border-line">
                            <button
                              type="button"
                              onClick={() => changeLineQuantity(line.product.id, -1)}
                              aria-label="Diminuisci quantità"
                              className="grid h-8 w-8 place-items-center text-graphite hover:text-gold"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-ink">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => changeLineQuantity(line.product.id, 1)}
                              aria-label="Aumenta quantità"
                              className="grid h-8 w-8 place-items-center text-graphite hover:text-gold"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-ink">
                            {formatPrice(line.lineTotal)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* ===================================================================
                SEZIONE SCONTI, RIEPILOGO FISCALE & AZIONI BANCO
                =================================================================== */}
            <div className="border-t border-line p-5 bg-white">
              {/* Gestione Sconti Negoziati */}
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-graphite">
                    Sconto Negoziato Banco
                  </label>
                  {discountAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => setDiscountValueStr("")}
                      className="text-[0.62rem] font-semibold text-red-600 hover:underline"
                    >
                      Azzera sconto
                    </button>
                  )}
                </div>

                {/* Chips Sconto Rapido (5%, 10%, 15%, 20%, 50€, 100€) */}
                <div className="mb-2.5 flex flex-wrap gap-1.5">
                  {QUICK_DISCOUNTS.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        setDiscountMode(chip.mode);
                        setDiscountValueStr(chip.value.toString());
                      }}
                      className={cn(
                        "rounded-sm border px-2 py-1 text-[0.65rem] font-bold transition-all",
                        discountMode === chip.mode && parsedDiscount === chip.value
                          ? "border-gold bg-gold text-ink"
                          : "border-line bg-pearl text-graphite hover:border-gold",
                      )}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Input Sconto Personalizzato */}
                <div className="flex items-center gap-2">
                  <div className="inline-flex overflow-hidden rounded-sm border border-line">
                    <button
                      type="button"
                      onClick={() => setDiscountMode("percent")}
                      className={cn(
                        "grid h-10 w-10 place-items-center transition-colors",
                        discountMode === "percent"
                          ? "bg-navy text-white"
                          : "text-graphite hover:text-gold",
                      )}
                      aria-label="Sconto in percentuale"
                    >
                      <Percent className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountMode("amount")}
                      className={cn(
                        "grid h-10 w-10 place-items-center transition-colors",
                        discountMode === "amount"
                          ? "bg-navy text-white"
                          : "text-graphite hover:text-gold",
                      )}
                      aria-label="Sconto a valore in euro"
                    >
                      <span className="text-xs font-bold">€</span>
                    </button>
                  </div>
                  <input
                    inputMode="decimal"
                    value={discountValueStr}
                    onChange={(e) => setDiscountValueStr(e.target.value)}
                    placeholder={discountMode === "percent" ? "0 %" : "0,00 €"}
                    className="h-10 flex-1 rounded-sm border border-line px-3 text-right font-mono text-sm text-ink outline-none focus:border-gold"
                  />
                </div>
              </div>

              {/* Dettaglio Calcolo Fiscale IVA 22% */}
              <dl className="space-y-1.5 text-xs text-graphite rounded-sm border border-line bg-pearl p-3">
                <div className="flex justify-between">
                  <dt>Subtotale Lordo</dt>
                  <dd className="font-semibold text-ink">{formatPrice(subtotal)}</dd>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <dt>Sconto Negoziato</dt>
                    <dd className="font-semibold">−{formatPrice(discountAmount)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-line pt-1 text-[0.65rem] text-graphite-soft">
                  <dt>Imponibile Netto (Base IVA)</dt>
                  <dd className="font-mono">{formatPrice(taxBreakdown.taxableBase)}</dd>
                </div>
                <div className="flex justify-between text-[0.65rem] text-graphite-soft">
                  <dt>IVA al 22,00% Scorporata</dt>
                  <dd className="font-mono">{formatPrice(taxBreakdown.vatAmount)}</dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-line pt-2 text-ink">
                  <dt className="font-serif text-base font-bold">Totale Cassa</dt>
                  <dd className="font-serif text-2xl font-bold text-navy">
                    {formatPrice(total)}
                  </dd>
                </div>
              </dl>

              {/* Pulsanti Azione Banco */}
              <div className="mt-4 grid gap-2.5">
                {/* 1. Batti Scontrino Fiscale Axon Aura RT */}
                <button
                  type="button"
                  disabled={ticketLines.length === 0}
                  onClick={() => setAuraModalOpen(true)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-sm bg-navy px-4 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-sm transition-all hover:bg-gold hover:text-ink disabled:opacity-50"
                >
                  <Printer className="h-4 w-4" />
                  Batti Scontrino Cassa (Axon Aura RT)
                </button>

                {/* 2. Emetti Fattura Elettronica SDI 1-Click */}
                <button
                  type="button"
                  disabled={ticketLines.length === 0}
                  onClick={() => setSdiModalOpen(true)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-sm border border-gold bg-gold-tint/40 px-4 text-xs font-bold uppercase tracking-[0.14em] text-ink transition-all hover:bg-gold hover:text-white disabled:opacity-50"
                >
                  <FileText className="h-4 w-4" />
                  Emetti Fattura Elettronica SDI 1-Click
                </button>

                {/* 3. Azzera Vendita */}
                <button
                  type="button"
                  onClick={resetTicket}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-sm text-xs font-semibold uppercase tracking-wider text-graphite-soft transition-colors hover:text-red-600"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Azzera scontrino
                </button>
              </div>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[0.62rem] uppercase tracking-wider text-graphite-soft">
                <BadgeCheck className="h-3.5 w-3.5 text-gold" />
                Registratore Telematico collegato · Scalo giacenze attivo
              </p>
            </div>
          </div>
        </aside>
      </main>

      {/* =========================================================================
          MODALI FISCALI: SCONTRINO AURA RT & FATTURA SDI
          ========================================================================= */}
      <AuraReceiptModal
        isOpen={auraModalOpen}
        onClose={() => setAuraModalOpen(false)}
        ticket={currentTicket}
        operator={operator}
        onConfirmPrint={(method, tendered, change) => {
          finalizeSale("scontrino", currentTicket.ticketNumber);
        }}
      />

      <SdiInvoiceModal
        isOpen={sdiModalOpen}
        onClose={() => setSdiModalOpen(false)}
        ticket={currentTicket}
        operator={operator}
        onConfirmInvoice={(cust, payload) => {
          finalizeSale("fattura", payload.invoiceNumber);
        }}
      />

      {/* =========================================================================
          SISTEMA TOAST FEEDBACK
          ========================================================================= */}
      <div className="fixed bottom-4 right-4 z-[90] flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "flex items-start gap-3 rounded-sm border p-4 shadow-xl text-xs transition-all",
              toast.tone === "success" && "border-green-300 bg-white text-green-950",
              toast.tone === "error" && "border-red-300 bg-white text-red-950",
              toast.tone === "info" && "border-gold/40 bg-white text-ink",
            )}
          >
            {toast.tone === "success" && (
              <Check className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
            )}
            {toast.tone === "error" && (
              <X className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            )}
            {toast.tone === "info" && (
              <Sparkles className="h-4 w-4 shrink-0 text-gold mt-0.5" />
            )}
            <div className="min-w-0">
              <strong className="block font-semibold text-ink">{toast.title}</strong>
              <p className="mt-0.5 text-graphite leading-relaxed">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
