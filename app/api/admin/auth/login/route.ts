import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  createAdminSessionToken,
  isAdminAuthConfigured,
  verifyAdminCredentials,
} from "@/lib/adminAuth";

interface RateBucket {
  count: number;
  resetAt: number;
}

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_WINDOW = 10;
const attemptsByIp = new Map<string, RateBucket>();

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") || "";
  const first = fwd.split(",")[0]?.trim();
  return first || req.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = attemptsByIp.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    return false;
  }
  return bucket.count >= MAX_ATTEMPTS_PER_WINDOW;
}

function recordFailure(ip: string): void {
  const now = Date.now();
  const bucket = attemptsByIp.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    attemptsByIp.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  } else {
    bucket.count += 1;
  }
}

function clearFailures(ip: string): void {
  attemptsByIp.delete(ip);
}

export async function POST(req: Request) {
  const ip = getClientIp(req);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Troppi tentativi di accesso. Riprova tra qualche minuto." },
      { status: 429 },
    );
  }

  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Credenziali gestionale non configurate sul server (impostare ADMIN_PASSWORD nelle variabili d'ambiente).",
      },
      { status: 503 },
    );
  }

  let operator = "Renato";
  let password = "";
  try {
    const body = (await req.json()) as { operator?: unknown; password?: unknown };
    if (typeof body.operator === "string" && body.operator.trim()) {
      operator = body.operator.trim();
    }
    if (typeof body.password === "string") {
      password = body.password;
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Richiesta non valida." }, { status: 400 });
  }

  const verified = await verifyAdminCredentials(operator, password);
  if (!verified.ok) {
    recordFailure(ip);
    if (verified.reason === "unconfigured") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Credenziali gestionale non configurate sul server (impostare ADMIN_PASSWORD nelle variabili d'ambiente).",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: false, error: "Credenziali non valide." }, { status: 401 });
  }

  clearFailures(ip);
  const token = await createAdminSessionToken({
    operator: verified.operator,
    role: verified.role,
  });

  const res = NextResponse.json({
    ok: true,
    operator: verified.operator,
    role: verified.role,
  });

  res.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });

  return res;
}
