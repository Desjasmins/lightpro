/**
 * Parse a recipient env var into a list of email addresses.
 *
 * Accepts a comma- or semicolon-separated string (e.g. from
 * INTERNAL_NOTIFY_EMAIL / RESEND_BCC_EMAIL) and returns a trimmed,
 * de-duplicated array with empty entries removed. Returns [] when the
 * value is missing or blank, so callers can treat "no recipients" as
 * "skip sending".
 */
export function parseRecipients(raw: string | undefined | null): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,;]/)) {
    const email = part.trim();
    if (!email) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(email);
  }
  return out;
}
