"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AccountDrawer } from "@/components/layout/AccountDrawer";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";

export function StorefrontShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isStandaloneAdmin =
    pathname?.startsWith("/admin") || pathname?.startsWith("/cassa");

  if (isStandaloneAdmin) {
    return <>{children}</>;
  }

  return (
    <SmoothScrollProvider>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <AccountDrawer />
      <CookieConsentBanner />
    </SmoothScrollProvider>
  );
}
