import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";

interface Crumb {
  label: string;
  href?: string;
}

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  breadcrumb?: Crumb[];
  align?: "left" | "center";
}

/** Intestazione editoriale per le pagine di categoria. */
export function PageHero({
  eyebrow,
  title,
  description,
  image,
  breadcrumb,
  align = "center",
}: PageHeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-ink">
      <SmartImage
        src={image}
        alt={title}
        className="absolute inset-0 h-full w-full"
        sizes="100vw"
        imageClassName="object-cover"
        fallbackLabel={title}
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/88 via-ink/65 to-ink/45" />

      <div
        className={
          align === "center"
            ? "container-luxe relative flex min-h-[46vh] flex-col items-center justify-center py-20 text-center"
            : "container-luxe relative flex min-h-[46vh] flex-col justify-center py-20"
        }
      >
        {breadcrumb?.length ? (
          <nav
            aria-label="Percorso"
            className="mb-6 flex items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.18em] text-white/55"
          >
            {breadcrumb.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                {index > 0 ? (
                  <ChevronRight className="h-3 w-3 text-white/35" strokeWidth={2} />
                ) : null}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="transition-colors hover:text-gold-soft"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-gold-soft">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}

        <span className="eyebrow text-gold-soft">{eyebrow}</span>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-white sm:text-5xl lg:text-[3.5rem]">
          {title}
        </h1>
        <p
          className={
            align === "center"
              ? "mt-5 max-w-2xl text-pretty text-sm leading-relaxed text-white/70 sm:text-base"
              : "mt-5 max-w-2xl text-pretty text-sm leading-relaxed text-white/70 sm:text-base"
          }
        >
          {description}
        </p>
      </div>
    </section>
  );
}
