import type { Metadata } from "next";
import { AppointmentBookingForm } from "@/components/appointments/AppointmentBookingForm";

export const metadata: Metadata = {
  title: "Prenota un Appuntamento — Gioielleria ORO&CO",
  description:
    "Prenota uno slot privato nella Gioielleria ORO&CO a San Marzano sul Sarno per Alta Gioielleria, creazioni su misura, riparazione orologi e bomboniere.",
};

interface AppointmentPageProps {
  searchParams: Promise<{ servizio?: string; brand?: string }>;
}

export default async function AppointmentPage({ searchParams }: AppointmentPageProps) {
  const params = await searchParams;
  const serviceId = typeof params.servizio === "string" ? params.servizio : undefined;
  const brand = typeof params.brand === "string" ? params.brand : undefined;

  return (
    <main className="bg-white py-12 sm:py-16">
      <section className="border-b border-[#DEDEDE] bg-[#F7F3EC] py-12 sm:py-14">
        <div className="container-luxe max-w-4xl text-center">
          <span className="eyebrow">Consulenza Privata al Banco</span>
          <h1 className="mt-3 font-serif text-3xl uppercase tracking-[0.08em] text-[#020202] sm:text-4xl">
            Prenota un Appuntamento in Gioielleria
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#4E423E] sm:text-base">
            Scegli giorno e fascia oraria per incontrare Renato, Patrizia e la nostra famiglia a
            San Marzano sul Sarno con accoglienza riservata.
          </p>
        </div>
      </section>

      <section className="container-luxe py-12 sm:py-16">
        <AppointmentBookingForm initialServiceId={serviceId} initialBrand={brand} />
      </section>
    </main>
  );
}
