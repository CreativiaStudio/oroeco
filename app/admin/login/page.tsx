import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { isAdminAuthConfigured, sanitizeAdminNextPath } from "@/lib/adminAuth";

export const metadata: Metadata = {
  title: "Accesso Gestionale — ORO&CO Gioielleria",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = sanitizeAdminNextPath(rawNext);
  const configured = isAdminAuthConfigured();

  return <AdminLoginForm nextPath={nextPath} isConfigured={configured} />;
}
