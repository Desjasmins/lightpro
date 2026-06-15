/**
 * Server-only helper that renders the estimation email via react-email and
 * sends it through Resend. Never import this from a client component; the
 * Resend API key must remain on the server.
 */
import "server-only";

import { render } from "@react-email/components";
import { Resend } from "resend";
import { z } from "zod";
import { EstimationReport } from "@/emails/EstimationReport";
import { parseRecipients } from "@/lib/email/recipients";
import type { ProjectEstimate } from "@/lib/estimation/estimate";
import type { ProjectStepValues } from "@/lib/estimation/schema";

const envSchema = z.object({
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY missing"),
  RESEND_FROM_EMAIL: z.string().email("RESEND_FROM_EMAIL invalid"),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

function readEnv(): {
  apiKey: string;
  from: string;
  siteUrl?: string;
} {
  const parsed = envSchema.safeParse({
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });
  if (!parsed.success) {
    throw new Error(
      `Email env misconfigured: ${parsed.error.issues
        .map((i) => i.message)
        .join("; ")}`,
    );
  }
  return {
    apiKey: parsed.data.RESEND_API_KEY,
    from: parsed.data.RESEND_FROM_EMAIL,
    siteUrl: parsed.data.NEXT_PUBLIC_SITE_URL,
  };
}

export interface SendEstimationEmailInput {
  project: ProjectStepValues;
  estimate: ProjectEstimate;
  locale: "fr" | "en";
  hqOseEligible: boolean;
  /**
   * The user ticked the "request a real quote from Lightbase" checkbox.
   * When `true`, the subject line is flagged and the BCC inbox can route it
   * as a sales lead instead of a passive notification.
   */
  requestQuote?: boolean;
}

export interface SendEstimationEmailResult {
  /** Resend message id of the email sent to the client. */
  id: string;
  /** Resend message id of the internal lead notice (if RESEND_BCC_EMAIL set). */
  internalId?: string;
}

/**
 * Render and send the report:
 *   1) A client-facing email at the contact address with a clean bilan.
 *   2) An internal lead notice to RESEND_BCC_EMAIL (if configured) that
 *      includes the contact info card and the quote-requested banner so
 *      the Lightbase team can route it as a sales opportunity.
 *
 * The two are sent as separate messages instead of using `bcc`, so that
 * the client never sees internal-only sections, and the team email can be
 * filtered/forwarded independently.
 *
 * Throws if the client email fails. The internal email is best-effort: a
 * failure there is logged but doesn't block the client receiving theirs.
 */
export async function sendEstimationEmail(
  input: SendEstimationEmailInput,
): Promise<SendEstimationEmailResult> {
  const { apiKey, from, siteUrl } = readEnv();
  const resend = new Resend(apiKey);

  const projectLabel = input.project.name || input.project.municipality;

  // ─── 1) Client email ─────────────────────────────────────────────────
  const clientElement = EstimationReport({
    project: input.project,
    estimate: input.estimate,
    locale: input.locale,
    hqOseEligible: input.hqOseEligible,
    // Client doesn't see the "quote requested" banner; they're the one
    // who ticked it, no point reminding them.
    requestQuote: false,
    forInternalTeam: false,
    baseUrl: siteUrl,
  });
  const [clientHtml, clientText] = await Promise.all([
    render(clientElement),
    render(clientElement, { plainText: true }),
  ]);
  const clientSubject =
    input.locale === "en"
      ? `Lightpro OM estimation: ${projectLabel}`
      : `Estimation Lightpro OM : ${projectLabel}`;

  const { data: clientData, error: clientError } = await resend.emails.send({
    from,
    to: [input.project.contactEmail],
    subject: clientSubject,
    html: clientHtml,
    text: clientText,
  });
  if (clientError) {
    throw new Error(
      `Resend error (client): ${clientError.name}: ${clientError.message}`,
    );
  }
  if (!clientData?.id) {
    throw new Error("Resend returned no message id for client email");
  }

  // ─── 2) Internal lead notice (best-effort) ───────────────────────────
  const teamAddresses = parseRecipients(process.env.RESEND_BCC_EMAIL);
  let internalId: string | undefined;
  if (teamAddresses.length > 0) {
    try {
      const internalElement = EstimationReport({
        project: input.project,
        estimate: input.estimate,
        locale: input.locale,
        hqOseEligible: input.hqOseEligible,
        requestQuote: input.requestQuote,
        forInternalTeam: true,
        baseUrl: siteUrl,
      });
      const [internalHtml, internalText] = await Promise.all([
        render(internalElement),
        render(internalElement, { plainText: true }),
      ]);
      const quoteTag = input.requestQuote
        ? input.locale === "en"
          ? "[Quote requested] "
          : "[Devis demandé] "
        : "";
      const leadTag =
        input.locale === "en" ? "[Lead] " : "[Lead] ";
      const internalSubject =
        input.locale === "en"
          ? `${quoteTag}${leadTag}${projectLabel} · ${input.project.contactName}`
          : `${quoteTag}${leadTag}${projectLabel} · ${input.project.contactName}`;

      const { data: teamData, error: teamError } = await resend.emails.send({
        from,
        to: teamAddresses,
        subject: internalSubject,
        html: internalHtml,
        text: internalText,
        // Set reply-to to the client so the team can reach them directly.
        replyTo: input.project.contactEmail,
      });
      if (teamError) {
        console.error(
          `[email] internal notice failed: ${teamError.name}: ${teamError.message}`,
        );
      } else {
        internalId = teamData?.id;
      }
    } catch (err) {
      console.error("[email] internal notice threw", err);
    }
  }

  return { id: clientData.id, internalId };
}
