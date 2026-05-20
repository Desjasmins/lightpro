import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { Resend } from "resend";
import { brand, fonts } from "@/emails/styles";

/**
 * Gate verification helpers — OTP code generation, magic-link token sign /
 * verify, and the three transactional emails fired around the gate flow:
 *
 *   1. Verification email     → visitor (code + magic link)
 *   2. NDA confirmation email → visitor (after they verify, best-effort)
 *   3. Internal notification  → Lightbase team (after verify, best-effort)
 *
 * All emails inline a dark Lightbase look using the same brand tokens as the
 * estimation report. Email clients ignore web fonts, so we fall back to
 * system stacks.
 */

export const VERIFICATION_TTL_SECONDS = 15 * 60;
export const CODE_LENGTH = 6;

// No 0/O, 1/I/L — avoid ambiguity in serif/handwritten contexts.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export interface VerificationTokenPayload {
  /** gate_leads row id (uuid). */
  i: string;
  /** Expiry, unix seconds. */
  x: number;
}

// ─── Code + token primitives ─────────────────────────────────────────────────

export function generateVerificationCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

export function normaliseCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
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

export function issueVerificationToken(leadId: string): string {
  const payload: VerificationTokenPayload = {
    i: leadId,
    x: Math.floor(Date.now() / 1000) + VERIFICATION_TTL_SECONDS,
  };
  const payloadB64 = b64urlEncode(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function verifyVerificationToken(
  raw: string | undefined | null,
): VerificationTokenPayload | null {
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
    ) as VerificationTokenPayload;
    if (typeof payload.i !== "string" || typeof payload.x !== "number") {
      return null;
    }
    if (payload.x < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ─── Email plumbing ──────────────────────────────────────────────────────────

export type SendResult = { ok: true } | { ok: false; reason: string };

function readResendConfig():
  | { ok: true; apiKey: string; from: string }
  | { ok: false; reason: string } {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey) return { ok: false, reason: "missing_api_key" };
  if (!from) return { ok: false, reason: "missing_from_email" };
  return { ok: true, apiKey, from };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface EmailFrame {
  subject: string;
  preheader: string;
  html: string;
  text: string;
}

// ─── 1) Verification email (code + magic link) ───────────────────────────────

interface SendVerificationArgs {
  recipientName: string;
  recipientEmail: string;
  code: string;
  link: string;
  lang: "fr" | "en";
}

export async function sendVerificationEmail(
  args: SendVerificationArgs,
): Promise<SendResult> {
  const cfg = readResendConfig();
  if (!cfg.ok) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, reason: cfg.reason };
    }
    console.info("[gate/verification] dev fallback (no Resend config)", {
      to: args.recipientEmail,
      code: args.code,
      link: args.link,
    });
    return { ok: true };
  }

  const frame =
    args.lang === "en" ? buildVerificationEn(args) : buildVerificationFr(args);

  const resend = new Resend(cfg.apiKey);
  const { data, error } = await resend.emails.send({
    from: cfg.from,
    to: [args.recipientEmail],
    subject: frame.subject,
    html: frame.html,
    text: frame.text,
  });
  if (error) {
    console.error("[gate/verification] verification email send failed", {
      name: error.name,
      message: error.message,
    });
    return { ok: false, reason: `resend_${error.name}` };
  }
  if (!data?.id) return { ok: false, reason: "no_message_id" };
  return { ok: true };
}

function buildVerificationFr(a: SendVerificationArgs): EmailFrame {
  return buildVerificationFrame(a, {
    subjectText: "Lightbase : code d'accès à l'outil d'estimation",
    preheader: "Voici votre code d'accès à l'outil Lightpro OM.",
    hello: "Bonjour",
    intro:
      "Voici votre code d'accès personnel à l'outil d'estimation Lightpro OM.",
    codeLabel: "Votre code",
    orCta: "Ou ouvrez l'outil en un clic",
    ctaText: "Accéder à l'outil",
    expiry: "Ce code expire dans 15 minutes.",
    spam:
      'Vous ne voyez pas cet email ? Pensez à vérifier votre dossier <strong>spam / courrier indésirable</strong>.',
    ignore:
      "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce courriel.",
    signature: "Lightbase",
  });
}

function buildVerificationEn(a: SendVerificationArgs): EmailFrame {
  return buildVerificationFrame(a, {
    subjectText: "Lightbase: estimation tool access code",
    preheader: "Your personal access code for the Lightpro OM tool.",
    hello: "Hello",
    intro:
      "Here is your personal access code for the Lightpro OM estimation tool.",
    codeLabel: "Your code",
    orCta: "Or open the tool in one click",
    ctaText: "Access the tool",
    expiry: "This code expires in 15 minutes.",
    spam:
      "Don't see this email? Please check your <strong>spam / junk folder</strong>.",
    ignore:
      "If you did not request this, you can safely ignore this message.",
    signature: "Lightbase",
  });
}

interface VerificationCopy {
  subjectText: string;
  preheader: string;
  hello: string;
  intro: string;
  codeLabel: string;
  orCta: string;
  ctaText: string;
  expiry: string;
  spam: string;
  ignore: string;
  signature: string;
}

function buildVerificationFrame(
  a: SendVerificationArgs,
  copy: VerificationCopy,
): EmailFrame {
  const html = `<!doctype html>
<html lang="${a.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escapeHtml(copy.subjectText)}</title>
</head>
<body style="margin:0;padding:0;background:${brand.ink};color:${brand.white};font-family:${fonts.sans};-webkit-font-smoothing:antialiased;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
${escapeHtml(copy.preheader)}
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${brand.ink};">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:${brand.ink2};border:1px solid ${brand.ink3};border-left:2px solid ${brand.glow};">
        <tr>
          <td style="padding:28px 36px 18px;border-bottom:1px solid ${brand.ink3};">
            <div style="font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:${brand.fog};">Lightbase</div>
            <div style="font-size:24px;letter-spacing:-.01em;color:${brand.glow};margin-top:6px;font-weight:600;">Lightpro OM</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 36px 0;">
            <p style="margin:0 0 8px;font-size:16px;color:${brand.mist};">${escapeHtml(copy.hello)} ${escapeHtml(a.recipientName)},</p>
            <p style="margin:0;font-size:14px;line-height:1.6;color:${brand.mist};">${escapeHtml(copy.intro)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 8px;">
            <div style="font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:${brand.fog};margin-bottom:10px;">${escapeHtml(copy.codeLabel)}</div>
            <div style="background:${brand.ink};border:1px solid ${brand.ink3};border-left:2px solid ${brand.glow};padding:28px 18px;text-align:center;">
              <div style="font-family:'Courier New','SF Mono',Menlo,Consolas,monospace;font-size:44px;line-height:1;letter-spacing:.2em;font-weight:700;color:${brand.glow};">${escapeHtml(a.code)}</div>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 36px 8px;">
            <p style="margin:0 0 14px;font-size:13px;color:${brand.fog};text-align:center;font-style:italic;">${escapeHtml(copy.orCta)}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center">
                  <a href="${a.link}" target="_blank" rel="noopener" style="display:inline-block;background:${brand.glow};color:${brand.ink};font-size:13px;letter-spacing:.18em;text-transform:uppercase;font-weight:600;padding:13px 28px;text-decoration:none;border:1px solid ${brand.glowSoft};">
                    ${escapeHtml(copy.ctaText)} &nbsp;→
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:30px 36px 8px;">
            <p style="margin:0 0 10px;font-size:13px;color:${brand.fog};text-align:center;font-style:italic;">${escapeHtml(copy.expiry)}</p>
            <p style="margin:0;font-size:13px;color:${brand.fog};text-align:center;line-height:1.55;font-style:italic;">${copy.spam}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:26px 36px 32px;border-top:1px solid ${brand.ink3};">
            <p style="margin:0 0 8px;font-size:12px;color:${brand.fog};line-height:1.55;font-style:italic;">${escapeHtml(copy.ignore)}</p>
            <p style="margin:14px 0 0;font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:${brand.fog};">${escapeHtml(copy.signature)}</p>
          </td>
        </tr>
      </table>
      <p style="margin:18px 0 0;font-size:11px;color:${brand.fog};font-style:italic;">Lightbase · Montréal, Québec, Canada</p>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = [
    `${copy.hello} ${a.recipientName},`,
    "",
    copy.intro,
    "",
    `${copy.codeLabel}: ${a.code}`,
    "",
    `${copy.orCta}:`,
    a.link,
    "",
    copy.expiry,
    copy.spam.replace(/<[^>]+>/g, ""),
    "",
    copy.ignore,
    "",
    copy.signature,
  ].join("\n");

  return {
    subject: copy.subjectText,
    preheader: copy.preheader,
    html,
    text,
  };
}

// ─── 2) NDA confirmation (post-verify, best-effort) ──────────────────────────

interface SendNdaConfirmationArgs {
  recipientName: string;
  recipientEmail: string;
  lang: "fr" | "en";
  termsVersion: string;
}

interface NdaClause {
  num: string;
  title: string;
  body: string;
}

interface NdaCopy {
  subject: string;
  preheader: string;
  hello: string;
  thanks: string;
  recap: string;
  ndaTitle: string;
  ndaVersion: string;
  engagement: string;
  clauses: NdaClause[];
  closing: string;
  contactLine: string;
  contactCta: string;
  signature: string;
}

const NDA_COPY_FR: NdaCopy = {
  subject: "Lightbase : confirmation d'accès à l'outil d'estimation",
  preheader:
    "Merci de votre intérêt pour Lightpro OM. Rappel des engagements de confidentialité acceptés.",
  hello: "Bonjour",
  thanks:
    "Merci de votre intérêt pour l'outil d'estimation <strong>Lightpro OM</strong>. Votre accès est confirmé.",
  recap:
    "À titre de rappel, voici les engagements de confidentialité que vous avez acceptés lors de votre inscription :",
  ndaTitle: "Entente de confidentialité",
  ndaVersion: "Régie par les lois du Québec et du Canada",
  engagement:
    "En accédant à ce dossier, le Destinataire reconnaît et accepte ce qui suit :",
  clauses: [
    {
      num: "1",
      title: "Utilisation limitée",
      body: "Les informations confidentielles sont fournies uniquement dans le but d'évaluer un projet potentiel, une solution, une collaboration ou un processus d'analyse interne.",
    },
    {
      num: "2",
      title: "Confidentialité",
      body: "Le Destinataire s'engage à protéger les informations confidentielles avec un niveau de diligence raisonnable et à ne pas les divulguer à des tiers non autorisés, sauf aux employés, consultants ou représentants ayant besoin d'en prendre connaissance dans le cadre de leur mandat.",
    },
    {
      num: "3",
      title: "Aucun engagement contractuel",
      body: "La consultation du présent dossier ne constitue ni une offre, ni un engagement contractuel, ni une promesse d'octroi de contrat, ni un processus d'appel d'offres, ni une obligation d'affaires entre les parties.",
    },
    {
      num: "4",
      title: "Propriété intellectuelle",
      body: "Tous les documents, concepts, visuels, méthodologies, systèmes, dessins, études et contenus demeurent la propriété exclusive de Lightbase, sauf entente écrite contraire.",
    },
    {
      num: "5",
      title: "Durée",
      body: "Les obligations de confidentialité demeurent en vigueur pour une période de vingt-quatre (24) mois suivant l'accès au dossier.",
    },
  ],
  closing:
    "La présente entente est régie par les lois applicables de la province de Québec et du Canada.",
  contactLine:
    "Pour toute question ou pour échanger directement avec l'équipe, n'hésitez pas à nous écrire :",
  contactCta: "Nous écrire",
  signature: "Lightbase",
};

const NDA_COPY_EN: NdaCopy = {
  subject: "Lightbase: estimation tool access confirmed",
  preheader:
    "Thank you for your interest in Lightpro OM. Recap of the confidentiality terms you accepted.",
  hello: "Hello",
  thanks:
    "Thank you for your interest in the <strong>Lightpro OM</strong> estimation tool. Your access has been confirmed.",
  recap:
    "As a reminder, here are the confidentiality terms you accepted at signup:",
  ndaTitle: "Confidentiality Agreement",
  ndaVersion: "Governed by the laws of Quebec and Canada",
  engagement:
    "By accessing this dossier, the Recipient acknowledges and agrees to the following:",
  clauses: [
    {
      num: "1",
      title: "Limited Use",
      body: "The confidential information is provided solely for the purpose of evaluating a potential project, solution, collaboration, or internal review process.",
    },
    {
      num: "2",
      title: "Confidentiality",
      body: "The Recipient agrees to protect the confidential information using reasonable care and not to disclose it to unauthorized third parties, except to employees, consultants, or representatives who require access in connection with their mandate.",
    },
    {
      num: "3",
      title: "No Contractual Commitment",
      body: "Access to this dossier does not constitute an offer, a contractual commitment, a promise to award a contract, a public tender process, nor a business obligation between the parties.",
    },
    {
      num: "4",
      title: "Intellectual Property",
      body: "All documents, concepts, visuals, methodologies, systems, drawings, studies, and content remain the exclusive property of Lightbase, unless otherwise agreed in writing.",
    },
    {
      num: "5",
      title: "Term",
      body: "The confidentiality obligations shall remain in effect for twenty-four (24) months following access to the dossier.",
    },
  ],
  closing:
    "This agreement shall be governed by the applicable laws of the Province of Quebec and Canada.",
  contactLine:
    "For any question or to speak directly with the team, please reach out:",
  contactCta: "Write to us",
  signature: "Lightbase",
};

function getContactEmail(): string {
  return process.env.INTERNAL_NOTIFY_EMAIL ?? "info@lightbase.ca";
}

export async function sendNdaConfirmationEmail(
  args: SendNdaConfirmationArgs,
): Promise<SendResult> {
  const cfg = readResendConfig();
  if (!cfg.ok) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, reason: cfg.reason };
    }
    console.info("[gate/verification] dev NDA confirm skipped", {
      to: args.recipientEmail,
    });
    return { ok: true };
  }

  const copy = args.lang === "en" ? NDA_COPY_EN : NDA_COPY_FR;
  const contact = getContactEmail();
  const html = buildNdaConfirmationHtml(args, copy, contact);
  const text = buildNdaConfirmationText(args, copy, contact);

  const resend = new Resend(cfg.apiKey);
  const { data, error } = await resend.emails.send({
    from: cfg.from,
    to: [args.recipientEmail],
    subject: copy.subject,
    html,
    text,
    replyTo: contact,
  });
  if (error) {
    console.error("[gate/verification] NDA confirm send failed", {
      name: error.name,
      message: error.message,
    });
    return { ok: false, reason: `resend_${error.name}` };
  }
  if (!data?.id) return { ok: false, reason: "no_message_id" };
  return { ok: true };
}

function buildNdaConfirmationHtml(
  a: SendNdaConfirmationArgs,
  copy: NdaCopy,
  contact: string,
): string {
  const clauseRows = copy.clauses
    .map(
      (c, idx) => `
      <tr>
        <td style="padding:${idx === 0 ? "0" : "16px 0 0"};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td valign="top" width="42" style="padding:14px 0;border-top:1px solid ${brand.ink3};">
                <div style="font-size:18px;color:${brand.glow};font-weight:600;">${c.num}</div>
              </td>
              <td valign="top" style="padding:14px 0;border-top:1px solid ${brand.ink3};">
                <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:${brand.white};font-weight:600;margin-bottom:6px;">${escapeHtml(c.title)}</div>
                <div style="font-size:13.5px;line-height:1.6;color:${brand.mist};">${escapeHtml(c.body)}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="${a.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escapeHtml(copy.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${brand.ink};color:${brand.white};font-family:${fonts.sans};-webkit-font-smoothing:antialiased;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
${escapeHtml(copy.preheader)}
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${brand.ink};">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;width:100%;background:${brand.ink2};border:1px solid ${brand.ink3};border-left:2px solid ${brand.glow};">
        <tr>
          <td style="padding:28px 36px 18px;border-bottom:1px solid ${brand.ink3};">
            <div style="font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:${brand.fog};">Lightbase</div>
            <div style="font-size:24px;letter-spacing:-.01em;color:${brand.glow};margin-top:6px;font-weight:600;">Lightpro OM</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 36px 0;">
            <p style="margin:0 0 14px;font-size:16px;color:${brand.mist};">${escapeHtml(copy.hello)} ${escapeHtml(a.recipientName)},</p>
            <p style="margin:0;font-size:14.5px;line-height:1.65;color:${brand.mist};">${copy.thanks}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:22px 36px 0;">
            <p style="margin:0;font-size:14px;line-height:1.65;color:${brand.mist};">${escapeHtml(copy.recap)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 36px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${brand.ink};border:1px solid ${brand.ink3};border-left:2px solid ${brand.glow};">
              <tr>
                <td style="padding:22px 26px 6px;">
                  <div style="font-size:16px;letter-spacing:.16em;text-transform:uppercase;color:${brand.white};font-weight:600;">${escapeHtml(copy.ndaTitle)}</div>
                  <div style="font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:${brand.fog};margin-top:6px;">${escapeHtml(copy.ndaVersion)} · v${escapeHtml(a.termsVersion)}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 26px 0;">
                  <p style="margin:0 0 12px;font-size:13.5px;line-height:1.65;color:${brand.mist};">${escapeHtml(copy.engagement)}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:0 26px 8px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${clauseRows}</table>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 26px 22px;border-top:1px solid ${brand.ink3};">
                  <p style="margin:0;font-size:12.5px;line-height:1.65;color:${brand.fog};font-style:italic;">${escapeHtml(copy.closing)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 0;">
            <p style="margin:0 0 14px;font-size:13.5px;line-height:1.65;color:${brand.mist};">${escapeHtml(copy.contactLine)}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="left">
                  <a href="mailto:${contact}" style="display:inline-block;background:${brand.glow};color:${brand.ink};font-size:13px;letter-spacing:.18em;text-transform:uppercase;font-weight:600;padding:11px 24px;text-decoration:none;border:1px solid ${brand.glowSoft};">
                    ${escapeHtml(copy.contactCta)} &nbsp;→
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:14px 0 0;font-size:13px;color:${brand.fog};">
              <a href="mailto:${contact}" style="color:${brand.glow};text-decoration:none;">${contact}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 32px;border-top:1px solid ${brand.ink3};">
            <p style="margin:0;font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:${brand.fog};">${escapeHtml(copy.signature)}</p>
          </td>
        </tr>
      </table>
      <p style="margin:18px 0 0;font-size:11px;color:${brand.fog};font-style:italic;">Lightbase · Montréal, Québec, Canada</p>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function buildNdaConfirmationText(
  a: SendNdaConfirmationArgs,
  copy: NdaCopy,
  contact: string,
): string {
  const lines: string[] = [];
  lines.push(`${copy.hello} ${a.recipientName},`);
  lines.push("");
  lines.push(copy.thanks.replace(/<[^>]+>/g, ""));
  lines.push("");
  lines.push(copy.recap);
  lines.push("");
  lines.push(`=== ${copy.ndaTitle} ===`);
  lines.push(`${copy.ndaVersion} · v${a.termsVersion}`);
  lines.push("");
  lines.push(copy.engagement);
  lines.push("");
  for (const c of copy.clauses) {
    lines.push(`${c.num}. ${c.title.toUpperCase()}`);
    lines.push(`   ${c.body}`);
    lines.push("");
  }
  lines.push(copy.closing);
  lines.push("");
  lines.push(copy.contactLine);
  lines.push(contact);
  lines.push("");
  lines.push(copy.signature);
  return lines.join("\n");
}

// ─── 3) Internal notification (Lightbase team alert, best-effort) ───────────

interface InternalNotifyArgs {
  visitorName: string;
  visitorEmail: string;
  visitorOrganization: string | null;
  visitorOrganizationType: string | null;
  visitorLang: "fr" | "en";
  verifiedAt: Date;
  verificationMethod: "code" | "magic_link";
}

export async function sendInternalAccessNotification(
  args: InternalNotifyArgs,
): Promise<SendResult> {
  const cfg = readResendConfig();
  if (!cfg.ok) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, reason: cfg.reason };
    }
    console.info("[gate/verification] dev internal notif skipped");
    return { ok: true };
  }

  const to = process.env.INTERNAL_NOTIFY_EMAIL;
  if (!to) {
    return { ok: false, reason: "no_recipient_configured" };
  }

  const subject = buildInternalSubject(args);
  const html = buildInternalHtml(args);
  const text = buildInternalText(args);

  const resend = new Resend(cfg.apiKey);
  const { data, error } = await resend.emails.send({
    from: cfg.from,
    to: [to],
    subject,
    html,
    text,
    replyTo: args.visitorEmail,
  });
  if (error) {
    console.error("[gate/verification] internal notif send failed", {
      name: error.name,
      message: error.message,
    });
    return { ok: false, reason: `resend_${error.name}` };
  }
  if (!data?.id) return { ok: false, reason: "no_message_id" };
  return { ok: true };
}

function buildInternalSubject(a: InternalNotifyArgs): string {
  const who = a.visitorOrganization
    ? `${a.visitorName} (${a.visitorOrganization})`
    : a.visitorName;
  return `Nouvel accès Lightpro OM : ${who}`;
}

function formatVerifiedAt(d: Date): string {
  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Montreal",
  }).format(d);
}

function buildInternalHtml(a: InternalNotifyArgs): string {
  const org = a.visitorOrganization?.trim() || "N/A";
  const orgType = a.visitorOrganizationType ?? "N/A";
  const method =
    a.verificationMethod === "magic_link" ? "Lien magique" : "Code par email";
  const verifiedAt = formatVerifiedAt(a.verifiedAt);
  const visitorLang = a.visitorLang === "en" ? "EN" : "FR";

  const row = (label: string, value: string, valueColor = brand.white): string => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${brand.ink3};vertical-align:top;width:42%;">
        <div style="font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:${brand.fog};">${escapeHtml(label)}</div>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid ${brand.ink3};vertical-align:top;">
        <div style="font-size:14px;line-height:1.5;color:${valueColor};word-break:break-word;">${value}</div>
      </td>
    </tr>`;

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escapeHtml(buildInternalSubject(a))}</title>
</head>
<body style="margin:0;padding:0;background:${brand.ink};color:${brand.white};font-family:${fonts.sans};-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${brand.ink};">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:${brand.ink2};border:1px solid ${brand.ink3};border-left:2px solid ${brand.glow};">
        <tr>
          <td style="padding:24px 32px 16px;border-bottom:1px solid ${brand.ink3};">
            <div style="font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:${brand.fog};">Lightbase · Notification interne</div>
            <div style="font-size:22px;letter-spacing:-.01em;color:${brand.glow};margin-top:8px;font-weight:600;">Nouvel accès à l'outil</div>
          </td>
        </tr>
        <tr>
          <td style="padding:26px 32px 0;">
            <p style="margin:0;font-size:14.5px;line-height:1.6;color:${brand.mist};">
              <strong style="color:${brand.white};">${escapeHtml(a.visitorName)}</strong>
              ${org !== "N/A" ? `(<span style=\"color:${brand.glow};\">${escapeHtml(org)}</span>)` : ""}
              vient d'accepter le NDA et a accès à l'outil d'estimation Lightpro OM.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              ${row("Nom", escapeHtml(a.visitorName))}
              ${row("Organisation", org === "N/A" ? `<span style=\"color:${brand.fog};\">N/A</span>` : escapeHtml(org))}
              ${row("Type", escapeHtml(orgType))}
              ${row(
                "Courriel",
                `<a href=\"mailto:${a.visitorEmail}\" style=\"color:${brand.glow};text-decoration:none;\">${escapeHtml(a.visitorEmail)}</a>`,
              )}
              ${row("Langue", visitorLang)}
              ${row("Méthode", method)}
              ${row("Vérifié le", escapeHtml(verifiedAt))}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px 0;">
            <p style="margin:0 0 12px;font-size:13px;color:${brand.fog};font-style:italic;">Répondre à ce courriel écrit directement au visiteur.</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="left">
                  <a href="mailto:${a.visitorEmail}" style="display:inline-block;background:${brand.glow};color:${brand.ink};font-size:13px;letter-spacing:.18em;text-transform:uppercase;font-weight:600;padding:11px 22px;text-decoration:none;border:1px solid ${brand.glowSoft};">
                    Écrire au visiteur &nbsp;→
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:26px 32px 30px;border-top:1px solid ${brand.ink3};">
            <p style="margin:0;font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:${brand.fog};">Lightbase</p>
          </td>
        </tr>
      </table>
      <p style="margin:18px 0 0;font-size:11px;color:${brand.fog};font-style:italic;">Lightbase · Montréal, Québec, Canada</p>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function buildInternalText(a: InternalNotifyArgs): string {
  const org = a.visitorOrganization?.trim() || "N/A";
  const orgType = a.visitorOrganizationType ?? "N/A";
  const method =
    a.verificationMethod === "magic_link" ? "Lien magique" : "Code par email";
  const verifiedAt = formatVerifiedAt(a.verifiedAt);
  const visitorLang = a.visitorLang === "en" ? "EN" : "FR";

  return [
    `=== NOUVEL ACCÈS LIGHTPRO OM ===`,
    ``,
    `${a.visitorName}${org !== "N/A" ? ` (${org})` : ""} vient d'accepter le NDA.`,
    ``,
    `Nom         : ${a.visitorName}`,
    `Organisation: ${org}`,
    `Type        : ${orgType}`,
    `Courriel    : ${a.visitorEmail}`,
    `Langue      : ${visitorLang}`,
    `Méthode     : ${method}`,
    `Vérifié le  : ${verifiedAt}`,
    ``,
    `Répondre à ce courriel écrit directement au visiteur.`,
    ``,
    `Lightbase`,
  ].join("\n");
}
