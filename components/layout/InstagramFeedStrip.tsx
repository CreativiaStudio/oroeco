"use client";

import { useCallback, useEffect, useState } from "react";
import { Play, RefreshCw } from "lucide-react";

import { SmartImage } from "@/components/ui/SmartImage";
import type { InstagramFeedPayload, InstagramPost } from "@/lib/instagramSync";
import seedFeed from "@/data/instagram-feed.json";

const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/gioielleria_oroeco/";

/**
 * Striscia Instagram della Maison: mostra subito lo snapshot locale
 * (data/instagram-feed.json) e si aggiorna in tempo reale chiamando
 * /api/instagram/feed, con pulsante "Sincronizza feed" per il refresh forzato.
 */
export function InstagramFeedStrip() {
  const [feed, setFeed] = useState<InstagramFeedPayload>({
    source: seedFeed.source as InstagramFeedPayload["source"],
    syncedAt: seedFeed.syncedAt,
    username: seedFeed.username,
    posts: seedFeed.posts as InstagramPost[],
  });
  const [loading, setLoading] = useState(false);

  const loadFeed = useCallback(async (forceRefresh: boolean) => {
    setLoading(true);
    try {
      const url = forceRefresh
        ? "/api/instagram/feed?refresh=1"
        : "/api/instagram/feed";
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) return;

      const data = (await response.json()) as Partial<InstagramFeedPayload>;
      if (Array.isArray(data.posts) && data.posts.length > 0) {
        setFeed((previous) => ({
          source: data.source ?? previous.source,
          syncedAt: data.syncedAt ?? previous.syncedAt,
          username: data.username ?? previous.username,
          posts: data.posts as InstagramPost[],
        }));
      }
    } catch {
      // Rete non disponibile: mantiene in schermo lo snapshot corrente.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFeed(false);
  }, [loadFeed]);

  const handleRefresh = useCallback(() => {
    void loadFeed(true);
  }, [loadFeed]);

  return (
    <section className="bg-[#f7f3ec] border-t border-[#dedede] py-14 text-[#020202]">
      <div className="container-luxe text-center">
        <span className="eyebrow text-[#a58a4d]">LA MAISON SU INSTAGRAM</span>
        <h2 className="mt-3 font-serif text-2xl sm:text-3xl uppercase tracking-[0.14em] text-[#020202]">
          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-[#a58a4d]"
          >
            @gioielleria_oroeco
          </a>
        </h2>
        <div className="container-luxe mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {feed.posts.map((post) => (
            <a
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block"
            >
              <SmartImage
                src={post.imageUrl}
                alt={post.alt}
                className="group aspect-square rounded-none"
                imageClassName="object-cover object-[50%_20%] scale-[1.12] transition-transform duration-700 group-hover:scale-[1.18]"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              />
              {post.isVideo ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm"
                >
                  <Play className="h-3.5 w-3.5" fill="currentColor" />
                </span>
              ) : null}
            </a>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.2em] text-[#020202]/50 transition-colors hover:text-[#a58a4d] disabled:cursor-progress disabled:opacity-60"
          >
            <RefreshCw
              className={`h-3.5 w-3.5${loading ? " animate-spin" : ""}`}
            />
            Sincronizza feed
          </button>
        </div>
      </div>
    </section>
  );
}
