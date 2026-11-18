import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Gestionale ORO&CO — Magazzino, Fatture SDI & Ordini",
  description:
    "Dashboard gestionale ORO&CO: KPI magazzino, catalogo gioielli, fatture fornitori via SDI, ordini e-commerce con spedizioni assicurate e scatola nera operatori.",
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  return <AdminDashboard />;
}
