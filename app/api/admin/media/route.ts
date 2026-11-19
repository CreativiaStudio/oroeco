import { NextRequest, NextResponse } from "next/server";
import {
  deleteObjectFromR2,
  listR2Objects,
  uploadBufferToR2,
} from "@/lib/r2";

export const runtime = "nodejs";

function sanitizeFilename(name: string): string {
  const parts = name.split(".");
  const ext = parts.length > 1 ? `.${parts.pop()!.toLowerCase()}` : "";
  const base = parts
    .join(".")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "media"}-${Date.now().toString(36)}${ext}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const prefix = searchParams.get("prefix") || "";
    const search = searchParams.get("search") || "";
    const cursor = searchParams.get("cursor") || undefined;
    const maxKeys = Math.min(
      Number(searchParams.get("limit") || "120") || 120,
      500
    );

    const data = await listR2Objects({
      prefix,
      search,
      continuationToken: cursor,
      maxKeys,
    });

    return NextResponse.json(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Errore lettura media R2";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const rawFolder = String(formData.get("folder") || "uploads/").trim();
    const customName = String(formData.get("filename") || "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "File mancante nella richiesta" },
        { status: 400 }
      );
    }

    const folder = rawFolder
      .replace(/^\/+/, "")
      .replace(/\.\./g, "")
      .replace(/\/?$/, "/");

    const finalFolder =
      folder === "/"
        ? file.type.startsWith("video/")
          ? "videos/"
          : "uploads/"
        : folder;

    const filename = customName
      ? customName.replace(/[^a-zA-Z0-9._-]/g, "-")
      : sanitizeFilename(file.name);

    const key = `${finalFolder}${filename}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const item = await uploadBufferToR2({
      key,
      body: buffer,
      contentType: file.type || "application/octet-stream",
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Errore upload su Cloudflare R2";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let key = searchParams.get("key") || "";

    if (!key) {
      const body = await req.json().catch(() => ({}));
      key = String(body?.key || "");
    }

    if (!key) {
      return NextResponse.json(
        { error: "Parametro 'key' obbligatorio" },
        { status: 400 }
      );
    }

    await deleteObjectFromR2(key);
    return NextResponse.json({ deleted: key });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Errore eliminazione su R2";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
