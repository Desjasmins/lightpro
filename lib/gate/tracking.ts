import "server-only";
import { getSupabaseAdmin } from "./supabase-server";

/**
 * Best-effort audit logging for wizard views. Every failure is swallowed:
 * tracking blips must never break /estimation/tool rendering.
 */

interface RecordViewArgs {
  email: string;
  ip?: string | null;
  userAgent?: string | null;
  referer?: string | null;
}

export async function recordEstimationView(args: RecordViewArgs): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();

    // Resolve lead_id by latest verified row for this email. Best-effort —
    // if it fails we still record the view with lead_id=null.
    let leadId: string | null = null;
    try {
      const { data } = await supabase
        .from("gate_leads")
        .select("id")
        .eq("email", args.email)
        .not("verified_at", "is", null)
        .order("verified_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      leadId = (data?.id as string | undefined) ?? null;
    } catch {
      // Swallowed by design.
    }

    await supabase.from("estimation_views").insert({
      lead_id: leadId,
      email: args.email,
      ip: args.ip ?? null,
      user_agent: args.userAgent ?? null,
      referer: args.referer ?? null,
    });
  } catch (err) {
    console.warn("[gate/tracking] recordEstimationView failed", {
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
