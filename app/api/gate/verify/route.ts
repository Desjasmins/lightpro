import { NextResponse } from "next/server";
import { z } from "zod";
import {
  COOKIE_NAME,
  COOKIE_OPTIONS,
  issueGateCookie,
} from "@/lib/gate/cookie";
import { getSupabaseAdmin } from "@/lib/gate/supabase-server";
import {
  normaliseCode,
  sendInternalAccessNotification,
  verifyVerificationToken,
} from "@/lib/gate/verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LeadRow {
  id: string;
  name: string;
  email: string;
  organization: string | null;
  organization_type: string | null;
  lang: string;
  terms_version: string;
  verification_code: string | null;
  code_expires_at: string | null;
  verified_at: string | null;
}

const LEAD_COLUMNS =
  "id, name, email, organization, organization_type, lang, terms_version, verification_code, code_expires_at, verified_at";

async function loadLeadById(id: string): Promise<LeadRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("gate_leads")
    .select(LEAD_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("[/api/gate/verify] lookup error", {
      code: error.code,
      message: error.message,
    });
    return null;
  }
  return (data as LeadRow | null) ?? null;
}

async function loadLeadByEmailAndCode(
  email: string,
  code: string,
): Promise<LeadRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("gate_leads")
    .select(LEAD_COLUMNS)
    .eq("email", email)
    .eq("verification_code", code)
    .is("verified_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[/api/gate/verify] code lookup error", {
      code: error.code,
      message: error.message,
    });
    return null;
  }
  return (data as LeadRow | null) ?? null;
}

function isExpired(row: LeadRow): boolean {
  if (!row.code_expires_at) return true;
  return new Date(row.code_expires_at).getTime() < Date.now();
}

async function markVerified(id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("gate_leads")
    .update({
      verified_at: new Date().toISOString(),
      verification_code: null,
    })
    .eq("id", id)
    .is("verified_at", null);
  if (error) {
    console.error("[/api/gate/verify] mark verified failed", {
      code: error.code,
      message: error.message,
    });
    return false;
  }
  return true;
}

function firePostVerifyEmails(
  lead: LeadRow,
  method: "code" | "magic_link",
): void {
  const lang = lead.lang === "en" ? "en" : "fr";

  // Internal team notification only. The visitor doesn't receive a
  // separate "thanks for accepting the NDA" recap — they've just
  // accepted it in the UI, no need to email it back.
  void sendInternalAccessNotification({
    visitorName: lead.name,
    visitorEmail: lead.email,
    visitorOrganization: lead.organization,
    visitorOrganizationType: lead.organization_type,
    visitorLang: lang,
    verifiedAt: new Date(),
    verificationMethod: method,
  }).then((result) => {
    if (!result.ok && result.reason !== "no_recipient_configured") {
      console.warn("[/api/gate/verify] internal notif failed", {
        leadId: lead.id,
        reason: result.reason,
      });
    }
  });
}

function setAccessCookie(
  res: NextResponse,
  lead: LeadRow,
): NextResponse {
  const cookie = issueGateCookie(lead.email, {
    name: lead.name,
    organization: lead.organization,
  });
  res.cookies.set({
    name: COOKIE_NAME,
    value: cookie.value,
    maxAge: cookie.maxAge,
    ...COOKIE_OPTIONS,
  });
  return res;
}

function localePath(lang: "fr" | "en", path: string): string {
  return `/${lang}${path}`;
}

// ─── GET /api/gate/verify?t=<token>&lang=<fr|en> (magic link) ────────────────

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("t");
  const lang = url.searchParams.get("lang") === "en" ? "en" : "fr";

  const payload = verifyVerificationToken(token);
  if (!payload) {
    return NextResponse.redirect(
      new URL(`${localePath(lang, "/estimation")}?verify=expired`, url.origin),
      302,
    );
  }

  const lead = await loadLeadById(payload.i);
  if (!lead) {
    return NextResponse.redirect(
      new URL(`${localePath(lang, "/estimation")}?verify=invalid`, url.origin),
      302,
    );
  }

  if (lead.verified_at) {
    // Already verified — issue a fresh cookie so re-clicked links still
    // route into the tool instead of bouncing home.
    const res = NextResponse.redirect(
      new URL(localePath(lang, "/estimation/tool"), url.origin),
      302,
    );
    return setAccessCookie(res, lead);
  }

  if (isExpired(lead)) {
    return NextResponse.redirect(
      new URL(`${localePath(lang, "/estimation")}?verify=expired`, url.origin),
      302,
    );
  }

  const ok = await markVerified(lead.id);
  if (!ok) {
    return NextResponse.redirect(
      new URL(`${localePath(lang, "/estimation")}?verify=error`, url.origin),
      302,
    );
  }

  firePostVerifyEmails(lead, "magic_link");

  const res = NextResponse.redirect(
    new URL(localePath(lang, "/estimation/tool"), url.origin),
    302,
  );
  return setAccessCookie(res, lead);
}

// ─── POST /api/gate/verify { email, code } ───────────────────────────────────

const PostSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  code: z.string().trim().min(4).max(16),
});

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

  const parsed = PostSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation failed" },
      { status: 400 },
    );
  }

  const code = normaliseCode(parsed.data.code);
  const lead = await loadLeadByEmailAndCode(parsed.data.email, code);
  if (!lead) {
    return NextResponse.json(
      { ok: false, error: "invalid_code" },
      { status: 400 },
    );
  }

  if (isExpired(lead)) {
    return NextResponse.json(
      { ok: false, error: "expired_code" },
      { status: 400 },
    );
  }

  const ok = await markVerified(lead.id);
  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 },
    );
  }

  firePostVerifyEmails(lead, "code");

  const lang = lead.lang === "en" ? "en" : "fr";
  const res = NextResponse.json({
    ok: true,
    redirect: localePath(lang, "/estimation/tool"),
  });
  return setAccessCookie(res, lead);
}
