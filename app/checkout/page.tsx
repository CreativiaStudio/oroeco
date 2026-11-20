import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout Protetto — ORO&CO Gioielleria",
  description:
    "Concludi il tuo ordine ORO&CO in totale sicurezza con Carta, Apple Pay, PayPal o Klarna in 3 rate.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <CheckoutForm />;
}
