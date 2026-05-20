"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ORG_TYPES = [
  "municipality",
  "city",
  "mrc",
  "engineering_firm",
  "public_agency",
  "consultant",
  "investor",
  "other",
] as const;

type OrgType = (typeof ORG_TYPES)[number];

interface NdaClause {
  num: string;
  titleKey: string;
  bodyKey: string;
}

const NDA_CLAUSES: NdaClause[] = [
  { num: "1", titleKey: "clause1Title", bodyKey: "clause1Body" },
  { num: "2", titleKey: "clause2Title", bodyKey: "clause2Body" },
  { num: "3", titleKey: "clause3Title", bodyKey: "clause3Body" },
  { num: "4", titleKey: "clause4Title", bodyKey: "clause4Body" },
  { num: "5", titleKey: "clause5Title", bodyKey: "clause5Body" },
  { num: "6", titleKey: "clause6Title", bodyKey: "clause6Body" },
  { num: "7", titleKey: "clause7Title", bodyKey: "clause7Body" },
];

const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "auto" | "dark" | "light";
          appearance?: "always" | "execute" | "interaction-only";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

interface GateClientProps {
  locale: "fr" | "en";
  turnstileSiteKey: string | null;
  verifyStatus: "expired" | "invalid" | "error" | null;
}

type Stage = "form" | "code";

export function GateClient({
  locale,
  turnstileSiteKey,
  verifyStatus,
}: GateClientProps) {
  const t = useTranslations("Gate");

  const [stage, setStage] = React.useState<Stage>("form");
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  // Form fields
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [organization, setOrganization] = React.useState("");
  const [organizationType, setOrganizationType] = React.useState<
    OrgType | undefined
  >(undefined);
  const [accepted, setAccepted] = React.useState(false);
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(
    null,
  );

  // Submission state
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(
    verifyStatus ? mapVerifyStatusError(verifyStatus, t) : null,
  );

  // Code entry stage
  const [code, setCode] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [codeError, setCodeError] = React.useState<string | null>(null);

  const turnstileContainerRef = React.useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = React.useRef<string | null>(null);

  const router = useRouter();

  // ─── Turnstile loader ───────────────────────────────────────────────────
  React.useEffect(() => {
    if (!turnstileSiteKey || stage !== "form") return;
    const siteKey: string = turnstileSiteKey;

    let cancelled = false;

    function mount() {
      if (cancelled) return;
      if (!window.turnstile || !turnstileContainerRef.current) return;
      if (turnstileWidgetIdRef.current) return;
      turnstileWidgetIdRef.current = window.turnstile.render(
        turnstileContainerRef.current,
        {
          sitekey: siteKey,
          theme: "dark",
          callback: (token) => setTurnstileToken(token),
          "expired-callback": () => setTurnstileToken(null),
          "error-callback": () => setTurnstileToken(null),
        },
      );
    }

    if (window.turnstile) {
      mount();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TURNSTILE_SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", mount, { once: true });
      return () => {
        cancelled = true;
        existing.removeEventListener("load", mount);
      };
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", mount, { once: true });
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.removeEventListener("load", mount);
    };
  }, [turnstileSiteKey, stage]);

  const toggleClause = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const canSubmit =
    !submitting &&
    name.trim().length >= 2 &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) &&
    accepted &&
    (turnstileSiteKey ? Boolean(turnstileToken) : true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          organization: organization.trim() || null,
          organization_type: organizationType || null,
          lang: locale,
          accepted_terms: true,
          accepted_at: new Date().toISOString(),
          terms_version: "municipal-v1.0",
          user_agent: navigator.userAgent,
          turnstile_token: turnstileToken ?? undefined,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setSubmitError(body?.error ?? t("submitError"));
        // Reset Turnstile so the user can retry without a stale token.
        if (turnstileWidgetIdRef.current && window.turnstile) {
          window.turnstile.reset(turnstileWidgetIdRef.current);
          setTurnstileToken(null);
        }
        return;
      }

      setStage("code");
    } catch {
      setSubmitError(t("networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setVerifying(true);
    setCodeError(null);

    try {
      const res = await fetch("/api/gate/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim().toUpperCase(),
        }),
      });

      const body = (await res.json().catch(() => null)) as {
        ok?: boolean;
        redirect?: string;
        error?: string;
      } | null;

      if (!res.ok || !body?.ok) {
        if (body?.error === "expired_code") {
          setCodeError(t("expiredCode"));
        } else if (body?.error === "invalid_code") {
          setCodeError(t("invalidCode"));
        } else {
          setCodeError(t("submitError"));
        }
        return;
      }

      router.push(body.redirect ?? `/${locale}/estimation/tool`);
      router.refresh();
    } catch {
      setCodeError(t("networkError"));
    } finally {
      setVerifying(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="lb-container pt-32 pb-24 space-y-10">
      <header className="space-y-3 max-w-3xl">
        <p className="lb-eyebrow text-foreground/60">{t("eyebrow")}</p>
        <h1 className="lb-h1">{t("title")}</h1>
        <p className="lb-lede text-base">{t("subtitle")}</p>
      </header>

      {stage === "form" ? (
        <>
          <NdaCard
            t={t}
            clauses={NDA_CLAUSES}
            expanded={expanded}
            onToggle={toggleClause}
          />

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border bg-card/40 p-6 sm:p-8 space-y-6 max-w-2xl"
          >
            {/* Accept checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                id="gate-accept"
                checked={accepted}
                onCheckedChange={(v) => setAccepted(v === true)}
                className="mt-0.5"
              />
              <span className="text-sm leading-relaxed">
                {t("acceptCheckbox1")}{" "}
                <strong>{t("acceptCheckbox2")}</strong>
              </span>
            </label>

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="gate-name">
                {t("nameLabel")}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="gate-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePh")}
                autoComplete="name"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="gate-email">
                {t("emailLabel")}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="gate-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPh")}
                autoComplete="email"
                required
              />
            </div>

            {/* Organization */}
            <div className="space-y-1.5">
              <Label htmlFor="gate-org">
                {t("orgLabel")}{" "}
                <span className="text-muted-foreground text-xs">
                  ({t("optional")})
                </span>
              </Label>
              <Input
                id="gate-org"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder={t("orgPh")}
                autoComplete="organization"
              />
            </div>

            {/* Organization type */}
            <div className="space-y-1.5">
              <Label htmlFor="gate-org-type">
                {t("orgTypeLabel")}{" "}
                <span className="text-muted-foreground text-xs">
                  ({t("optional")})
                </span>
              </Label>
              <Select
                value={organizationType ?? ""}
                onValueChange={(v) => setOrganizationType(v as OrgType)}
              >
                <SelectTrigger id="gate-org-type">
                  <SelectValue placeholder={t("orgTypePh")} />
                </SelectTrigger>
                <SelectContent>
                  {ORG_TYPES.map((key) => (
                    <SelectItem key={key} value={key}>
                      {t(`orgType_${key}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Turnstile widget */}
            {turnstileSiteKey ? (
              <div className="flex justify-start">
                <div ref={turnstileContainerRef} />
              </div>
            ) : null}

            {/* Error */}
            {submitError ? (
              <p
                role="alert"
                className="text-sm text-destructive border border-destructive/40 bg-destructive/10 rounded-md px-3 py-2"
              >
                {submitError}
              </p>
            ) : null}

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="rounded-full"
              disabled={!canSubmit}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                t("requestAccess")
              )}
            </Button>

            {/* Loi 25 mention */}
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("loi25")}
            </p>
          </form>

          {/* Procurement disclaimer footer */}
          <p className="text-xs italic text-muted-foreground border-t border-border pt-6 max-w-3xl">
            {t("procurementDisclaimer")}
          </p>
        </>
      ) : (
        <CodeEntry
          t={t}
          email={email}
          code={code}
          onCodeChange={setCode}
          verifying={verifying}
          codeError={codeError}
          onSubmit={handleVerifyCode}
          onBack={() => setStage("form")}
        />
      )}
    </div>
  );
}

function mapVerifyStatusError(
  status: "expired" | "invalid" | "error",
  t: ReturnType<typeof useTranslations>,
): string {
  if (status === "expired") return t("magicLinkExpired");
  if (status === "invalid") return t("magicLinkInvalid");
  return t("magicLinkError");
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface NdaCardProps {
  t: ReturnType<typeof useTranslations>;
  clauses: NdaClause[];
  expanded: Set<string>;
  onToggle: (key: string) => void;
}

function NdaCard({ t, clauses, expanded, onToggle }: NdaCardProps) {
  return (
    <section className="rounded-2xl border-l-2 border-l-primary border border-border bg-card/40 p-6 sm:p-8 max-w-3xl">
      <header className="space-y-1">
        <h2 className="text-lg uppercase tracking-[0.16em] font-semibold">
          {t("ndaTitle")}
        </h2>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          v{t("ndaVersion")} · {t("ndaGoverned")}
        </p>
      </header>

      <p className="text-sm leading-relaxed text-muted-foreground mt-5">
        {t("ndaIntro")}
      </p>

      <p className="text-sm leading-relaxed text-muted-foreground mt-3">
        {t("ndaEngagement")}
      </p>

      <ul className="mt-6 space-y-1">
        {clauses.map((c) => {
          const open = expanded.has(c.titleKey);
          return (
            <li
              key={c.titleKey}
              className="border-t border-border first:border-t-0"
            >
              <button
                type="button"
                onClick={() => onToggle(c.titleKey)}
                aria-expanded={open}
                className="w-full flex items-start gap-4 py-4 text-left hover:text-foreground"
              >
                <span className="text-primary font-semibold text-base shrink-0 w-6">
                  {c.num}
                </span>
                <span className="flex-1 text-sm uppercase tracking-[0.14em] font-semibold">
                  {t(c.titleKey)}
                </span>
                <ChevronDown
                  size={16}
                  className={cn(
                    "shrink-0 mt-0.5 text-muted-foreground transition-transform",
                    open && "rotate-180",
                  )}
                />
              </button>
              {open ? (
                <div className="pb-5 pl-10 pr-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {t(c.bodyKey)}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="mt-6 pt-4 border-t border-border text-xs italic leading-relaxed text-muted-foreground">
        {t("ndaClosing")}
      </p>
    </section>
  );
}

interface CodeEntryProps {
  t: ReturnType<typeof useTranslations>;
  email: string;
  code: string;
  onCodeChange: (v: string) => void;
  verifying: boolean;
  codeError: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

function CodeEntry({
  t,
  email,
  code,
  onCodeChange,
  verifying,
  codeError,
  onSubmit,
  onBack,
}: CodeEntryProps) {
  return (
    <section className="max-w-xl rounded-2xl border border-border bg-card/40 p-6 sm:p-8 space-y-6">
      <header className="space-y-2">
        <h2 className="lb-h3 text-2xl font-semibold">{t("codeStageTitle")}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t.rich("codeStageBody", {
            email: () => <strong className="text-foreground">{email}</strong>,
          })}
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="gate-code">{t("codeLabel")}</Label>
          <Input
            id="gate-code"
            value={code}
            onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
            placeholder="ABC234"
            maxLength={8}
            autoComplete="one-time-code"
            inputMode="text"
            spellCheck={false}
            className="font-mono tracking-[0.4em] text-center text-lg"
            required
          />
        </div>

        {codeError ? (
          <p
            role="alert"
            className="text-sm text-destructive border border-destructive/40 bg-destructive/10 rounded-md px-3 py-2"
          >
            {codeError}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            size="lg"
            className="rounded-full"
            disabled={verifying || !code.trim()}
          >
            {verifying ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                {t("verifying")}
              </>
            ) : (
              t("verify")
            )}
          </Button>
          <button
            type="button"
            onClick={onBack}
            className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
          >
            {t("backToForm")}
          </button>
        </div>

        <p className="text-xs italic leading-relaxed text-muted-foreground">
          {t("codeSpamHint")}
        </p>
      </form>
    </section>
  );
}
