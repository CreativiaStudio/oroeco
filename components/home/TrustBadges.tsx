import { BadgeCheck, Gift, ShieldCheck, Store } from "lucide-react";

const badges = [
  {
    icon: BadgeCheck,
    title: "Autenticità e Certificato",
    text: "Ogni prezioso è corredato di certificato ufficiale e garanzia.",
  },
  {
    icon: ShieldCheck,
    title: "Spedizione Assicurata",
    text: "Consegna blindata e tracciata in 24/48h su tutto il territorio.",
  },
  {
    icon: Gift,
    title: "Confezione di Lusso",
    text: "Astuccio firmato ORO&CO e biglietto personalizzabile in omaggio.",
  },
  {
    icon: Store,
    title: "Assistenza al Banco",
    text: "Consulenza e servizio post-vendita direttamente in gioielleria.",
  },
];

/** Quattro pilastri di garanzia. */
export function TrustBadges() {
  return (
    <section className="border-t border-[#dedede] bg-[#f7f3ec]">
      <div className="container-luxe grid grid-cols-1 divide-y divide-[#dedede] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x lg:divide-[#dedede]">
        {badges.map((badge) => (
          <div
            key={badge.title}
            className="flex flex-col items-center gap-3 px-6 py-10 text-center"
          >
            <badge.icon className="h-6 w-6 text-gold" strokeWidth={1.25} />
            <h3 className="font-serif text-base uppercase tracking-[0.14em] text-[#020202]">
              {badge.title}
            </h3>
            <p className="max-w-[240px] text-xs leading-relaxed text-[#4e423e]">
              {badge.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
