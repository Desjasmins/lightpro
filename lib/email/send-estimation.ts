/**
 * Server-only helper that renders the estimation email via react-email and
 * sends it through Resend. Never import this from a client component — the
 * Resend API key must remain on the server.
 */
import "server-only";

import { render } from "@react-email/components";
import { Resend } from "resend";
import { z } from "zod";
import { EstimationReport } from "@/emails/EstimationReport";
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
  id: string;
}

/**
 * Render the report email and send it to the contact email on file.
 * Returns the Resend message id on success; throws on failure.
 */
export async function sendEstimationEmail(
  input: SendEstimationEmailInput,
): Promise<SendEstimationEmailResult> {
  const { apiKey, from, siteUrl } = readEnv();
  const resend = new Resend(apiKey);

  const element = EstimationReport({
    project: input.project,
    estimate: input.estimate,
    locale: input.locale,
    hqOseEligible: input.hqOseEligible,
    requestQuote: input.requestQuote,
    baseUrl: siteUrl,
  });

  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);

  const projectLabel =
    input.project.name || input.project.municipality;
  const quoteTag = input.requestQuote
    ? input.locale === "en"
      ? "[Quote requested] "
      : "[Devis demandé] "
    : "";
  const subject =
    input.locale === "en"
      ? `${quoteTag}Lightpro OM estimation — ${projectLabel}`
      : `${quoteTag}Estimation Lightpro OM — ${projectLabel}`;

  const { data, error } = await resend.emails.send({
    from,
    to: [input.project.contactEmail],
    subject,
    html,
    text,
    // Optionally BCC the Lightbase sales inbox for visibility.
    ...(process.env.RESEND_BCC_EMAIL
      ? { bcc: [process.env.RESEND_BCC_EMAIL] }
      : {}),
  });

  if (error) {
    throw new Error(`Resend error: ${error.name} — ${error.message}`);
  }
  if (!data?.id) {
    throw new Error("Resend returned no message id");
  }
  return { id: data.id };
}
