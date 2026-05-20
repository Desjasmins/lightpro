import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/gate/supabase-server";
import { verifyTurnstileToken } from "@/lib/gate/turnstile";
import {
  generateVerificationCode,
  issueVerificationToken,
  sendVerificationEmail,
  VERIFICATION_TTL_SECONDS,
} from "@/lib/gate/verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TERMS_VERSION = "municipal-v1.0";

const ORGANIZATION_TYPES = [
  "municipality",
  "city",
  "mrc",
  "engineering_firm",
  "public_agency",
  "consultant",
  "investor",
  "other",
] as const;

const BodySchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().toLowerCase().email().max(320),
  organization: z
    .string()
    .trim()
    .max(200)
    .nullish()
    .transform((v) => (v ? v : null)),
  organization_type: z
    .enum(ORGANIZATION_TYPES)
    .nullish()
    .transform((v) => (v ? v : null)),
  lang: z.enum(["fr", "en"]),
  accepted_terms: z.literal(true),
  accepted_at: z.string().datetime(),
  user_agent: z.string().max(1000).optional(),
  terms_version: z.string().max(50).optional(),
  turnstile_token: z.string().max(2048).optional(),
});

function getClientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return null;
}

function getOrigin(req: Request): string {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const fallback = host || "localhost:3000";
  const scheme =
    fallback.startsWith("localhost") || fallback.startsWith("127.")
      ? "http"
      : proto;
  return `${scheme}://${fallback}`;
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation failed" },
      { status: 400 },
    );
  }
  const body = parsed.data;

  const ip = getClientIp(req);
  const ua = body.user_agent ?? req.headers.get("user-agent") ?? null;

  const turnstile = await verifyTurnstileToken(body.turnstile_token, ip);
  if (!turnstile.ok) {
    console.warn("[/api/gate] turnstile rejected", { reason: turnstile.reason });
    return NextResponse.json(
      { ok: false, error: "Bot check failed" },
      { status: 403 },
    );
  }

  const code = generateVerificationCode();
  const codeExpiresAt = new Date(
    Date.now() + VERIFICATION_TTL_SECONDS * 1000,
  ).toISOString();

  let leadId: string;
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("gate_leads")
      .insert({
        name: body.name,
        email: body.email,
        organization: body.organization,
        organization_type: body.organization_type,
        lang: body.lang,
        accepted_terms: body.accepted_terms,
        accepted_at: body.accepted_at,
        terms_version: body.terms_version ?? TERMS_VERSION,
        ip,
        user_agent: ua,
        verification_code: code,
        code_expires_at: codeExpiresAt,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("[/api/gate] supabase insert failed", {
        code: error?.code,
        message: error?.message,
      });
      return NextResponse.json(
        { ok: false, error: "Storage error" },
        { status: 500 },
      );
    }
    leadId = data.id as string;
  } catch (err) {
    console.error("[/api/gate] unexpected error", err);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 },
    );
  }

  const token = issueVerificationToken(leadId);
  const origin = getOrigin(req);
  const link = `${origin}/api/gate/verify?t=${encodeURIComponent(token)}&lang=${body.lang}`;

  const sent = await sendVerificationEmail({
    recipientName: body.name,
    recipientEmail: body.email,
    code,
    link,
    lang: body.lang,
  });

  if (!sent.ok) {
    console.error("[/api/gate] verification email send failed", {
      reason: sent.reason,
    });
    return NextResponse.json(
      { ok: false, error: "Could not send verification email" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    verify_required: true,
    email: body.email,
    expires_in: VERIFICATION_TTL_SECONDS,
  });
}
