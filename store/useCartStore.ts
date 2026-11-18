"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/types/product";

/** Soglia di spedizione gratuita (euro). */
export const FREE_SHIPPING_THRESHOLD = 150;
/** Costo di spedizione sotto soglia (euro). */
export const SHIPPING_COST = 9.9;

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  /** Apre il drawer del carrello. */
  openCart: () => void;
  /** Chiude il drawer del carrello. */
  closeCart: () => void;
  toggleCart: () => void;
  /** Aggiunge un prodotto (o incrementa la quantità). */
  addItem: (product: Product, quantity?: number) => void;
  /** Rimuove completamente una riga. */
  removeItem: (productId: string) => void;
  /** Incrementa la quantità di una riga. */
  increment: (productId: string) => void;
  /** Decrementa la quantità (rimuove la riga a zero). */
  decrement: (productId: string) => void;
  /** Svuota il carrello. */
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (product, quantity = 1) =>
        set((state) => {
          const existing = state.items.find(
            (item) => item.product.id === product.id,
          );
          if (existing) {
            return {
              isOpen: true,
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item,
              ),
            };
          }
          return {
            isOpen: true,
            items: [...state.items, { product, quantity }],
          };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        })),

      increment: (productId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        })),

      decrement: (productId) =>
        set((state) => ({
          items: state.items.flatMap((item) => {
            if (item.product.id !== productId) return [item];
            if (item.quantity <= 1) return [];
            return [{ ...item, quantity: item.quantity - 1 }];
          }),
        })),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "oroeco-cart",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

/* ----------------------------- Selettori ----------------------------- */

export const selectTotalItems = (state: CartState): number =>
  state.items.reduce((total, item) => total + item.quantity, 0);

export const selectSubtotal = (state: CartState): number =>
  state.items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  freeShipping: boolean;
  remainingForFreeShipping: number;
  progress: number;
}

/** Calcola i totali del carrello a partire dalle righe. */
export function calculateTotals(items: CartItem[]): CartTotals {
  const subtotal = items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0;
  const shipping = freeShipping ? 0 : SHIPPING_COST;
  const remainingForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - subtotal,
  );
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return {
    itemCount,
    subtotal,
    shipping,
    total: subtotal + shipping,
    freeShipping,
    remainingForFreeShipping,
    progress,
  };
}

/** Selettore memoizzabile dei totali. */
export const selectTotals = (state: CartState): CartTotals =>
  calculateTotals(state.items);
