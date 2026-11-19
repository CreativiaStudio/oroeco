"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Film,
  FolderOpen,
  ImagePlus,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { MEDIA_FOLDERS } from "@/lib/media";

export interface MediaLibraryItem {
  key: string;
  url: string;
  size: number;
  lastModified: string;
  folder: string;
  filename: string;
  isVideo: boolean;
}

interface MediaLibraryProps {
  mode?: "manage" | "picker";
  onSelect?: (item: MediaLibraryItem) => void;
  onClose?: () => void;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function MediaLibrary({
  mode = "manage",
  onSelect,
  onClose,
}: MediaLibraryProps) {
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [folder, setFolder] = useState<string>("");
  const [uploadFolder, setUploadFolder] = useState<string>("uploads/");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const fetchMedia = useCallback(
    async (cursor?: string | null, append = false) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (folder) params.set("prefix", folder);
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (cursor) params.set("cursor", cursor);
        params.set("limit", "120");

        const res = await fetch(`/api/admin/media?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Errore caricamento media");

        setItems((prev) =>
          append ? [...prev, ...(data.items || [])] : data.items || []
        );
        setNextCursor(data.nextContinuationToken || null);
        setIsTruncated(Boolean(data.isTruncated));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore di rete");
      } finally {
        setLoading(false);
      }
    },
    [folder, debouncedSearch]
  );

  useEffect(() => {
    fetchMedia(null, false);
  }, [fetchMedia]);

  const handleUploadFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (!files.length) return;

    setUploading(true);
    setError(null);
    try {
      const uploadedItems: MediaLibraryItem[] = [];
      for (const file of files) {
        const targetFolder =
          uploadFolder === "uploads/" && file.type.startsWith("video/")
            ? "videos/"
            : uploadFolder;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", targetFolder);

        const res = await fetch("/api/admin/media", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Errore upload ${file.name}`);
        }
        if (data.item) uploadedItems.push(data.item);
      }
      setItems((prev) => [...uploadedItems, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item: MediaLibraryItem) => {
    if (
      !window.confirm(
        `Eliminare definitivamente "${item.filename}" da Cloudflare R2?`
      )
    ) {
      return;
    }
    setDeletingKey(item.key);
    try {
      const res = await fetch(
        `/api/admin/media?key=${encodeURIComponent(item.key)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Errore eliminazione");
      }
      setItems((prev) => prev.filter((x) => x.key !== item.key));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore eliminazione");
    } finally {
      setDeletingKey(null);
    }
  };

  const handleCopyUrl = async (item: MediaLibraryItem) => {
    await navigator.clipboard.writeText(item.url);
    setCopiedKey(item.key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div className="space-y-5">
      {/* Header & Upload Bar */}
      <div className="flex flex-col gap-3 rounded-md border border-[#E5E0D5] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl text-ink">
              Libreria Media Cloudflare R2
            </h2>
            <span className="rounded-full bg-[#012236] px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-[#C5A059]">
              oroeco-media
            </span>
          </div>
          <p className="mt-0.5 text-xs text-graphite-soft">
            Archivio centralizzato foto e video (0 MB su Supabase, Vercel e GitHub).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={uploadFolder}
            onChange={(e) => setUploadFolder(e.target.value)}
            className="rounded-sm border border-[#E5E0D5] bg-[#F8F7F4] px-2.5 py-2 text-xs font-medium text-ink outline-none focus:border-[#C5A059]"
            title="Cartella di destinazione per i nuovi upload"
          >
            {MEDIA_FOLDERS.filter((f) => f.id !== "").map((f) => (
              <option key={f.id} value={f.id}>
                Cartella: {f.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-sm bg-[#012236] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#023352] disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#C5A059]" />
            ) : (
              <ImagePlus className="h-4 w-4 text-[#C5A059]" />
            )}
            <span>{uploading ? "Caricamento su R2..." : "Carica Media"}</span>
          </button>

          <button
            type="button"
            onClick={() => fetchMedia(null, false)}
            className="inline-flex items-center gap-1.5 rounded-sm border border-[#E5E0D5] bg-white px-3 py-2 text-xs font-medium text-graphite hover:border-[#C5A059]"
            title="Aggiorna elenco da R2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          {mode === "picker" && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-sm border border-[#E5E0D5] px-2.5 py-2 text-xs text-graphite hover:bg-[#F8F7F4]"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleUploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) {
            handleUploadFiles(e.dataTransfer.files);
          }
        }}
        className={`flex items-center justify-center gap-3 rounded-md border-2 border-dashed px-4 py-4 text-xs transition ${
          dragOver
            ? "border-[#C5A059] bg-[#F7F3EC] text-ink"
            : "border-[#E5E0D5] bg-white/70 text-graphite-soft"
        }`}
      >
        <UploadCloud className="h-5 w-5 text-[#C5A059]" />
        <span>
          Trascina qui foto o video (JPG, PNG, WebP, SVG, MP4, WebM) per caricarli subito su{" "}
          <strong className="text-ink">{uploadFolder}</strong>
        </span>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {MEDIA_FOLDERS.map((f) => {
            const active = folder === f.id;
            return (
              <button
                key={f.id || "all"}
                type="button"
                onClick={() => setFolder(f.id)}
                className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "bg-[#012236] text-white"
                    : "border border-[#E5E0D5] bg-white text-graphite hover:border-[#C5A059]"
                }`}
              >
                <FolderOpen className="h-3.5 w-3.5 text-[#C5A059]" />
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-graphite-soft" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca per nome file o SKU..."
            className="w-full rounded-sm border border-[#E5E0D5] bg-white py-1.5 pl-8 pr-3 text-xs text-ink outline-none focus:border-[#C5A059]"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-sm border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Grid */}
      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-xs text-graphite-soft">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#C5A059]" />
          Lettura archivio Cloudflare R2...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-md border border-[#E5E0D5] bg-white py-14 text-center text-xs text-graphite-soft">
          Nessun file trovato in questa cartella.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {items.map((item) => (
              <div
                key={item.key}
                className="group flex flex-col overflow-hidden rounded-md border border-[#E5E0D5] bg-white transition hover:border-[#C5A059] hover:shadow-sm"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-[#F8F7F4]">
                  {item.isVideo ? (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-[#012236] text-white">
                      <Film className="h-8 w-8 text-[#C5A059]" />
                      <span className="mt-1 text-[0.65rem] uppercase tracking-wider">
                        Video
                      </span>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={item.filename}
                      loading="lazy"
                      className="h-full w-full object-contain p-1.5 transition duration-200 group-hover:scale-105"
                    />
                  )}
                  <span className="absolute left-1.5 top-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[0.6rem] font-medium text-white">
                    {item.folder}
                  </span>
                </div>

                <div className="flex flex-1 flex-col justify-between p-2.5">
                  <div>
                    <p
                      className="truncate text-[0.72rem] font-medium text-ink"
                      title={item.key}
                    >
                      {item.filename}
                    </p>
                    <p className="mt-0.5 font-mono text-[0.62rem] text-graphite-soft">
                      {formatBytes(item.size)}
                    </p>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5">
                    {mode === "picker" && onSelect ? (
                      <button
                        type="button"
                        onClick={() => onSelect(item)}
                        className="flex-1 rounded-sm bg-[#012236] px-2 py-1 text-[0.68rem] font-semibold text-white hover:bg-[#023352]"
                      >
                        Usa media
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(item)}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-sm border border-[#E5E0D5] px-2 py-1 text-[0.68rem] font-medium text-ink hover:border-[#C5A059]"
                      >
                        {copiedKey === item.key ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span>Copiato</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 text-[#C5A059]" />
                            <span>Copia URL</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={deletingKey === item.key}
                      onClick={() => handleDelete(item)}
                      className="rounded-sm border border-[#E5E0D5] p-1 text-graphite-soft hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      title="Elimina da R2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isTruncated && nextCursor && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => fetchMedia(nextCursor, true)}
                disabled={loading}
                className="rounded-sm border border-[#E5E0D5] bg-white px-5 py-2 text-xs font-medium text-ink hover:border-[#C5A059]"
              >
                {loading ? "Caricamento..." : "Carica altri media"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
