"use client";

import { getStoredConsent, getVisitorId } from "@/lib/consent";
import type { Product } from "@/types/product";

interface EcommerceItem {
  item_id: string;
  item_name: string;
  item_brand: string;
  item_category: string;
  price: number;
  quantity?: number;
}

function mapProductToItem(product: Product, quantity = 1): EcommerceItem {
  return {
    item_id: product.sku || product.id,
    item_name: product.name,
    item_brand: product.brand,
    item_category: product.category,
    price: product.price,
    quantity,
  };
}

/** Invia evento a dataLayer (GA4 / GTM) rispettando Google Consent Mode v2 */
function pushToDataLayer(event: string, ecommerceData: Record<string, any>) {
  if (typeof window === "undefined") return;
  const w = window as any;
  w.dataLayer = w.dataLayer || [];

  // Reset ecommerce object to prevent contamination between events
  w.dataLayer.push({ ecommerce: null });
  w.dataLayer.push({
    event,
    ...ecommerceData,
  });
}

/** Invia evento al nostro endpoint di tracking server-side / CAPI in background */
async function sendServerEvent(eventName: string, payload: Record<string, any>) {
  if (typeof window === "undefined") return;
  try {
    const consent = getStoredConsent();
    const visitorId = getVisitorId();

    const body = JSON.stringify({
      eventName,
      visitorId,
      consentId: consent?.consentId || null,
      consentCategories: consent?.categories || null,
      payload,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer,
    });

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/tracking/event", blob);
    } else {
      fetch("/api/tracking/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch (e) {
    // Silent fail to avoid disrupting user experience
  }
}

/** Traccia visualizzazione lista prodotti (Catalog / Collection) */
export function trackViewItemList(items: Product[], listName = "Catalog") {
  const ecommerceItems = items.slice(0, 20).map((p, idx) => ({
    ...mapProductToItem(p),
    index: idx + 1,
    item_list_name: listName,
  }));

  pushToDataLayer("view_item_list", {
    ecommerce: {
      item_list_name: listName,
      items: ecommerceItems,
    },
  });

  sendServerEvent("view_item_list", {
    listName,
    itemCount: items.length,
  });
}

/** Traccia visualizzazione scheda prodotto (PDP) */
export function trackViewItem(product: Product) {
  const item = mapProductToItem(product);

  pushToDataLayer("view_item", {
    ecommerce: {
      currency: "EUR",
      value: product.price,
      items: [item],
    },
  });

  sendServerEvent("view_item", {
    product: item,
  });
}

/** Traccia aggiunta al carrello */
export function trackAddToCart(product: Product, quantity = 1) {
  const item = mapProductToItem(product, quantity);

  pushToDataLayer("add_to_cart", {
    ecommerce: {
      currency: "EUR",
      value: product.price * quantity,
      items: [item],
    },
  });

  sendServerEvent("add_to_cart", {
    product: item,
    quantity,
    totalValue: product.price * quantity,
  });
}

/** Traccia rimozione dal carrello */
export function trackRemoveFromCart(product: Product, quantity = 1) {
  const item = mapProductToItem(product, quantity);

  pushToDataLayer("remove_from_cart", {
    ecommerce: {
      currency: "EUR",
      value: product.price * quantity,
      items: [item],
    },
  });

  sendServerEvent("remove_from_cart", {
    product: item,
    quantity,
  });
}

/** Traccia inizio checkout */
export function trackBeginCheckout(items: Array<{ product: Product; quantity: number }>, totalValue: number) {
  const ecommerceItems = items.map(({ product, quantity }) => mapProductToItem(product, quantity));

  pushToDataLayer("begin_checkout", {
    ecommerce: {
      currency: "EUR",
      value: totalValue,
      items: ecommerceItems,
    },
  });

  sendServerEvent("begin_checkout", {
    items: ecommerceItems,
    value: totalValue,
  });
}

/** Traccia acquisto completato */
export function trackPurchase(order: {
  orderId: string;
  total: number;
  tax?: number;
  shipping?: number;
  items: Array<{ product: Product; quantity: number }>;
}) {
  const ecommerceItems = order.items.map(({ product, quantity }) => mapProductToItem(product, quantity));

  pushToDataLayer("purchase", {
    ecommerce: {
      transaction_id: order.orderId,
      value: order.total,
      tax: order.tax || 0,
      shipping: order.shipping || 0,
      currency: "EUR",
      items: ecommerceItems,
    },
  });

  sendServerEvent("purchase", {
    orderId: order.orderId,
    total: order.total,
    items: ecommerceItems,
  });
}
