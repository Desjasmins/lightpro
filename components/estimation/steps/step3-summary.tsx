"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { estimateProject } from "@/lib/estimation/estimate";
import type {
  CostBreakdown,
  FieldEstimate,
} from "@/lib/estimation/estimate";
import type { EstimationDraft } from "@/lib/estimation/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Info,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

interface StepProps {
  draft: EstimationDraft;
  update: (patch: Partial<EstimationDraft>) => void;
  onNext: () => void;
  onPrev: () => void;
}

function formatCad(n: number, locale: string): string {
  return new Intl.NumberFormat(locale === "en" ? "en-CA" : "fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function Step3Summary({ draft, update, onNext, onPrev }: StepProps) {
  const t = useTranslations("Estimation");
  const tStep = useTranslations("Estimation.step5");
  const tStep4 = useTranslations("Estimation.step4");
  const tSports = useTranslations("Sports");
  const tIes = useTranslations("IesClasses");
  const locale = useLocale();

  const project = useMemo(
    () => (draft.fields.length === 0 ? null : estimateProject(draft.fields)),
    [draft.fields],
  );

  if (!project) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">
          {locale === "en"
            ? "No field yet — go back and add at least one terrain."
            : "Aucun terrain — retournez ajouter au moins un terrain."}
        </p>
        <Button onClick={onPrev} className="rounded-full">
          {t("previous")}
        </Button>
      </div>
    );
  }

  const hasAnyB = project.totalScenarioB !== null;
  const totalA = project.totalScenarioA;
  const totalB = project.totalScenarioB ?? totalA;
  const delta = project.deltaCost ?? 0;
  const deltaDirection: "higher" | "lower" | "equal" =
    delta > 0 ? "higher" : delta < 0 ? "lower" : "equal";

  // Aggregate verdict: NOGO if any field with a standard is NOGO.
  const aggregateVerdict: "GO" | "NOGO" | "NA" = hasAnyB
    ? project.fields.some((f) => f.standard?.goNoGo === "NOGO")
      ? "NOGO"
      : "GO"
    : "NA";

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="lb-h2">{tStep("title")}</h1>
        <p className="lb-lede text-base">{tStep("subtitle")}</p>
      </header>

      {/* ─── Overall verdict + HQ-OSE toggle ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {aggregateVerdict === "GO" ? (
          <Badge
            variant="default"
            className="rounded-full px-3 py-1 bg-green-600"
          >
            <Check size={14} className="mr-1" /> {tStep("verdictGo")}
          </Badge>
        ) : aggregateVerdict === "NA" ? (
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            <Info size={14} className="mr-1" /> {tStep("noStandardAvailable")}
          </Badge>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 bg-card/40">
          <Checkbox
            id="hq-ose-summary"
            checked={draft.hqOseEligible}
            onCheckedChange={(v) => update({ hqOseEligible: v === true })}
          />
          <Label htmlFor="hq-ose-summary" className="cursor-pointer text-xs">
            {tStep4("hqOseEligible")}
          </Label>
        </div>
      </div>

      {/* ─── Project totals — two scenarios side-by-side ─── */}
      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <ScenarioTotal
            title={tStep("scenarioA")}
            subtitle={tStep("scenarioASubtitle")}
            value={formatCad(totalA, locale)}
            tone="neutral"
          />
          <ScenarioTotal
            title={tStep("scenarioB")}
            subtitle={
              hasAnyB
                ? tStep("scenarioBSubtitle")
                : tStep("noStandardAvailable")
            }
            value={hasAnyB ? formatCad(totalB, locale) : "—"}
            tone={hasAnyB ? "primary" : "muted"}
          />
          <DeltaCard
            direction={deltaDirection}
            delta={Math.abs(delta)}
            available={hasAnyB}
            higherLabel={tStep("deltaHigher")}
            lowerLabel={tStep("deltaLower")}
            equalLabel={tStep("deltaEqual")}
            locale={locale}
          />
        </CardContent>
      </Card>

      {/* ─── Per-field detail ─── */}
      <section className="space-y-4">
        <h2 className="lb-h3">{tStep("fieldsHeaderTitle")}</h2>
        <div className="space-y-6">
          {project.fields.map((field) => (
            <FieldComparisonCard
              key={field.fieldId}
              field={field}
              locale={locale}
              tStep={tStep}
              tSports={tSports}
              tIes={tIes}
            />
          ))}
        </div>
      </section>

      {/* ─── Disclaimer ─── */}
      <p className="text-xs leading-relaxed text-muted-foreground border-l-2 border-border pl-4 whitespace-pre-line">
        {tStep("disclaimer")}
      </p>

      {/* ─── Nav ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="rounded-full"
          onClick={onPrev}
        >
          {t("previous")}
        </Button>
        <Button
          type="button"
          size="lg"
          className="rounded-full"
          onClick={onNext}
        >
          {tStep("continueToContact")}
          <ArrowRight size={14} className="ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────

function ScenarioTotal({
  title,
  subtitle,
  value,
  tone,
}: {
  title: string;
  subtitle: string;
  value: string;
  tone: "neutral" | "primary" | "muted";
}) {
  const valueClass =
    tone === "primary"
      ? "text-foreground"
      : tone === "muted"
        ? "text-muted-foreground"
        : "text-foreground";
  return (
    <div className="space-y-1.5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <p className={cn("text-3xl font-semibold tabular-nums", valueClass)}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function DeltaCard({
  direction,
  delta,
  available,
  higherLabel,
  lowerLabel,
  equalLabel,
  locale,
}: {
  direction: "higher" | "lower" | "equal";
  delta: number;
  available: boolean;
  higherLabel: string;
  lowerLabel: string;
  equalLabel: string;
  locale: string;
}) {
  if (!available) {
    return (
      <div className="space-y-1.5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Delta
        </p>
        <p className="text-3xl font-semibold tabular-nums text-muted-foreground">
          —
        </p>
      </div>
    );
  }
  const label =
    direction === "higher"
      ? higherLabel
      : direction === "lower"
        ? lowerLabel
        : equalLabel;
  const icon =
    direction === "higher" ? (
      <TrendingUp size={16} className="text-amber-500" />
    ) : direction === "lower" ? (
      <TrendingDown size={16} className="text-green-600" />
    ) : null;
  const sign = direction === "higher" ? "+" : direction === "lower" ? "−" : "";
  return (
    <div className="space-y-1.5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
        {icon} {label}
      </p>
      <p
        className={cn(
          "text-3xl font-semibold tabular-nums",
          direction === "higher" && "text-amber-600",
          direction === "lower" && "text-green-700",
        )}
      >
        {sign}
        {formatCad(delta, locale)}
      </p>
    </div>
  );
}

function FieldComparisonCard({
  field,
  locale,
  tStep,
  tSports,
  tIes,
}: {
  field: FieldEstimate;
  locale: string;
  tStep: ReturnType<typeof useTranslations>;
  tSports: ReturnType<typeof useTranslations>;
  tIes: ReturnType<typeof useTranslations>;
}) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h3 className="text-base font-semibold">{field.fieldName}</h3>
            <p className="text-xs text-muted-foreground">
              {tSports(field.sport)} · {tIes(field.iesClass)} ·{" "}
              {new Intl.NumberFormat(
                locale === "en" ? "en-CA" : "fr-CA",
              ).format(Math.round(field.surfaceM2))}{" "}
              m²
            </p>
          </div>
          {field.standard ? (
            field.standard.goNoGo === "GO" ? (
              <Badge variant="default" className="bg-green-600 rounded-full">
                <Check size={12} className="mr-1" />
                {tStep("verdictGoLabel")}
              </Badge>
            ) : (
              <Badge variant="destructive" className="rounded-full">
                <AlertTriangle size={12} className="mr-1" />
                {tStep("verdictNogoLabel")}
              </Badge>
            )
          ) : (
            <Badge variant="secondary" className="rounded-full">
              <Info size={12} className="mr-1" />
              {tStep("noStandardAvailable")}
            </Badge>
          )}
        </div>

        {/* Side-by-side scenarios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ScenarioColumn
            title={tStep("scenarioA")}
            subtitle={tStep("scenarioASubtitle")}
            breakdown={field.scenarioA}
            polesExisting={field.scenarioA.qtyPolesExisting}
            tStep={tStep}
            locale={locale}
            highlight={false}
          />
          {field.scenarioB && field.standard ? (
            <ScenarioColumn
              title={tStep("scenarioB")}
              subtitle={`${tStep("targetLuxLabel")}: ${field.standard.targetLux} lux`}
              breakdown={field.scenarioB}
              polesExisting={field.standard.existingPoles}
              tStep={tStep}
              locale={locale}
              highlight
              extraInfo={
                <>
                  <p className="text-xs text-muted-foreground">
                    {tStep("referenceLabel")} :{" "}
                    <span className="font-medium text-foreground">
                      {field.standard.referenceLabel}
                    </span>
                  </p>
                  {field.standard.goNoGoReasons.length > 0 ? (
                    <ul className="text-xs space-y-0.5 mt-2">
                      {field.standard.goNoGoReasons.map((r) => (
                        <li
                          key={r}
                          className="inline-flex items-center gap-1.5 text-destructive"
                        >
                          <AlertTriangle size={11} />
                          {r === "INSUFFICIENT_POLES"
                            ? tStep("reasonInsufficientPoles", {
                                missing: field.standard!.missingPoles,
                              })
                            : tStep("reasonInsufficientHeight", {
                                required: field.standard!.requiredHeightM,
                              })}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </>
              }
            />
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5 flex flex-col items-center justify-center text-center">
              <Info size={20} className="text-muted-foreground mb-2" />
              <p className="text-sm font-medium">
                {tStep("noStandardAvailable")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {tStep("noStandardBody")}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ScenarioColumn({
  title,
  subtitle,
  breakdown,
  polesExisting,
  tStep,
  locale,
  highlight,
  extraInfo,
}: {
  title: string;
  subtitle: string;
  breakdown: CostBreakdown;
  polesExisting: number;
  tStep: ReturnType<typeof useTranslations>;
  locale: string;
  highlight: boolean;
  extraInfo?: React.ReactNode;
}) {
  const rows: { label: string; value: number }[] = [
    { label: tStep("breakdownLuminaires"), value: breakdown.luminairesCost },
    { label: tStep("breakdownVisors"), value: breakdown.visorsCost },
    { label: tStep("breakdownBrackets"), value: breakdown.bracketsCost },
    { label: tStep("breakdownControls"), value: breakdown.controlsCost },
  ];
  if (breakdown.crossarmsCost > 0) {
    rows.push({
      label: tStep("breakdownCrossarms"),
      value: breakdown.crossarmsCost,
    });
  }
  if (breakdown.newPolesCost > 0) {
    rows.push({
      label: tStep("breakdownNewPoles"),
      value: breakdown.newPolesCost,
    });
  }
  rows.push({
    label: tStep("breakdownInstallation"),
    value: breakdown.installationCost,
  });

  return (
    <div
      className={cn(
        "rounded-xl border p-5 space-y-4",
        highlight ? "border-foreground/30 bg-card/60" : "border-border bg-card/30",
      )}
    >
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>

      {/* Top stats: luminaires count + poles */}
      <div className="grid grid-cols-2 gap-3">
        <StatBox
          label={tStep("luminairesLabel")}
          value={breakdown.qtyLuminaires.toString()}
          sub={`LP ${breakdown.variant}`}
        />
        <StatBox
          label={tStep("polesLabel")}
          value={`${polesExisting}${
            breakdown.qtyPolesNew > 0 ? ` + ${breakdown.qtyPolesNew}` : ""
          }`}
          sub={
            breakdown.qtyPolesNew > 0
              ? `${tStep("newPolesLabel")}: ${breakdown.qtyPolesNew}`
              : undefined
          }
        />
      </div>

      {extraInfo}

      {/* Breakdown */}
      <div className="space-y-1.5 text-sm border-t border-border pt-3">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-baseline justify-between gap-3"
          >
            <span className="text-muted-foreground">{r.label}</span>
            <span className="tabular-nums">{formatCad(r.value, locale)}</span>
          </div>
        ))}
      </div>

      {/* Subtotal */}
      <div className="flex items-baseline justify-between gap-3 border-t border-border pt-3">
        <span className="font-medium">{tStep("subtotal")}</span>
        <span className="text-xl font-semibold tabular-nums">
          {formatCad(breakdown.subtotal, locale)}
        </span>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      {sub ? <p className="text-[10px] text-muted-foreground">{sub}</p> : null}
    </div>
  );
}
