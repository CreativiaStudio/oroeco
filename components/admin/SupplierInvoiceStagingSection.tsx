"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  Check,
  FileCode2,
  Loader2,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { SAMPLE_FATTURAPA_XML } from "@/lib/fatturaPaParser";
import { formatPrice } from "@/lib/utils";
import type { ProductCategory } from "@/types/product";

interface StagedInvoiceRow {
  lineNumber: number;
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  lineTotal: number;
  included: boolean;
  status: "match_existing" | "new_sku";
  productId: string | null;
  existingName: string | null;
  existingBrand: string | null;
  currentStock: number;
  currentPrice: number | null;
  approvalStatus: string;
  suggestedRetailPrice: number;
}

interface ParsedHeader {
  supplierName: string;
  supplierVat: string;
  inferredBrand: string;
  inferredCategory: ProductCategory;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: number;
}

interface CommittedHistoryItem {
  id: string;
  operator: string;
  created_at: string;
  details: {
    invoiceNumber?: string;
    supplierName?: string;
    brandName?: string;
    updatedExistingCount?: number;
    insertedNewCount?: number;
    totalUnitsAdded?: number;
  };
}

interface SupplierInvoiceStagingSectionProps {
  onCommitted?: () => void;
}

const BRAND_OPTIONS = [
  "Stroili",
  "Unoaerre",
  "Villeroy & Boch",
  "Cuorematto",
  "Gli Alberelli",
  "Guess",
  "Bulova",
  "Gerba",
  "Locman",
  "Paul Picot",
  "Lladró",
  "Davite & Delucchi",
  "Nihama",
  "Golay",
  "Ducati",
];

export function SupplierInvoiceStagingSection({
  onCommitted,
}: SupplierInvoiceStagingSectionProps) {
  const [header, setHeader] = useState<ParsedHeader | null>(null);
  const [rows, setRows] = useState<StagedInvoiceRow[]>([]);
  const [brand, setBrand] = useState("Stroili");
  const [category, setCategory] = useState<ProductCategory>("gioielli");
  const [staging, setStaging] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [commitBanner, setCommitBanner] = useState("");
  const [history, setHistory] = useState<CommittedHistoryItem[]>([]);

  const loadHistory = async () => {
    try {
      const res = await fetch("/api/admin/invoices", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.history)) {
        setHistory(data.history as CommittedHistoryItem[]);
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const stageXmlContent = async (xmlContent: string) => {
    setErrorMsg("");
    setCommitBanner("");
    setStaging(true);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stage_xml", xmlContent }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "Impossibile analizzare il file XML FatturaPA.");
        return;
      }
      const parsed = data.parsed as ParsedHeader;
      setHeader(parsed);
      setBrand(parsed.inferredBrand || "Stroili");
      setCategory(parsed.inferredCategory || "gioielli");
      setRows((data.stagedRows || []) as StagedInvoiceRow[]);
    } catch {
      setErrorMsg("Errore di rete durante l'analisi della fattura XML.");
    } finally {
      setStaging(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await stageXmlContent(text);
    e.target.value = "";
  };

  const handleCommit = async () => {
    if (!header || rows.length === 0) return;
    setErrorMsg("");
    setCommitting(true);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "commit_staging",
          invoiceMeta: header,
          brand,
          category,
          rows,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "Errore durante il carico nel gestionale.");
        return;
      }

      setCommitBanner(
        `Fattura ${data.invoiceNumber} validata: +${data.totalUnitsAdded} pezzi totali (${data.updatedExistingCount} giacenze aggiornate, ${data.insertedNewCount} nuovi SKU messi al sicuro in Solo Cassa).`,
      );
      setHeader(null);
      setRows([]);
      await loadHistory();
      onCommitted?.();
    } catch {
      setErrorMsg("Errore di rete durante il commit della fattura.");
    } finally {
      setCommitting(false);
    }
  };

  const includedRows = rows.filter((r) => r.included);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-sm border border-[#E5E0D5] bg-white shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E5E0D5] bg-[#F8F7F4] px-5 py-5">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-sm bg-[#012236] text-[#C5A059]">
              <ShieldCheck className="h-5 w-5" strokeWidth={1.9} />
            </span>
            <div className="max-w-2xl">
              <h2 className="font-serif text-xl font-semibold text-ink">
                Compartimento Stagno Fatture Fornitori (XML FatturaPA)
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-graphite">
                Carica la fattura elettronica XML ricevuta dai fornitori (Stroili/Timeway,
                Unoaerre/Urigold, Emmebi, Villeroy, Locman). Il sistema confronta ogni SKU prima di
                toccare il catalogo: gli articoli esistenti vengono ricaricati, i nuovi SKU vanno
                in <strong>Solo Cassa</strong> finché non aggiungi le foto ufficiali.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-sm bg-[#C5A059] px-4 py-2.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#0A0A0A] hover:bg-[#d4af37]">
              <Upload className="h-4 w-4" />
              <span>{staging ? "Analisi XML…" : "Carica XML FatturaPA"}</span>
              <input
                type="file"
                accept=".xml,text/xml,application/xml"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
            <button
              type="button"
              onClick={() => void stageXmlContent(SAMPLE_FATTURAPA_XML)}
              disabled={staging}
              className="inline-flex items-center gap-1.5 rounded-sm border border-[#E5E0D5] bg-white px-3 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-ink hover:border-[#C5A059] cursor-pointer"
            >
              <FileCode2 className="h-4 w-4 text-[#C5A059]" />
              Prova con XML Test
            </button>
          </div>
        </div>

        {errorMsg ? (
          <div className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-5 py-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        ) : null}

        {commitBanner ? (
          <div className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm text-emerald-800">
            <BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600" />
            <span>{commitBanner}</span>
          </div>
        ) : null}

        {header && rows.length > 0 ? (
          <div className="p-5 space-y-4">
            <div className="grid gap-3 rounded-sm border border-[#E5E0D5] bg-[#FAF8F4] p-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
              <div>
                <span className="block text-[0.6rem] uppercase tracking-wider text-graphite-soft">
                  Fornitore / Doc
                </span>
                <strong className="text-ink block mt-0.5">{header.supplierName}</strong>
                <span className="font-mono text-graphite-soft">
                  {header.invoiceNumber} · {header.invoiceDate}
                </span>
              </div>
              <div>
                <label className="block text-[0.6rem] uppercase tracking-wider text-graphite-soft">
                  Brand Associato
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="mt-1 w-full rounded-sm border border-[#E5E0D5] bg-white px-2 py-1 text-xs text-ink"
                  >
                    {BRAND_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <label className="block text-[0.6rem] uppercase tracking-wider text-graphite-soft">
                  Categoria Nuovi SKU
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="mt-1 w-full rounded-sm border border-[#E5E0D5] bg-white px-2 py-1 text-xs text-ink"
                  >
                    <option value="gioielli">Gioielli</option>
                    <option value="orologi">Orologi</option>
                    <option value="accessori">Accessori</option>
                    <option value="casa">Casa</option>
                    <option value="natale">Natale</option>
                  </select>
                </label>
              </div>
              <div className="flex flex-col justify-between items-end">
                <span className="text-[0.6rem] uppercase tracking-wider text-graphite-soft">
                  Righe Selezionate
                </span>
                <strong className="font-serif text-lg text-[#012236]">
                  {includedRows.length} / {rows.length}
                </strong>
              </div>
            </div>

            <div className="overflow-x-auto rounded-sm border border-[#E5E0D5]">
              <table className="w-full min-w-[780px] text-left text-xs">
                <thead className="border-b border-[#E5E0D5] bg-[#F8F7F4] text-[0.6rem] uppercase tracking-[0.14em] text-graphite-soft">
                  <tr>
                    <th className="px-3 py-2.5 text-center">Includi</th>
                    <th className="px-3 py-2.5">SKU Fornitore</th>
                    <th className="px-3 py-2.5">Descrizione / Match Catalogo</th>
                    <th className="px-3 py-2.5">Destinazione</th>
                    <th className="px-3 py-2.5 text-center">Q.tà</th>
                    <th className="px-3 py-2.5 text-right">Costo Net.</th>
                    <th className="px-3 py-2.5 text-right">Listino Pubblico (€)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEAE0]">
                  {rows.map((row, idx) => (
                    <tr key={`${row.lineNumber}-${row.sku}`} className="hover:bg-[#F8F7F4]/60">
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={row.included}
                          onChange={() =>
                            setRows((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, included: !r.included } : r)),
                            )
                          }
                          className="h-4 w-4 accent-[#C5A059] cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2.5 font-mono font-semibold text-ink">{row.sku}</td>
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-ink">{row.description}</p>
                        {row.existingName ? (
                          <p className="text-[0.68rem] text-emerald-700">
                            Match trovato: {row.existingName} (giacenza attuale {row.currentStock})
                          </p>
                        ) : (
                          <p className="text-[0.68rem] text-amber-700">
                            SKU non presente in catalogo: verrà isolato in Solo Cassa
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {row.status === "match_existing" ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[0.62rem] font-semibold text-emerald-700">
                            <Check className="h-3 w-3" />
                            Riassortimento +{row.quantity}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[0.62rem] font-semibold text-amber-700">
                            Nuovo → Solo Cassa
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-semibold">
                        +{row.quantity}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-graphite">
                        {formatPrice(row.unitPrice)}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {row.status === "match_existing" && row.currentPrice ? (
                          <span className="font-mono font-semibold text-ink">
                            {formatPrice(row.currentPrice)}
                          </span>
                        ) : (
                          <input
                            type="number"
                            min={1}
                            step="1"
                            value={row.suggestedRetailPrice}
                            onChange={(e) => {
                              const val = Math.max(1, Number(e.target.value) || 1);
                              setRows((prev) =>
                                prev.map((r, i) =>
                                  i === idx ? { ...r, suggestedRetailPrice: val } : r,
                                ),
                              );
                            }}
                            className="w-24 rounded-sm border border-[#E5E0D5] px-2 py-1 text-right font-mono text-xs text-ink"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setHeader(null);
                  setRows([]);
                }}
                className="rounded-sm border border-[#E5E0D5] bg-white px-4 py-2 text-xs font-semibold text-graphite cursor-pointer"
              >
                Annulla Bozza
              </button>
              <button
                type="button"
                onClick={handleCommit}
                disabled={committing || includedRows.length === 0}
                className="inline-flex items-center gap-2 rounded-sm bg-[#012236] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-[#C5A059] hover:text-[#0A0A0A] disabled:opacity-50 cursor-pointer"
              >
                {committing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvataggio su Supabase…
                  </>
                ) : (
                  <>
                    <BadgeCheck className="h-4 w-4" />
                    Valida e Carica nel Gestionale ({includedRows.length} righe)
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}

        {history.length > 0 ? (
          <div className="border-t border-[#E5E0D5] bg-[#FAF8F4] px-5 py-3 text-xs text-graphite">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-graphite-soft mb-1.5">
              Ultimi carichi validati dal Compartimento Stagno
            </p>
            <div className="flex flex-wrap gap-2">
              {history.slice(0, 5).map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E0D5] bg-white px-3 py-1 text-[0.68rem]"
                >
                  <Check className="h-3 w-3 text-emerald-600" />
                  <strong>{item.details.invoiceNumber}</strong> · {item.details.brandName} (+
                  {item.details.totalUnitsAdded || 0} pz · {item.operator})
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
