import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  sanitizeAdminNextPath,
  verifyAdminSessionToken,
} from "@/lib/adminAuth";

const PUBLIC_ADMIN_AUTH_ROUTES = new Set<string>([
  "/api/admin/auth/login",
  "/api/admin/auth/logout",
  "/api/admin/auth/session",
]);

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/pos/:path*"],
};

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (PUBLIC_ADMIN_AUTH_ROUTES.has(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = await verifyAdminSessionToken(token);

  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    if (session) {
      const nextParam = sanitizeAdminNextPath(req.nextUrl.searchParams.get("next"));
      return NextResponse.redirect(new URL(nextParam, req.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, ok: false, error: "Accesso non autorizzato" },
        { status: 401 },
      );
    }

    const loginUrl = new URL("/admin/login", req.url);
    const targetNext = sanitizeAdminNextPath(`${pathname}${search}`);
    loginUrl.searchParams.set("next", targetNext);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
