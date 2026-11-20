import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { CategoryExplorer } from "@/components/catalog/CategoryExplorer";
import { getBrandLogoCardOpticalClass, getBrandLogoPath } from "@/lib/brandLogos";
import {
  isInStoreOnlyBrand,
  isRemovedBrand,
  OFFICIAL_STORE_HOURS,
  STORE_CONTACT,
} from "@/lib/brandPolicy";
import { getAllBrands, getBrandBySlug } from "@/lib/catalog";
import { getLiveProductsByBrand } from "@/lib/liveCatalog";

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllBrands()
    .filter((b) => !isRemovedBrand(b.slug))
    .map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);

  if (!brand || isRemovedBrand(brand.slug)) {
    return { title: "Marchio non trovato" };
  }

  const description = isInStoreOnlyBrand(brand.slug)
    ? `${brand.name} è disponibile esclusivamente in gioielleria ORO&CO a San Marzano sul Sarno tramite appuntamento.`
    : brand.description ?? `Scopri le creazioni ${brand.name} selezionate da ORO&CO.`;

  return {
    title: `${brand.name} — Brand`,
    description,
  };
}

export default async function BrandDetailPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);

  if (!brand || isRemovedBrand(brand.slug)) {
    notFound();
  }

  const inStoreOnly = isInStoreOnlyBrand(brand.slug);
  const brandProducts = inStoreOnly ? [] : await getLiveProductsByBrand(brand.slug);

  const filters = Array.from(
    new Map(
      brandProducts.map((product) => [
        product.subcategory,
        product.subcategoryLabel,
      ]),
    ).entries(),
  ).map(([value, label]) => ({ value, label }));

  const eyebrow = inStoreOnly
    ? [brand.country, "Disponibile esclusivamente in gioielleria"]
        .filter(Boolean)
        .join(" · ")
    : brandProducts.length === 0
      ? [brand.country, "Collezione in aggiornamento"]
          .filter(Boolean)
          .join(" · ")
      : [brand.country, `${brandProducts.length} creazioni`]
          .filter(Boolean)
          .join(" · ");

  const appointmentHref = `${STORE_CONTACT.whatsappHref}?text=${encodeURIComponent(
    `Ciao ORO&CO, vorrei prenotare un appuntamento in gioielleria per visionare la collezione ${brand.name}.`,
  )}`;

  const inquiryHref = `${STORE_CONTACT.whatsappHref}?text=${encodeURIComponent(
    `Ciao ORO&CO, vorrei conoscere la disponibilità in gioielleria per gli articoli ${brand.name}.`,
  )}`;

  return (
    <>
      <section className="border-b border-[#dedede] bg-[#f7f3ec] py-14 sm:py-16">
        <div className="container-luxe">
          <nav
            aria-label="Percorso"
            className="flex flex-wrap items-center gap-2 text-[0.62rem] uppercase tracking-[0.16em] text-[#8a8a8a]"
          >
            <Link href="/" className="transition-colors hover:text-gold">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/brand" className="transition-colors hover:text-gold">
              Brand
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-gold">{brand.name}</span>
          </nav>

          <Link
            href="/brand"
            className="mt-6 inline-flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.2em] text-[#5a5a5a] transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.6} />
            Tutti i marchi
          </Link>

          <div className="mt-8 max-w-2xl">
            <img
              src={getBrandLogoPath(brand.slug)}
              alt={brand.name}
              className={`${getBrandLogoCardOpticalClass(brand.slug)} w-auto max-w-[240px] object-contain`}
            />
            <h1 className="sr-only">{brand.name}</h1>
            <p className="mt-6 text-[0.68rem] uppercase tracking-[0.25em] text-gold">
              {eyebrow}
            </p>
            {brand.description ? (
              <p className="mt-4 text-sm leading-relaxed text-[#5a5a5a]">
                {brand.description}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {inStoreOnly ? (
        <section className="bg-white py-16 sm:py-24">
          <div className="container-luxe">
            <div className="grid gap-10 border border-[#dedede] bg-[#faf8f4] p-8 sm:p-12 lg:grid-cols-[1.35fr_1fr] lg:items-center">
              <div className="space-y-5">
                <span className="inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-gold">
                  <Calendar className="h-4 w-4" strokeWidth={1.6} />
                  Consulenza &amp; Appuntamento in Gioielleria
                </span>
                <h2 className="font-serif text-2xl leading-snug text-[#020202] sm:text-3xl">
                  {brand.name} — Disponibile esclusivamente in gioielleria
                </h2>
                <p className="text-sm leading-relaxed text-[#4e423e] sm:text-base">
                  Le creazioni di alta gioielleria in oro prezioso, diamanti e
                  perle coltivate firmate {brand.name} non sono acquistabili
                  online per garantire la massima sicurezza. Ti accogliamo al
                  banco a San Marzano sul Sarno su appuntamento per visionare la
                  collezione dal vivo con consulenza gemmologica dedicata.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <a
                    href={appointmentHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center gap-2.5 rounded-[2px] bg-[#020202] px-6 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-gold"
                  >
                    <MessageCircle className="h-4 w-4" strokeWidth={1.6} />
                    Prenota appuntamento su WhatsApp
                  </a>
                  <a
                    href={STORE_CONTACT.phoneHref}
                    className="inline-flex h-12 items-center gap-2.5 rounded-[2px] border border-[#020202] bg-white px-6 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#020202] transition-colors hover:bg-[#020202] hover:text-white"
                  >
                    <Phone className="h-4 w-4" strokeWidth={1.6} />
                    Chiama {STORE_CONTACT.phoneDisplay}
                  </a>
                </div>
              </div>

              <div className="space-y-5 border-t border-[#e5dfd4] pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                <div className="flex items-start gap-3">
                  <MapPin
                    className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                    strokeWidth={1.6}
                  />
                  <div>
                    <p className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-[#020202]">
                      Indirizzo Gioielleria
                    </p>
                    <p className="mt-1 text-sm text-[#4e423e]">
                      {STORE_CONTACT.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock
                    className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                    strokeWidth={1.6}
                  />
                  <div>
                    <p className="text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-[#020202]">
                      Orari di Apertura
                    </p>
                    <p className="mt-1 text-sm text-[#4e423e]">
                      {OFFICIAL_STORE_HOURS.monday}
                    </p>
                    <p className="text-sm text-[#4e423e]">
                      {OFFICIAL_STORE_HOURS.tueSat}
                    </p>
                    <p className="text-sm font-medium text-gold">
                      {OFFICIAL_STORE_HOURS.december}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-[#e5dfd4] pt-4 text-xs text-[#6b615c]">
                  <ShieldCheck
                    className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                    strokeWidth={1.6}
                  />
                  <span>
                    Certificato ufficiale di autenticità e consulenza diretta
                    con Renato, Patrizia e famiglia.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : brandProducts.length === 0 ? (
        <section className="bg-white py-16 sm:py-24">
          <div className="container-luxe">
            <div className="mx-auto max-w-2xl border border-[#dedede] bg-[#faf8f4] p-8 text-center sm:p-12">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-gold">
                In Gioielleria &amp; Su Richiesta
              </p>
              <h2 className="mt-3 font-serif text-2xl text-[#020202] sm:text-3xl">
                Collezione {brand.name} disponibile in gioielleria
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#4e423e]">
                Il catalogo online di {brand.name} è in aggiornamento: gli
                articoli sono già disponibili presso la nostra gioielleria a
                San Marzano sul Sarno. Scrivici su WhatsApp o chiamaci per
                verificare disponibilità immediata e prezzo.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
                <a
                  href={inquiryHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-[2px] bg-[#020202] px-6 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-gold"
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={1.6} />
                  Richiedi disponibilità su WhatsApp
                </a>
                <a
                  href={STORE_CONTACT.phoneHref}
                  className="inline-flex h-12 items-center gap-2 rounded-[2px] border border-[#020202] bg-white px-6 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#020202] transition-colors hover:bg-[#020202] hover:text-white"
                >
                  <Phone className="h-4 w-4" strokeWidth={1.6} />
                  Chiama {STORE_CONTACT.phoneDisplay}
                </a>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <CategoryExplorer
          products={brandProducts}
          filters={filters}
          filterType="subcategory"
          filterLabel="Tipologia"
        />
      )}
    </>
  );
}
