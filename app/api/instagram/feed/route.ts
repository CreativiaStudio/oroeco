import { NextResponse } from "next/server";
import { syncInstagramFeed } from "@/lib/instagramSync";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const refresh = new URL(request.url).searchParams.get("refresh") === "1";
  const payload = await syncInstagramFeed({ force: refresh });

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
