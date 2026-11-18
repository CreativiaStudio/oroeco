import type { Metadata } from "next";
import { WishlistView } from "@/components/product/WishlistView";

export const metadata: Metadata = {
  title: "Wishlist — I tuoi preferiti",
  description:
    "I gioielli, gli orologi e gli accessori che hai salvato nella tua wishlist ORO&CO.",
};

export default function WishlistPage() {
  return (
    <div className="container-luxe py-16 sm:py-20">
      <header className="mb-10 space-y-3 text-center">
        <span className="eyebrow">I tuoi preferiti</span>
        <h1 className="font-serif text-4xl text-ink sm:text-5xl">Wishlist</h1>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-graphite">
          Conserva qui i pezzi che ami: potrai confrontarli con calma e
          ritrovarli quando tornerai in gioielleria.
        </p>
      </header>
      <WishlistView />
    </div>
  );
}
