import Stripe from "stripe";

export const FREE_SHIPPING_THRESHOLD = 150;
export const STANDARD_SHIPPING_COST = 9.9;

let cachedStripe: Stripe | null = null;

export function isStripeConfigured(): boolean {
  const key = (process.env.STRIPE_SECRET_KEY || "").trim();
  return key.startsWith("sk_test_") || key.startsWith("sk_live_") || key.startsWith("rk_");
}

export function getStripeClient(): Stripe {
  const secretKey = (process.env.STRIPE_SECRET_KEY || "").trim();
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY non configurata sul server.");
  }
  if (!cachedStripe) {
    cachedStripe = new Stripe(secretKey);
  }
  return cachedStripe;
}
