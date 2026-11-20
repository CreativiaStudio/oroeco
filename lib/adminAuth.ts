/** Configurazione cookie & sessione gestionale ORO&CO. */
export const ADMIN_SESSION_COOKIE = "oroeco_admin_session";
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 ore
export const ADMIN_OPERATORS = ["Renato", "Patrizia", "Zia"] as const;
export type AdminOperatorName = (typeof ADMIN_OPERATORS)[number];

export interface AdminSessionPayload {
  operator: string;
  role: "owner" | "staff";
  exp: number;
}

function getSigningSecret(): string {
  const explicit = (process.env.ADMIN_AUTH_SECRET || "").trim();
  if (explicit) return explicit;
  const fallbackKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (fallbackKey) return `oroeco-admin-hmac-v1:${fallbackKey}`;
  return "";
}

function parseOperatorsMap(): Record<string, string> {
  const raw = (process.env.ADMIN_OPERATORS_JSON || "").trim();
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "string" && v.length > 0) {
        out[k.trim().toLowerCase()] = v;
      }
    }
    return out;
  } catch {
    return {};
  }
}

/** Ritorna true solo se il server ha credenziali admin e segreto firma configurati. */
export function isAdminAuthConfigured(): boolean {
  const secret = getSigningSecret();
  if (!secret) return false;
  const master = (process.env.ADMIN_PASSWORD || "").trim();
  if (master.length > 0) return true;
  return Object.keys(parseOperatorsMap()).length > 0;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string): Uint8Array | null {
  try {
    const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
    const bin = atob(padded);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Confronto constant-time tramite hash SHA-256 + XOR byte-per-byte (compatibile Edge e Node). */
async function timingSafeStringEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    globalThis.crypto.subtle.digest("SHA-256", enc.encode(a)),
    globalThis.crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const ua = new Uint8Array(ha);
  const ub = new Uint8Array(hb);
  let diff = ua.length ^ ub.length;
  for (let i = 0; i < ua.length; i++) {
    diff |= ua[i] ^ ub[i];
  }
  return diff === 0;
}

/** Verifica operatore + password dalle variabili d'ambiente server-side. */
export async function verifyAdminCredentials(
  rawOperator: string,
  rawPassword: string,
): Promise<{ ok: true; operator: string; role: "owner" | "staff" } | { ok: false; reason: "unconfigured" | "invalid" }> {
  if (!isAdminAuthConfigured()) {
    return { ok: false, reason: "unconfigured" };
  }

  const password = String(rawPassword || "");
  if (!password) return { ok: false, reason: "invalid" };

  const cleanedOp = String(rawOperator || "").trim() || "Renato";
  const matchedOp =
    ADMIN_OPERATORS.find((op) => op.toLowerCase() === cleanedOp.toLowerCase()) ?? null;

  const operatorsMap = parseOperatorsMap();
  const perOpPassword = operatorsMap[cleanedOp.toLowerCase()];
  const masterPassword = (process.env.ADMIN_PASSWORD || "").trim();

  let expected = "";
  if (perOpPassword) {
    expected = perOpPassword;
  } else if (masterPassword && (matchedOp || Object.keys(operatorsMap).length === 0)) {
    expected = masterPassword;
  }

  if (!expected) {
    return { ok: false, reason: "invalid" };
  }

  const matches = await timingSafeStringEqual(password, expected);
  if (!matches) {
    return { ok: false, reason: "invalid" };
  }

  const finalOp = matchedOp || cleanedOp;
  const role: "owner" | "staff" = finalOp.toLowerCase() === "renato" ? "owner" : "staff";
  return { ok: true, operator: finalOp, role };
}

/** Firma un token di sessione HMAC-SHA256. */
export async function createAdminSessionToken(payload: {
  operator: string;
  role: "owner" | "staff";
}): Promise<string> {
  const secret = getSigningSecret();
  if (!secret) {
    throw new Error("ADMIN_AUTH_SECRET non configurato");
  }
  const fullPayload: AdminSessionPayload = {
    operator: payload.operator,
    role: payload.role,
    exp: Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000,
  };
  const bodyB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(fullPayload)));
  const key = await importHmacKey(secret);
  const sigBuf = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(bodyB64),
  );
  const sigB64 = toBase64Url(new Uint8Array(sigBuf));
  return `${bodyB64}.${sigB64}`;
}

/** Verifica firma e scadenza di un token di sessione HMAC-SHA256. */
export async function verifyAdminSessionToken(
  token: string | undefined | null,
): Promise<AdminSessionPayload | null> {
  if (!token || typeof token !== "string") return null;
  const dotIdx = token.indexOf(".");
  if (dotIdx <= 0) return null;
  const secret = getSigningSecret();
  if (!secret) return null;

  const bodyB64 = token.slice(0, dotIdx);
  const sigB64 = token.slice(dotIdx + 1);
  const sigBytes = fromBase64Url(sigB64);
  if (!sigBytes) return null;

  try {
    const key = await importHmacKey(secret);
    const sigCopy = new Uint8Array(sigBytes.length);
    sigCopy.set(sigBytes);
    const valid = await globalThis.crypto.subtle.verify(
      "HMAC",
      key,
      sigCopy,
      new TextEncoder().encode(bodyB64),
    );
    if (!valid) return null;

    const jsonBytes = fromBase64Url(bodyB64);
    if (!jsonBytes) return null;
    const parsed = JSON.parse(new TextDecoder().decode(jsonBytes)) as AdminSessionPayload;
    if (
      !parsed ||
      typeof parsed.operator !== "string" ||
      typeof parsed.exp !== "number" ||
      parsed.exp <= Date.now()
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    const val = part.slice(eq + 1).trim();
    if (name) {
      try {
        out[name] = decodeURIComponent(val);
      } catch {
        out[name] = val;
      }
    }
  }
  return out;
}

/** Estrae e verifica la sessione gestionale dalla Request corrente (Edge + Node). */
export async function getAdminSessionFromRequest(req: Request): Promise<AdminSessionPayload | null> {
  const cookies = parseCookieHeader(req.headers.get("cookie"));
  return verifyAdminSessionToken(cookies[ADMIN_SESSION_COOKIE]);
}

/** Sanifica `next` prevenendo open redirect esterni al gestionale. */
export function sanitizeAdminNextPath(next: string | null | undefined): string {
  const raw = String(next || "").trim();
  if (!raw.startsWith("/admin") || raw.startsWith("//") || raw.startsWith("/admin/login")) {
    return "/admin";
  }
  return raw;
}
