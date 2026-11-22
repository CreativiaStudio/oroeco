"use client";

import { useEffect, useMemo, useState } from "react";
import { Barcode, Printer, Tag, X } from "lucide-react";
import { renderBarcodeSvgString } from "@/lib/barcodeSvg";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types/product";

type LabelFormat = "codino_70x10" | "vetrina_50x25";

interface JewelryLabelPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function JewelryLabelPrinterModal({
  isOpen,
  onClose,
  products,
}: JewelryLabelPrinterModalProps) {
  const [format, setFormat] = useState<LabelFormat>("codino_70x10");
  const [copiesById, setCopiesById] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isOpen) return;
    const next: Record<string, number> = {};
    for (const p of products) {
      next[p.id] = 1;
    }
    setCopiesById(next);
  }, [isOpen, products]);

  const totalLabels = useMemo(
    () =>
      products.reduce((sum, p) => sum + Math.max(1, Math.min(30, copiesById[p.id] || 1)), 0),
    [products, copiesById],
  );

  if (!isOpen || products.length === 0) return null;

  const setStockAsCopies = () => {
    const next: Record<string, number> = {};
    for (const p of products) {
      next[p.id] = Math.max(1, Math.min(30, p.stockQuantity || 1));
    }
    setCopiesById(next);
  };

  const setOneCopyEach = () => {
    const next: Record<string, number> = {};
    for (const p of products) {
      next[p.id] = 1;
    }
    setCopiesById(next);
  };

  const handlePrint = () => {
    const printWin = window.open("", "_blank", "width=900,height=700");
    if (!printWin) return;

    const labelHtmlChunks: string[] = [];
    for (const product of products) {
      const copies = Math.max(1, Math.min(30, copiesById[product.id] || 1));
      const code = product.barcode || product.sku;
      const svg = renderBarcodeSvgString(code, {
        height: format === "codino_70x10" ? 22 : 30,
        quietModules: 5,
      });
      const priceText = escapeHtml(formatPrice(product.price));
      const brandText = escapeHtml(product.brand.toUpperCase());
      const skuText = escapeHtml(product.sku);
      const codeText = escapeHtml(code);
      const shortName = escapeHtml(
        product.name.length > 42 ? `${product.name.slice(0, 39)}...` : product.name,
      );

      for (let c = 0; c < copies; c += 1) {
        if (format === "codino_70x10") {
          labelHtmlChunks.push(`
            <div class="label-codino">
              <div class="codino-half">
                <div class="brand-row">ORO&amp;CO · ${brandText}</div>
                <div class="price-row">${priceText}</div>
                <div class="sku-row">SKU ${skuText}</div>
              </div>
              <div class="codino-half codino-right">
                <div class="barcode-box">${svg}</div>
                <div class="ean-row">${codeText}</div>
              </div>
            </div>
          `);
        } else {
          labelHtmlChunks.push(`
            <div class="label-vetrina">
              <div class="vetrina-top">
                <span class="vetrina-brand">ORO&amp;CO · ${brandText}</span>
                <span class="vetrina-price">${priceText}</span>
              </div>
              <div class="vetrina-name">${shortName}</div>
              <div class="vetrina-barcode">${svg}</div>
              <div class="vetrina-code">${codeText} · SKU ${skuText}</div>
            </div>
          `);
        }
      }
    }

    const html = `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <title>Etichette Gioielli ORO&amp;CO</title>
  <style>
    @page { margin: 8mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, sans-serif; color: #020202; background: #fff; }
    .toolbar { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid #e5e0d5; background: #f8f7f4; font-size: 12px; }
    .toolbar button { background: #012236; color: #fff; border: 0; border-radius: 3px; padding: 7px 14px; font-weight: 600; cursor: pointer; }
    .sheet { display: flex; flex-wrap: wrap; gap: 5mm; padding: 6mm; }
    .label-codino { width: 70mm; height: 12mm; border: 0.3mm dashed #bbb; display: flex; align-items: center; padding: 1mm 2mm; page-break-inside: avoid; }
    .codino-half { width: 50%; padding-right: 1.5mm; overflow: hidden; }
    .codino-right { padding-right: 0; padding-left: 1.5mm; border-left: 0.25mm dotted #ccc; text-align: center; }
    .brand-row { font-size: 5.5pt; font-weight: 700; letter-spacing: 0.08em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .price-row { font-size: 8.5pt; font-weight: 800; line-height: 1.05; }
    .sku-row { font-size: 5pt; color: #555; font-family: monospace; white-space: nowrap; overflow: hidden; }
    .barcode-box svg { width: 100%; height: 6.5mm; display: block; }
    .ean-row { font-size: 5pt; font-family: monospace; letter-spacing: 0.04em; }
    .label-vetrina { width: 50mm; height: 25mm; border: 0.3mm solid #bbb; padding: 2mm 2.5mm; display: flex; flex-direction: column; justify-content: space-between; page-break-inside: avoid; }
    .vetrina-top { display: flex; justify-content: space-between; align-items: baseline; gap: 4px; }
    .vetrina-brand { font-size: 6pt; font-weight: 700; letter-spacing: 0.06em; color: #9A7D43; }
    .vetrina-price { font-size: 9.5pt; font-weight: 800; }
    .vetrina-name { font-size: 6.2pt; line-height: 1.15; color: #222; height: 6mm; overflow: hidden; }
    .vetrina-barcode svg { width: 100%; height: 7.5mm; display: block; }
    .vetrina-code { font-size: 5.5pt; font-family: monospace; text-align: center; color: #444; }
    @media print { .toolbar { display: none; } .sheet { padding: 0; } }
  </style>
</head>
<body>
  <div class="toolbar">
    <span><strong>ORO&amp;CO Stampa Etichette</strong> · ${totalLabels} etichette (${format === "codino_70x10" ? "Codino 70×10mm" : "Targhetta 50×25mm"})</span>
    <button onclick="window.print()">Stampa / Salva PDF</button>
  </div>
  <div class="sheet">${labelHtmlChunks.join("")}</div>
  <script>setTimeout(function(){ window.focus(); window.print(); }, 250);</script>
</body>
</html>`;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-sm border border-[#E5E0D5] bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-[#E5E0D5] bg-[#012236] px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-sm bg-[#C5A059] text-[#012236]">
              <Tag className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <div>
              <h3 className="font-serif text-lg font-semibold">Stampa Etichette &amp; Barcode Gioielli</h3>
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-white/70">
                Code 128B vettoriale · {products.length} articoli ({totalLabels} etichette totali)
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Chiudi stampa etichette" className="text-white/70 hover:text-white cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Formato + azioni rapide */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-[#E5E0D5] bg-[#F8F7F4] p-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFormat("codino_70x10")}
                className={`rounded-sm border px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                  format === "codino_70x10"
                    ? "border-[#012236] bg-[#012236] text-white"
                    : "border-[#E5E0D5] bg-white text-graphite"
                }`}
              >
                Codino Oreficeria (70×10 mm)
              </button>
              <button
                type="button"
                onClick={() => setFormat("vetrina_50x25")}
                className={`rounded-sm border px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                  format === "vetrina_50x25"
                    ? "border-[#012236] bg-[#012236] text-white"
                    : "border-[#E5E0D5] bg-white text-graphite"
                }`}
              >
                Targhetta Vetrina / Scatola (50×25 mm)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={setStockAsCopies}
                className="rounded-sm border border-[#E5E0D5] bg-white px-2.5 py-1 text-[0.68rem] font-semibold text-ink hover:border-[#C5A059] cursor-pointer"
              >
                Copie = Giacenza
              </button>
              <button
                type="button"
                onClick={setOneCopyEach}
                className="rounded-sm border border-[#E5E0D5] bg-white px-2.5 py-1 text-[0.68rem] font-semibold text-ink hover:border-[#C5A059] cursor-pointer"
              >
                1 copia ciascuno
              </button>
            </div>
          </div>

          {/* Lista articoli con anteprima barcode */}
          <div className="divide-y divide-[#EFEAE0] rounded-sm border border-[#E5E0D5]">
            {products.map((product) => {
              const code = product.barcode || product.sku;
              const barcodeSvg = renderBarcodeSvgString(code, { height: 28, quietModules: 5 });
              const qty = copiesById[product.id] ?? 1;

              return (
                <div key={product.id} className="flex flex-wrap items-center justify-between gap-4 p-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#C5A059]">
                      {product.brand} · {formatPrice(product.price)}
                    </p>
                    <p className="truncate text-sm font-medium text-ink">{product.name}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[0.68rem] text-graphite-soft">
                      <Barcode className="h-3.5 w-3.5" />
                      EAN/Barcode: {code} · SKU {product.sku}
                    </p>
                  </div>

                  <div
                    className="w-36 shrink-0 rounded border border-[#E5E0D5] bg-white p-1.5"
                    dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                  />

                  <label className="flex items-center gap-2 text-xs text-graphite">
                    <span>Copie</span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={qty}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(30, Number(e.target.value) || 1));
                        setCopiesById((prev) => ({ ...prev, [product.id]: val }));
                      }}
                      className="w-16 rounded-sm border border-[#E5E0D5] px-2 py-1 text-center font-mono text-xs text-ink"
                    />
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#E5E0D5] bg-[#F8F7F4] px-5 py-3.5">
          <span className="text-xs text-graphite">
            Compatibile con stampanti termiche Dymo / Brother / Zebra e fogli A4 fustellati.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-[#E5E0D5] bg-white px-4 py-2 text-xs font-semibold text-graphite cursor-pointer"
            >
              Chiudi
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-sm bg-[#C5A059] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#0A0A0A] hover:bg-[#d4af37] cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Stampa / PDF ({totalLabels})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
