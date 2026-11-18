"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  ids: string[];
  toggle: (productId: string) => void;
  add: (productId: string) => void;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (productId) =>
        set((state) => ({
          ids: state.ids.includes(productId)
            ? state.ids.filter((id) => id !== productId)
            : [...state.ids, productId],
        })),
      add: (productId) =>
        set((state) =>
          state.ids.includes(productId)
            ? state
            : { ids: [...state.ids, productId] },
        ),
      remove: (productId) =>
        set((state) => ({
          ids: state.ids.filter((id) => id !== productId),
        })),
      has: (productId) => get().ids.includes(productId),
      clear: () => set({ ids: [] }),
    }),
    {
      name: "oroeco-wishlist",
      partialize: (state) => ({ ids: state.ids }),
    },
  ),
);

export const selectWishlistCount = (state: WishlistState): number =>
  state.ids.length;
