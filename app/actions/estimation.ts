"use server";

import { z } from "zod";
import {
  fieldSchema,
  projectStepSchema,
  type ProjectStepValues,
  type FieldValues,
} from "@/lib/estimation/schema";
import { estimateProject } from "@/lib/estimation/estimate";
import { sendEstimationEmail } from "@/lib/email/send-estimation";

/**
 * Schema for the server-side input. Zod validates the entire payload before
 * any side-effects (DB write, email send). Form validation in the client is
 * decoupled — the server is the source of truth.
 */
const submitSchema = z.object({
  project: projectStepSchema,
  fields: z.array(fieldSchema).min(1, "At least one field is required"),
  hqOseEligible: z.boolean(),
  /**
   * User explicitly asked the Lightbase team to follow up with a detailed,
   * priced estimate (vs. the auto-generated indicative bilan). When `true`
   * the email/BCC flow can tag it as a sales lead.
   */
  requestQuote: z.boolean().default(false),
  locale: z.enum(["fr", "en"]).default("fr"),
});

export interface SubmitSuccess {
  ok: true;
  emailId: string;
}

export interface SubmitFailure {
  ok: false;
  error: string;
  fieldErrors?: Record<string, string[]>;
}

export type SubmitResponse = SubmitSuccess | SubmitFailure;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unexpected error";
}

export async function submitEstimation(
  raw: unknown,
  localeArg?: "fr" | "en",
): Promise<SubmitResponse> {
  const parsed = submitSchema.safeParse(
    typeof raw === "object" && raw !== null && "locale" in raw
      ? raw
      : { ...(raw as object), locale: localeArg ?? "fr" },
  );

  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const { project, fields, hqOseEligible, requestQuote, locale } = parsed.data;
  const projectInput: ProjectStepValues = project;
  const fieldsInput: FieldValues[] = fields;

  const estimate = estimateProject(fieldsInput);

  try {
    const { id } = await sendEstimationEmail({
      project: projectInput,
      estimate,
      locale,
      hqOseEligible,
      requestQuote,
    });
    return { ok: true, emailId: id };
  } catch (error: unknown) {
    console.error("[submitEstimation] email send failed", error);
    return {
      ok: false,
      error: getErrorMessage(error),
    };
  }
}
