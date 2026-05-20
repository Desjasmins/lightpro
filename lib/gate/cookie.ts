import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Gate access cookie — HMAC-signed, self-contained (no DB lookup).
 *
 * Format:  <base64url(payload)>.<base64url(hmac)>
 * Payload: JSON { e: email, x: expiry_unix_seconds, n?: name }
 *
 * The cookie is httpOnly + Secure + SameSite=Lax. Sliding TTL: each visit
 * to /estimation/tool refreshes the expiry to now + COOKIE_TTL_SECONDS in
 * the middleware (proxy.ts) — Server Components can't mutate cookies in
 * Next.js 16.
 */

export const COOKIE_NAME = "gate_access";
export const COOKIE_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface GatePayload {
  /** Email, lower-cased. */
  e: string;
  /** Expiry, unix seconds. */
  x: number;
  /** Display name (used for the wizard watermark). */
  n?: string;
  /** Organization (used to prefill the project's municipality field). */
  o?: string;
}

function b64urlEncode(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf, "utf8") : buf;
  return b
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function getSecret(): Buffer {
  const secret = process.env.GATE_COOKIE_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "GATE_COOKIE_SECRET is missing or too short (need >= 32 chars)",
    );
  }
  return Buffer.from(secret, "utf8");
}

function sign(payloadB64: string): string {
  const mac = createHmac("sha256", getSecret()).update(payloadB64).digest();
  return b64urlEncode(mac);
}

export interface IssuedCookie {
  value: string;
  maxAge: number;
}

export function issueGateCookie(
  email: string,
  opts?: { name?: string; organization?: string | null },
): IssuedCookie {
  const payload: GatePayload = {
    e: email.trim().toLowerCase(),
    x: Math.floor(Date.now() / 1000) + COOKIE_TTL_SECONDS,
  };
  const trimmedName = opts?.name?.trim();
  if (trimmedName) payload.n = trimmedName.slice(0, 200);
  const trimmedOrg = opts?.organization?.trim();
  if (trimmedOrg) payload.o = trimmedOrg.slice(0, 200);
  const payloadB64 = b64urlEncode(JSON.stringify(payload));
  const sigB64 = sign(payloadB64);
  return {
    value: `${payloadB64}.${sigB64}`,
    maxAge: COOKIE_TTL_SECONDS,
  };
}

export function verifyGateCookie(
  raw: string | undefined | null,
): GatePayload | null {
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;

  const expectedSig = sign(payloadB64);
  const aBuf = Buffer.from(sigB64);
  const bBuf = Buffer.from(expectedSig);
  if (aBuf.length !== bBuf.length) return null;
  if (!timingSafeEqual(aBuf, bBuf)) return null;

  try {
    const payload = JSON.parse(
      b64urlDecode(payloadB64).toString("utf8"),
    ) as GatePayload;
    if (typeof payload.e !== "string" || typeof payload.x !== "number") {
      return null;
    }
    if (payload.x < Math.floor(Date.now() / 1000)) return null;
    if (payload.n !== undefined && typeof payload.n !== "string") return null;
    if (payload.o !== undefined && typeof payload.o !== "string") return null;
    return payload;
  } catch {
    return null;
  }
}

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
