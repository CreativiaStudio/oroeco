"use client";

import { CreditCard } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface InstallmentBadgeProps {
  price: number;
  className?: string;
  compact?: boolean;
}

export function InstallmentBadge({
  price,
  className = "",
  compact = false,
}: InstallmentBadgeProps) {
  if (price < 100) return null;

  const installmentAmount = price / 3;

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 text-xs text-graphite ${className}`}>
        <CreditCard className="h-3.5 w-3.5 text-gold shrink-0" />
        <span>
          3 rate da <strong>{formatPrice(installmentAmount)}</strong>
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-sm border border-line bg-pearl/60 px-3.5 py-2.5 text-xs text-graphite ${className}`}
    >
      <CreditCard className="h-4 w-4 text-gold shrink-0" />
      <span>
        oppure in <strong>3 rate da {formatPrice(installmentAmount)}</strong> senza interessi
      </span>
      <div className="flex items-center gap-1.5 ml-auto text-[0.62rem] uppercase font-semibold tracking-wider text-graphite-soft">
        <span className="rounded bg-pink-100 px-1.5 py-0.5 text-pink-700">Klarna</span>
        <span className="rounded bg-sky-100 px-1.5 py-0.5 text-sky-800">PayPal</span>
      </div>
    </div>
  );
}
