import { NextResponse } from "next/server";
import { getAdminSessionFromRequest, isAdminAuthConfigured } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const configured = isAdminAuthConfigured();
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json(
      { authenticated: false, operator: null, role: null, configured },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json(
    {
      authenticated: true,
      operator: session.operator,
      role: session.role,
      configured,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
