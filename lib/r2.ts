import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { R2_PUBLIC_URL } from "./media";

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
export const R2_BUCKET = process.env.R2_BUCKET_NAME || "oroeco-media";

const ENDPOINT =
  process.env.R2_ENDPOINT ||
  (ACCOUNT_ID ? `https://${ACCOUNT_ID}.r2.cloudflarestorage.com` : "");

let cachedClient: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !ENDPOINT) {
    throw new Error(
      "Configurazione Cloudflare R2 mancante (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT)."
    );
  }
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: "auto",
      endpoint: ENDPOINT,
      credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
      },
    });
  }
  return cachedClient;
}

export interface R2MediaItem {
  key: string;
  url: string;
  size: number;
  lastModified: string;
  folder: string;
  filename: string;
  isVideo: boolean;
}

export function getPublicUrlForKey(key: string): string {
  const cleanKey = key.replace(/^\/+/, "");
  return `${R2_PUBLIC_URL}/${cleanKey}`;
}

export function isVideoKey(key: string): boolean {
  return /\.(mp4|webm|mov|m4v|ogg)$/i.test(key);
}

export async function listR2Objects(options?: {
  prefix?: string;
  search?: string;
  continuationToken?: string;
  maxKeys?: number;
}): Promise<{
  items: R2MediaItem[];
  nextContinuationToken: string | null;
  isTruncated: boolean;
}> {
  const client = getR2Client();
  const prefix = options?.prefix || "";
  const search = (options?.search || "").trim().toLowerCase();
  const maxKeys = options?.maxKeys || 200;

  const command = new ListObjectsV2Command({
    Bucket: R2_BUCKET,
    Prefix: prefix || undefined,
    ContinuationToken: options?.continuationToken || undefined,
    MaxKeys: search ? 1000 : maxKeys,
  });

  const response = await client.send(command);
  const rawItems = response.Contents || [];

  let items: R2MediaItem[] = rawItems
    .filter((obj) => obj.Key && !obj.Key.endsWith("/"))
    .map((obj) => {
      const key = obj.Key!;
      const parts = key.split("/");
      const filename = parts[parts.length - 1] || key;
      const folder = parts.length > 1 ? parts.slice(0, -1).join("/") : "root";
      return {
        key,
        url: getPublicUrlForKey(key),
        size: obj.Size || 0,
        lastModified: obj.LastModified ? obj.LastModified.toISOString() : "",
        folder,
        filename,
        isVideo: isVideoKey(key),
      };
    });

  if (search) {
    items = items.filter(
      (item) =>
        item.filename.toLowerCase().includes(search) ||
        item.key.toLowerCase().includes(search)
    );
  }

  items.sort((a, b) => (b.lastModified > a.lastModified ? 1 : -1));

  return {
    items: search ? items.slice(0, maxKeys) : items,
    nextContinuationToken: response.NextContinuationToken || null,
    isTruncated: Boolean(response.IsTruncated),
  };
}

export async function uploadBufferToR2(params: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<R2MediaItem> {
  const client = getR2Client();
  const cleanKey = params.key.replace(/^\/+/, "");

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: cleanKey,
      Body: params.body,
      ContentType: params.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  const parts = cleanKey.split("/");
  const filename = parts[parts.length - 1] || cleanKey;
  const folder = parts.length > 1 ? parts.slice(0, -1).join("/") : "root";

  return {
    key: cleanKey,
    url: getPublicUrlForKey(cleanKey),
    size: params.body.byteLength,
    lastModified: new Date().toISOString(),
    folder,
    filename,
    isVideo: isVideoKey(cleanKey),
  };
}

export async function deleteObjectFromR2(key: string): Promise<void> {
  const client = getR2Client();
  const cleanKey = key.replace(/^\/+/, "");
  await client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: cleanKey,
    })
  );
}

export async function headObjectInR2(key: string): Promise<boolean> {
  try {
    const client = getR2Client();
    await client.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET,
        Key: key.replace(/^\/+/, ""),
      })
    );
    return true;
  } catch {
    return false;
  }
}
