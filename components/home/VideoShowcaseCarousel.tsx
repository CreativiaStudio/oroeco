"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Volume2, VolumeX, X } from "lucide-react";

export interface ShowcaseVideo {
  id: string;
  title: string;
  subtitle: string;
  videoUrl: string;
  posterUrl: string;
}

const R2_BASE = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev"
).replace(/\/+$/, "");

const SHOWCASE_VIDEOS: ShowcaseVideo[] = [
  {
    id: "anello-dd-02",
    title: "Anello Davite & Delucchi",
    subtitle: "Alta Gioielleria",
    videoUrl: `${R2_BASE}/client-media/video/anello-dd-02.mp4`,
    posterUrl: `${R2_BASE}/client-media/video/posters/anello-dd-02.webp`,
  },
  {
    id: "anello-golay-v2",
    title: "Anello Golay",
    subtitle: "Perle & Luce",
    videoUrl: `${R2_BASE}/client-media/video/anello-golay-v2.mp4`,
    posterUrl: `${R2_BASE}/client-media/video/posters/anello-golay-v2.webp`,
  },
  {
    id: "bracciali-rosa-rapido",
    title: "Bracciali Oro Rosa",
    subtitle: "Collezione Atelier",
    videoUrl: `${R2_BASE}/client-media/video/bracciali-rosa-rapido.mp4`,
    posterUrl: `${R2_BASE}/client-media/video/posters/bracciali-rosa-rapido.webp`,
  },
  {
    id: "rosa-orecchini-rapido",
    title: "Orecchini Oro Rosa",
    subtitle: "Dettagli Preziosi",
    videoUrl: `${R2_BASE}/client-media/video/rosa-orecchini-rapido.mp4`,
    posterUrl: `${R2_BASE}/client-media/video/posters/rosa-orecchini-rapido.webp`,
  },
  {
    id: "natale-2025",
    title: "Magia di Natale",
    subtitle: "Idee Regalo",
    videoUrl: `${R2_BASE}/client-media/video/natale-2025.mp4`,
    posterUrl: `${R2_BASE}/client-media/video/posters/natale-2025.webp`,
  },
  {
    id: "bomboniera",
    title: "Bomboniere d'Autore",
    subtitle: "Cerimonia & Casa",
    videoUrl: `${R2_BASE}/client-media/video/bomboniera.mp4`,
    posterUrl: `${R2_BASE}/client-media/video/posters/bomboniera.webp`,
  },
  {
    id: "instagram-reel-01",
    title: "L'Arte della Scelta",
    subtitle: "Dal Banco ORO&CO",
    videoUrl: `${R2_BASE}/client-media/video/instagram-reel-01.mp4`,
    posterUrl: `${R2_BASE}/client-media/video/posters/instagram-reel-01.webp`,
  },
  {
    id: "instagram-reel-02",
    title: "Dietro le Quinte",
    subtitle: "La Maison ORO&CO",
    videoUrl: `${R2_BASE}/client-media/video/instagram-reel-02.mp4`,
    posterUrl: `${R2_BASE}/client-media/video/posters/instagram-reel-02.webp`,
  },
];

// Duplichiamo la lista per lo scorrimento infinito senza cuciture
const TRACK_ITEMS = [...SHOWCASE_VIDEOS, ...SHOWCASE_VIDEOS];

export function VideoShowcaseCarousel() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const isPausedRef = useRef(false);
  const isVisibleRef = useRef(false);
  const manualTargetRef = useRef<number | null>(null);

  const [unmutedKey, setUnmutedKey] = useState<string | null>(null);
  const [activeLightbox, setActiveLightbox] = useState<ShowcaseVideo | null>(null);

  // Avvia/mette in pausa i video solo quando la sezione è visibile nel viewport
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? false;
        isVisibleRef.current = visible;
        videoRefs.current.forEach((vid) => {
          if (!vid) return;
          if (visible && !activeLightbox) {
            vid.play().catch(() => {});
          } else {
            vid.pause();
          }
        });
      },
      { rootMargin: "120px 0px", threshold: 0.05 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [activeLightbox]);

  // Scorrimento continuo fluido con requestAnimationFrame + loop infinito
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let rafId = 0;
    let lastTime = performance.now();
    const SPEED_PX_PER_SEC = 34; // scorrimento elegante e fluido

    const step = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const halfWidth = el.scrollWidth / 2;

      if (manualTargetRef.current !== null) {
        const diff = manualTargetRef.current - el.scrollLeft;
        if (Math.abs(diff) < 1.5) {
          el.scrollLeft = manualTargetRef.current;
          manualTargetRef.current = null;
        } else {
          el.scrollLeft += diff * Math.min(1, dt * 8.5);
        }
      } else if (!isPausedRef.current && isVisibleRef.current && !activeLightbox && halfWidth > 0) {
        el.scrollLeft += SPEED_PX_PER_SEC * dt;
      }

      if (halfWidth > 0) {
        if (el.scrollLeft >= halfWidth) {
          el.scrollLeft -= halfWidth;
          if (manualTargetRef.current !== null) {
            manualTargetRef.current -= halfWidth;
          }
        } else if (el.scrollLeft < 0) {
          el.scrollLeft += halfWidth;
          if (manualTargetRef.current !== null) {
            manualTargetRef.current += halfWidth;
          }
        }
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [activeLightbox]);

  const scrollByCard = useCallback((direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>("[data-video-card]");
    const cardStep = firstCard ? firstCard.offsetWidth + 20 : 320;
    const base = manualTargetRef.current ?? el.scrollLeft;
    manualTargetRef.current = base + direction * cardStep;
  }, []);

  const toggleMute = (e: React.MouseEvent, itemKey: string) => {
    e.stopPropagation();
    setUnmutedKey((prev) => (prev === itemKey ? null : itemKey));
  };

  useEffect(() => {
    if (!activeLightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeLightbox]);

  return (
    <section
      ref={sectionRef}
      aria-label="Video dalla Gioielleria ORO&CO"
      className="border-t border-[#dedede] bg-white py-14 sm:py-16"
    >
      <div className="container-luxe">
        {/* Intestazione minimal luxury */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#8a8a8a]">
              IN MOVIMENTO · L&apos;ATELIER
            </p>
            <h2 className="mt-2 font-serif text-2xl uppercase tracking-[0.12em] text-[#020202] sm:text-3xl">
              I Nostri Preziosi dal Vivo
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              aria-label="Scorri video a sinistra"
              className="flex h-10 w-10 items-center justify-center border border-[#dedede] bg-white text-[#020202] transition-colors hover:border-gold hover:text-gold"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              aria-label="Scorri video a destra"
              className="flex h-10 w-10 items-center justify-center border border-[#dedede] bg-white text-[#020202] transition-colors hover:border-gold hover:text-gold"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Traccia carosello: 4 card visibili su desktop, 2 su tablet, 1.25 su mobile */}
        <div
          ref={scrollerRef}
          onMouseEnter={() => {
            isPausedRef.current = true;
          }}
          onMouseLeave={() => {
            isPausedRef.current = false;
          }}
          onTouchStart={() => {
            isPausedRef.current = true;
          }}
          onTouchEnd={() => {
            isPausedRef.current = false;
          }}
          className="no-scrollbar flex gap-5 overflow-x-auto pb-2 select-none"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {TRACK_ITEMS.map((video, idx) => {
            const itemKey = `${video.id}-${idx}`;
            const isUnmuted = unmutedKey === itemKey;
            return (
              <article
                key={itemKey}
                data-video-card
                onClick={() => setActiveLightbox(video)}
                className="group relative aspect-[9/16] w-[72vw] shrink-0 cursor-pointer overflow-hidden border border-[#eaeaea] bg-[#0a0a0a] transition-all duration-500 hover:border-gold/70 sm:w-[calc((100%-20px)/2)] lg:w-[calc((100%-60px)/4)]"
              >
                <video
                  ref={(el) => {
                    videoRefs.current[idx] = el;
                  }}
                  src={video.videoUrl}
                  poster={video.posterUrl}
                  muted={!isUnmuted}
                  loop
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />

                {/* Sfumatura luxury inferiore */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                {/* Controlli discreti in alto a destra */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => toggleMute(e, itemKey)}
                    aria-label={isUnmuted ? "Disattiva audio" : "Attiva audio"}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-gold hover:text-[#020202]"
                  >
                    {isUnmuted ? (
                      <Volume2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    ) : (
                      <VolumeX className="h-3.5 w-3.5" strokeWidth={1.75} />
                    )}
                  </button>
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
                  >
                    <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </span>
                </div>

                {/* Didascalia elegante */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-4 text-left">
                  <p className="text-[10px] uppercase tracking-[0.26em] text-[#e7d9b8]">
                    {video.subtitle}
                  </p>
                  <h3 className="mt-1 font-serif text-base uppercase tracking-[0.08em] text-white">
                    {video.title}
                  </h3>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Lightbox full-screen al click */}
      {activeLightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeLightbox.title}
          onClick={() => setActiveLightbox(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[90vh] w-full max-w-[420px] flex-col overflow-hidden border border-gold/40 bg-[#0a0a0a] shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setActiveLightbox(null)}
              aria-label="Chiudi video"
              className="absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-gold hover:text-[#020202]"
            >
              <X className="h-4 w-4" />
            </button>
            <video
              src={activeLightbox.videoUrl}
              poster={activeLightbox.posterUrl}
              controls
              autoPlay
              playsInline
              className="max-h-[80vh] w-full bg-black object-contain"
            />
            <div className="border-t border-white/10 bg-[#0a0a0a] px-5 py-3.5">
              <p className="text-[10px] uppercase tracking-[0.26em] text-[#c5a059]">
                {activeLightbox.subtitle}
              </p>
              <p className="mt-0.5 font-serif text-base uppercase tracking-[0.08em] text-white">
                {activeLightbox.title}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
