import fs from "node:fs";
import path from "node:path";

export interface InstagramPost {
  id: string;
  shortcode: string;
  permalink: string;
  imageUrl: string;
  alt: string;
  caption?: string;
  isVideo?: boolean;
  timestamp?: string;
}

export interface InstagramFeedPayload {
  source: "graph_api" | "bridge" | "web_live" | "snapshot";
  syncedAt: string;
  username: string;
  posts: InstagramPost[];
}

const INSTAGRAM_USERNAME = "gioielleria_oroeco";
const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/gioielleria_oroeco/";
const CACHE_TTL_MS = 300_000;

const LOCAL_FALLBACK_POSTS: InstagramPost[] = [
  {
    id: "fallback-modella-1",
    shortcode: "fallback-modella-1",
    permalink: INSTAGRAM_PROFILE_URL,
    imageUrl: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/editorial/modella-1.jpg",
    alt: "Modella con gioielli Oroeco - immagine editoriale 1",
  },
  {
    id: "fallback-modella-2",
    shortcode: "fallback-modella-2",
    permalink: INSTAGRAM_PROFILE_URL,
    imageUrl: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/editorial/modella-2.jpg",
    alt: "Modella con gioielli Oroeco - immagine editoriale 2",
  },
  {
    id: "fallback-modella-3",
    shortcode: "fallback-modella-3",
    permalink: INSTAGRAM_PROFILE_URL,
    imageUrl: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/editorial/modella-3.jpg",
    alt: "Modella con gioielli Oroeco - immagine editoriale 3",
  },
  {
    id: "fallback-modella-4",
    shortcode: "fallback-modella-4",
    permalink: INSTAGRAM_PROFILE_URL,
    imageUrl: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/editorial/modella-4.jpg",
    alt: "Modella con gioielli Oroeco - immagine editoriale 4",
  },
  {
    id: "fallback-natale-2",
    shortcode: "fallback-natale-2",
    permalink: INSTAGRAM_PROFILE_URL,
    imageUrl: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/natale/natale-2.jpg",
    alt: "Selezione Oroeco per le feste - immagine editoriale",
  },
  {
    id: "fallback-solitario-diamante-01",
    shortcode: "fallback-solitario-diamante-01",
    permalink: INSTAGRAM_PROFILE_URL,
    imageUrl: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/davite-delucchi/solitario_diamante_01.jpg",
    alt: "Solitario con diamante della collezione Oroeco",
  },
];

type InstagramCacheEntry = {
  payload: InstagramFeedPayload;
  expiresAt: number;
};

declare global {
  var __oroecoInstagramFeedCache: InstagramCacheEntry | undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function extractShortcode(permalink: string | undefined): string | undefined {
  if (!permalink) return undefined;
  const match = permalink.match(/instagram\.com\/(?:p|reel|tv)\/([^/?#]+)/i);
  return match?.[1];
}

function timestampFromUnix(value: unknown): string | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const date = new Date(value * 1000);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function extractWebCaption(node: Record<string, unknown>): string | undefined {
  const captions = node.edge_media_to_caption;
  if (!isRecord(captions) || !Array.isArray(captions.edges)) return undefined;
  const firstEdge = captions.edges[0];
  if (!isRecord(firstEdge) || !isRecord(firstEdge.node)) return undefined;
  return asString(firstEdge.node.text);
}

function buildAlt(caption: string | undefined, indexSuffix?: string): string {
  if (caption) return caption.slice(0, 140);
  return `Post Instagram @${INSTAGRAM_USERNAME}${indexSuffix ? ` ${indexSuffix}` : ""}`;
}

/**
 * Normalizza un post proveniente da un file locale o da un bridge JSON esterno.
 */
function normalizePost(raw: unknown, index: number): InstagramPost | null {
  if (!isRecord(raw)) return null;

  const permalinkValue = asString(raw.permalink) ?? asString(raw.link);
  const shortcode =
    asString(raw.shortcode) ??
    asString(raw.code) ??
    extractShortcode(permalinkValue);
  const imageUrl =
    asString(raw.imageUrl) ??
    asString(raw.display_url) ??
    asString(raw.thumbnail_url) ??
    asString(raw.media_url);

  if (!imageUrl) return null;

  const id = asString(raw.id) ?? shortcode ?? `instagram-post-${index + 1}`;
  const caption = asString(raw.caption) ?? extractWebCaption(raw);
  const isVideo =
    typeof raw.isVideo === "boolean"
      ? raw.isVideo
      : raw.is_video === true ||
        asString(raw.media_type)?.toUpperCase() === "VIDEO";
  const timestamp =
    asString(raw.timestamp) ?? timestampFromUnix(raw.taken_at_timestamp);

  return {
    id,
    shortcode: shortcode ?? id,
    permalink:
      permalinkValue ??
      (shortcode
        ? `https://www.instagram.com/p/${shortcode}/`
        : INSTAGRAM_PROFILE_URL),
    imageUrl,
    alt: asString(raw.alt) ?? buildAlt(caption),
    ...(caption ? { caption } : {}),
    ...(isVideo ? { isVideo: true } : {}),
    ...(timestamp ? { timestamp } : {}),
  };
}

function normalizeGraphPost(raw: unknown, index: number): InstagramPost | null {
  if (!isRecord(raw)) return null;

  const mediaType = asString(raw.media_type)?.toUpperCase();
  const isVideo = mediaType === "VIDEO";
  const imageUrl =
    (isVideo ? asString(raw.thumbnail_url) : asString(raw.media_url)) ??
    asString(raw.thumbnail_url) ??
    asString(raw.media_url);

  if (!imageUrl) return null;

  const permalink = asString(raw.permalink);
  const shortcode =
    extractShortcode(permalink) ?? asString(raw.shortcode) ?? asString(raw.id);
  const id = asString(raw.id) ?? shortcode ?? `instagram-graph-${index + 1}`;
  const caption = asString(raw.caption);
  const timestamp =
    asString(raw.timestamp) ?? timestampFromUnix(raw.taken_at_timestamp);

  return {
    id,
    shortcode: shortcode ?? id,
    permalink:
      permalink ??
      (shortcode
        ? `https://www.instagram.com/p/${shortcode}/`
        : INSTAGRAM_PROFILE_URL),
    imageUrl,
    alt: buildAlt(caption),
    ...(caption ? { caption } : {}),
    ...(isVideo ? { isVideo: true } : {}),
    ...(timestamp ? { timestamp } : {}),
  };
}

function normalizeWebEdge(rawEdge: unknown, index: number): InstagramPost | null {
  if (!isRecord(rawEdge) || !isRecord(rawEdge.node)) return null;

  const node = rawEdge.node;
  const displayUrl = asString(node.display_url);
  if (!displayUrl) return null;

  const shortcode = asString(node.shortcode);
  const id = asString(node.id) ?? shortcode ?? `instagram-web-${index + 1}`;
  const caption = extractWebCaption(node);
  const timestamp = timestampFromUnix(node.taken_at_timestamp);

  return {
    id,
    shortcode: shortcode ?? id,
    permalink: shortcode
      ? `https://www.instagram.com/p/${shortcode}/`
      : INSTAGRAM_PROFILE_URL,
    imageUrl: `/api/instagram/image?url=${encodeURIComponent(displayUrl)}`,
    alt: buildAlt(caption),
    ...(caption ? { caption } : {}),
    ...(node.is_video === true ? { isVideo: true } : {}),
    ...(timestamp ? { timestamp } : {}),
  };
}

function loadSnapshotFromDisk(): InstagramPost[] {
  try {
    const filePath = path.join(process.cwd(), "data", "instagram-feed.json");
    if (!fs.existsSync(filePath)) return [];

    const parsed: unknown = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const rawPosts = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray(parsed.posts)
        ? parsed.posts
        : [];

    return rawPosts
      .slice(0, 6)
      .map((raw, index) => normalizePost(raw, index))
      .filter((post): post is InstagramPost => post !== null);
  } catch (error) {
    console.warn(
      "[InstagramSync] Impossibile leggere data/instagram-feed.json:",
      error instanceof Error ? error.message : String(error)
    );
    return [];
  }
}

/**
 * Snapshot locale garantito: usa il file data/instagram-feed.json se presente
 * e valido, altrimenti i sei post fallback inclusi nel progetto.
 */
export const FALLBACK_SNAPSHOT: InstagramPost[] = (() => {
  const fromDisk = loadSnapshotFromDisk();
  return fromDisk.length > 0 ? fromDisk : LOCAL_FALLBACK_POSTS;
})();

function clonePosts(posts: InstagramPost[]): InstagramPost[] {
  return posts.map((post) => ({ ...post }));
}

function buildPayload(
  source: InstagramFeedPayload["source"],
  posts: InstagramPost[],
  syncedAt: string
): InstagramFeedPayload {
  return {
    source,
    syncedAt,
    username: INSTAGRAM_USERNAME,
    posts: clonePosts(posts),
  };
}

function cachePayload(payload: InstagramFeedPayload): InstagramFeedPayload {
  globalThis.__oroecoInstagramFeedCache = {
    payload,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
  return payload;
}

async function fetchGraphApiPosts(token: string): Promise<InstagramPost[]> {
  const fields =
    "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
  const url =
    `https://graph.instagram.com/me/media?fields=${encodeURIComponent(fields)}` +
    `&limit=6&access_token=${encodeURIComponent(token)}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(5000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Graph API HTTP ${response.status}`);
  }

  const json: unknown = await response.json();
  if (!isRecord(json) || !Array.isArray(json.data)) {
    throw new Error("Risposta Graph API non valida");
  }

  return json.data
    .slice(0, 6)
    .map((raw, index) => normalizeGraphPost(raw, index))
    .filter((post): post is InstagramPost => post !== null);
}

async function fetchBridgePosts(feedUrl: string): Promise<InstagramPost[]> {
  const response = await fetch(feedUrl, {
    signal: AbortSignal.timeout(5000),
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Bridge feed HTTP ${response.status}`);
  }

  const json: unknown = await response.json();
  const rawPosts = Array.isArray(json)
    ? json
    : isRecord(json) && Array.isArray(json.posts)
      ? json.posts
      : [];

  return rawPosts
    .slice(0, 6)
    .map((raw, index) => normalizePost(raw, index))
    .filter((post): post is InstagramPost => post !== null);
}

async function fetchWebLivePosts(): Promise<InstagramPost[]> {
  const url =
    "https://www.instagram.com/api/v1/users/web_profile_info/" +
    `?username=${encodeURIComponent(INSTAGRAM_USERNAME)}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(4000),
    cache: "no-store",
    headers: {
      "x-ig-app-id": "936619743392459",
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
  });

  if (response.status !== 200) {
    throw new Error(`Instagram web live HTTP ${response.status}`);
  }

  const json: unknown = await response.json();
  const data = isRecord(json) && isRecord(json.data) ? json.data : undefined;
  const user = data && isRecord(data.user) ? data.user : undefined;
  const media =
    user && isRecord(user.edge_owner_to_timeline_media)
      ? user.edge_owner_to_timeline_media
      : undefined;
  const edges = media && Array.isArray(media.edges) ? media.edges : [];

  return edges
    .slice(0, 6)
    .map((edge, index) => normalizeWebEdge(edge, index))
    .filter((post): post is InstagramPost => post !== null);
}

/**
 * Sincronizza il feed Instagram con una catena di fallback che non lancia mai
 * eccezioni: Graph API, bridge JSON esterno, profilo web pubblico, snapshot.
 * Il risultato viene memorizzato in cache per 5 minuti (salvo opts.force).
 */
export async function syncInstagramFeed(opts?: {
  force?: boolean;
}): Promise<InstagramFeedPayload> {
  const cached = globalThis.__oroecoInstagramFeedCache;
  if (!opts?.force && cached && cached.expiresAt > Date.now()) {
    return cached.payload;
  }

  const syncedAt = new Date().toISOString();
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  const bridgeUrl = process.env.INSTAGRAM_FEED_JSON_URL?.trim();

  if (token) {
    try {
      const posts = await fetchGraphApiPosts(token);
      if (posts.length > 0) {
        return cachePayload(buildPayload("graph_api", posts, syncedAt));
      }
      console.warn("[InstagramSync] Graph API senza post, provo i fallback.");
    } catch (error) {
      console.warn(
        "[InstagramSync] Graph API non disponibile:",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  if (bridgeUrl) {
    try {
      const posts = await fetchBridgePosts(bridgeUrl);
      if (posts.length > 0) {
        return cachePayload(buildPayload("bridge", posts, syncedAt));
      }
      console.warn("[InstagramSync] Bridge feed senza post, provo i fallback.");
    } catch (error) {
      console.warn(
        "[InstagramSync] Bridge feed non disponibile:",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  try {
    const posts = await fetchWebLivePosts();
    if (posts.length > 0) {
      return cachePayload(buildPayload("web_live", posts, syncedAt));
    }
    console.warn("[InstagramSync] Web live senza post, uso lo snapshot locale.");
  } catch (error) {
    console.warn(
      "[InstagramSync] Web live non disponibile:",
      error instanceof Error ? error.message : String(error)
    );
  }

  return cachePayload(buildPayload("snapshot", FALLBACK_SNAPSHOT, syncedAt));
}
