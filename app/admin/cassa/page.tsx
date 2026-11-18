import type { Metadata } from "next";
import { CassaTerminal } from "@/components/admin/CassaTerminal";

export const metadata: Metadata = {
  title: "Cassa Banco — Terminale Punto Vendita",
  description:
    "Terminale di cassa banco ORO&CO con lettura barcode, scontrino telematico Axon Aura RT e fattura elettronica SDI.",
  robots: { index: false, follow: false },
};

export default function CassaPage() {
  return <CassaTerminal />;
}
