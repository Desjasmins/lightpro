import "server-only";

/**
 * Cloudflare Turnstile server-side verification.
 *
 * The gate form embeds the Turnstile widget which produces a one-shot token.
 * The token is forwarded to /api/gate and re-validated here against
 * Cloudflare's siteverify endpoint before any DB write happens.
 *
 * If TURNSTILE_SECRET_KEY is not set (e.g. local development), the check
 * passes through with a `bypassed` reason so devs aren't blocked.
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileResult =
  | { ok: true; bypassed?: boolean }
  | { ok: false; reason: string };

export async function verifyTurnstileToken(
  token: string | undefined | null,
  ip: string | null,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, reason: "missing_secret" };
    }
    return { ok: true, bypassed: true };
  }

  if (!token) {
    return { ok: false, reason: "missing_token" };
  }

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (ip) form.set("remoteip", ip);

  let res: Response;
  try {
    res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    return { ok: false, reason: "siteverify_unreachable" };
  }

  if (!res.ok) {
    return { ok: false, reason: `siteverify_http_${res.status}` };
  }

  let json: { success?: boolean; "error-codes"?: string[] };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    return { ok: false, reason: "siteverify_bad_response" };
  }

  if (!json.success) {
    const codes = json["error-codes"]?.join(",") ?? "unknown";
    return { ok: false, reason: `siteverify_failed:${codes}` };
  }

  return { ok: true };
}
