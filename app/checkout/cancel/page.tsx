import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { STORE_CONTACT } from "@/lib/brandPolicy";

export const metadata: Metadata = {
  title: "Pagamento Annullato — ORO&CO Gioielleria",
  robots: { index: false, follow: false },
};

export default function CheckoutCancelPage() {
  return (
    <div className="container-luxe py-16 sm:py-24">
      <div className="mx-auto max-w-xl rounded-sm border border-[#DEDEDE] bg-[#F7F3EC] p-8 text-center sm:p-12">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[#DEDEDE] bg-white text-[#9A7D43]">
          <ShieldAlert className="h-7 w-7" strokeWidth={1.6} />
        </span>

        <h1 className="mt-5 font-serif text-3xl text-ink">Pagamento non completato</h1>
        <p className="mt-3 text-sm leading-relaxed text-graphite">
          Nessun importo è stato addebitato e gli articoli selezionati sono ancora salvati nel tuo
          carrello. Puoi riprovare in qualsiasi momento o chiedere assistenza al nostro staff.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/checkout"
            className="inline-flex h-12 items-center justify-center rounded-sm bg-[#020202] px-7 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-gold"
          >
            Torna al Checkout
          </Link>
          <Link
            href="/gioielli"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-sm border border-[#DEDEDE] bg-white px-6 text-xs font-semibold uppercase tracking-[0.18em] text-ink transition-colors hover:border-gold hover:text-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Continua lo Shopping
          </Link>
        </div>

        <p className="mt-6 text-xs text-graphite-soft">
          Serve aiuto? Scrivici su{" "}
          <a
            href={STORE_CONTACT.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gold"
          >
            WhatsApp ({STORE_CONTACT.whatsappDisplay})
          </a>
          .
        </p>
      </div>
    </div>
  );
}
