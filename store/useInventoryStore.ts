"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { findProductByCode, getAllProducts } from "@/lib/catalog";
import type { InventoryMovementType, InventoryTransaction } from "@/types/cassa";
import type { Product } from "@/types/product";

interface InventoryState {
  /** Mappa stock per productId: { [productId]: quantita } */
  stocks: Record<string, number>;
  /** Registro cronologico transazioni di magazzino */
  transactions: InventoryTransaction[];
  /** Data ultimo aggiornamento dello store */
  lastUpdated: string;

  /** Restituisce la giacenza attuale del prodotto (cercando per Barcode, SKU o Product ID) */
  getStock: (barcodeOrSkuOrId: string) => number;

  /** Verifica se il prodotto ha almeno 1 pezzo disponibile */
  isInStock: (barcodeOrSkuOrId: string) => boolean;

  /** Scala la giacenza di un singolo articolo registrando la transazione */
  depleteStock: (
    barcodeOrSku: string,
    quantity: number,
    saleReference?: string,
    operator?: string,
  ) => boolean;

  /** Scala in batch una lista di righe scontrino al completamento della vendita */
  batchDepleteStock: (
    items: { barcodeOrSku: string; quantity: number; product?: Product }[],
    saleReference: string,
    operator: string,
  ) => boolean;

  /** Carica merce a magazzino (riassortimento fornitore) */
  restock: (
    barcodeOrSku: string,
    quantity: number,
    reference?: string,
    operator?: string,
  ) => boolean;

  /** Ripristina le giacenze allo stato iniziale definito nel catalogo */
  resetToCatalog: () => void;
  resetInventory: () => void;

  /** Restituisce la cronologia completa delle movimentazioni */
  getTransactionHistory: () => InventoryTransaction[];
}

/** Risolve un prodotto dal catalogo tramite barcode, SKU o id */
function resolveProduct(barcodeOrSkuOrId: string): Product | undefined {
  if (!barcodeOrSkuOrId) return undefined;
  const byCode = findProductByCode(barcodeOrSkuOrId);
  if (byCode) return byCode;

  const catalog = getAllProducts();
  return catalog.find(
    (p) =>
      p.id === barcodeOrSkuOrId ||
      p.sku.toLowerCase() === barcodeOrSkuOrId.toLowerCase() ||
      p.barcode === barcodeOrSkuOrId,
  );
}

/** Inizializza la mappa scorte leggendo le quantità dal catalogo statico */
function getInitialStockMap(): Record<string, number> {
  const map: Record<string, number> = {};
  const all = getAllProducts();
  for (const p of all) {
    map[p.id] = p.stockQuantity;
  }
  return map;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      stocks: getInitialStockMap(),
      transactions: [],
      lastUpdated: new Date().toISOString(),

      getStock: (barcodeOrSkuOrId: string) => {
        const product = resolveProduct(barcodeOrSkuOrId);
        if (!product) return 0;
        const currentStocks = get().stocks;
        if (typeof currentStocks[product.id] === "number") {
          return currentStocks[product.id];
        }
        return product.stockQuantity;
      },

      isInStock: (barcodeOrSkuOrId: string) => {
        return get().getStock(barcodeOrSkuOrId) > 0;
      },

      depleteStock: (
        barcodeOrSku: string,
        quantity: number,
        saleReference = `SALE-${Date.now()}`,
        operator = "Renato",
      ) => {
        const product = resolveProduct(barcodeOrSku);
        if (!product) return false;

        const currentQty = get().getStock(product.id);
        const newQty = Math.max(0, currentQty - quantity);

        const tx: InventoryTransaction = {
          id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          productId: product.id,
          sku: product.sku,
          barcode: product.barcode,
          productName: product.name,
          changeQuantity: -quantity,
          previousQuantity: currentQty,
          newQuantity: newQty,
          movementType: "pos_instore_sale",
          referenceId: saleReference,
          operator,
          notes: `Scarico vendita banco Cassa Oroeco (${quantity} pz)`,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          stocks: {
            ...state.stocks,
            [product.id]: newQty,
          },
          transactions: [tx, ...state.transactions].slice(0, 500),
          lastUpdated: new Date().toISOString(),
        }));

        return true;
      },

      batchDepleteStock: (
        items: { barcodeOrSku: string; quantity: number; product?: Product }[],
        saleReference: string,
        operator: string,
      ) => {
        const state = get();
        const nextStocks = { ...state.stocks };
        const newTxs: InventoryTransaction[] = [];
        const now = new Date().toISOString();

        for (const item of items) {
          const product = item.product || resolveProduct(item.barcodeOrSku);
          if (!product) continue;

          const currentQty =
            typeof nextStocks[product.id] === "number"
              ? nextStocks[product.id]
              : product.stockQuantity;
          const newQty = Math.max(0, currentQty - item.quantity);
          nextStocks[product.id] = newQty;

          newTxs.push({
            id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            productId: product.id,
            sku: product.sku,
            barcode: product.barcode,
            productName: product.name,
            changeQuantity: -item.quantity,
            previousQuantity: currentQty,
            newQuantity: newQty,
            movementType: "pos_instore_sale",
            referenceId: saleReference,
            operator,
            notes: `Vendita POS completata (${item.quantity} pz)`,
            timestamp: now,
          });
        }

        set((prevState) => ({
          stocks: nextStocks,
          transactions: [...newTxs, ...prevState.transactions].slice(0, 500),
          lastUpdated: now,
        }));

        return true;
      },

      restock: (
        barcodeOrSku: string,
        quantity: number,
        reference = `RESTOCK-${Date.now()}`,
        operator = "Renato",
      ) => {
        const product = resolveProduct(barcodeOrSku);
        if (!product) return false;

        const currentQty = get().getStock(product.id);
        const newQty = currentQty + quantity;

        const tx: InventoryTransaction = {
          id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          productId: product.id,
          sku: product.sku,
          barcode: product.barcode,
          productName: product.name,
          changeQuantity: quantity,
          previousQuantity: currentQty,
          newQuantity: newQty,
          movementType: "restock",
          referenceId: reference,
          operator,
          notes: `Carico merce gioielleria ORO&CO (+${quantity} pz)`,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          stocks: {
            ...state.stocks,
            [product.id]: newQty,
          },
          transactions: [tx, ...state.transactions].slice(0, 500),
          lastUpdated: new Date().toISOString(),
        }));

        return true;
      },

      resetToCatalog: () => {
        const initial = getInitialStockMap();
        const tx: InventoryTransaction = {
          id: `tx-${Date.now()}-reset`,
          productId: "ALL",
          sku: "ALL",
          barcode: "ALL",
          productName: "Tutto il catalogo ORO&CO",
          changeQuantity: 0,
          previousQuantity: 0,
          newQuantity: 0,
          movementType: "manual_adjustment",
          referenceId: "CATALOG-RESET",
          operator: "Renato",
          notes: "Ripristino totale scorte da anagrafica iniziale catalogo",
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          stocks: initial,
          transactions: [tx, ...state.transactions].slice(0, 500),
          lastUpdated: new Date().toISOString(),
        }));
      },

      resetInventory: () => {
        get().resetToCatalog();
      },

      getTransactionHistory: () => {
        return get().transactions;
      },
    }),
    {
      name: "oroeco_inventory_stock",
      partialize: (state) => ({
        stocks: state.stocks,
        transactions: state.transactions,
        lastUpdated: state.lastUpdated,
      }),
    },
  ),
);
