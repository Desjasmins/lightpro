"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { calculateEstimation } from "@/lib/estimation/calculate";
import {
  fullEstimationSchema,
  type FullEstimation,
} from "@/lib/estimation/schema";
import type { EstimationDraft } from "@/lib/estimation/store";
import { submitEstimation } from "@/app/actions/estimation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, AlertTriangle, Loader2 } from "lucide-react";

interface StepProps {
  draft: EstimationDraft;
  onPrev: () => void;
  onReset: () => void;
}

function formatCad(n: number, locale: string): string {
  return new Intl.NumberFormat(locale === "en" ? "en-CA" : "fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatNumber(n: number, locale: string, digits = 0): string {
  return new Intl.NumberFormat(locale === "en" ? "en-CA" : "fr-CA", {
    maximumFractionDigits: digits,
  }).format(n);
}

export function Step6Summary({ draft, onPrev, onReset }: StepProps) {
  const t = useTranslations("Estimation");
  const tStep = useTranslations("Estimation.step6");
  const locale = useLocale();

  const candidate: FullEstimation | null = useMemo(() => {
    if (!draft.project || !draft.address) return null;
    const candidate = {
      project: draft.project,
      address: draft.address,
      fields: draft.fields,
      poles: draft.poles,
      configurations: draft.configurations,
      hqOseEligible: draft.hqOseEligible,
    };
    const parsed = fullEstimationSchema.safeParse(candidate);
    return parsed.success ? parsed.data : null;
  }, [draft]);

  const result = useMemo(() => {
    if (!candidate) return null;
    return calculateEstimation(candidate);
  }, [candidate]);

  const submission = useMutation({
    mutationFn: async () => {
      if (!candidate) throw new Error("Invalid draft");
      const response = await submitEstimation(candidate, locale === "en" ? "en" : "fr");
      if (!response.ok) throw new Error(response.error);
      return response;
    },
    onSuccess: () => {
      toast.success(
        locale === "en"
          ? "Estimate saved. We'll be in touch."
          : "Estimation enregistrée. Nous vous recontactons.",
      );
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "Submission failed");
    },
  });

  if (!candidate || !result) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">
          {locale === "en"
            ? "Some fields are missing — go back and complete the previous steps."
            : "Des informations manquent — retournez compléter les étapes précédentes."}
        </p>
        <Button onClick={onPrev} className="rounded-full">
          {t("previous")}
        </Button>
      </div>
    );
  }

  const includedItems = (
    tStep.raw("included") as unknown as string[]
  );
  const notIncludedItems = (
    tStep.raw("notIncluded") as unknown as string[]
  );

  const submitted = submission.isSuccess;

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="lb-h2">{tStep("title")}</h1>
        <p className="lb-lede text-base">{tStep("subtitle")}</p>
      </header>

      <div className="flex items-center gap-3">
        <Badge
          variant={result.verdictGoNoGo === "GO" ? "default" : "destructive"}
          className="rounded-full px-3 py-1"
        >
          {result.verdictGoNoGo === "GO" ? (
            <>
              <Check size={14} className="mr-1" /> {tStep("verdictGo")}
            </>
          ) : (
            <>
              <AlertTriangle size={14} className="mr-1" /> {tStep("verdictNoGo")}
            </>
          )}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            {tStep("scenarioA")}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{locale === "en" ? "Field" : "Terrain"}</TableHead>
                <TableHead>{locale === "en" ? "Product" : "Produit"}</TableHead>
                <TableHead className="text-right">
                  {locale === "en" ? "Qty" : "Qté"}
                </TableHead>
                <TableHead className="text-right">
                  {locale === "en" ? "Price" : "Prix"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.fields.map((f) => (
                <TableRow key={f.fieldId}>
                  <TableCell className="font-medium">{f.fieldName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {f.productCode}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {f.qty}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCad(
                      f.fixturesPriceCad + f.accessoriesPriceCad + f.controlPriceCad,
                      locale,
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 pt-6 text-sm">
          <Row
            label={tStep("totalLuminaires")}
            value={formatCad(result.scenarioATotalPriceCad, locale)}
          />
          <Row
            label={tStep("totalAccessories")}
            value={formatCad(
              result.fields.reduce(
                (a, f) => a + f.accessoriesPriceCad + f.controlPriceCad,
                0,
              ),
              locale,
            )}
          />
          <Row
            label={`${tStep("totalEngineering")} (${formatNumber(result.engineeringHours, locale, 1)} h)`}
            value={formatCad(result.engineeringCostCad, locale)}
          />
          <hr className="lb-rule my-2" />
          <Row
            label={tStep("subtotal")}
            value={formatCad(result.totalCostBeforeRebateCad, locale)}
            strong
          />
          {result.hqOseRebateCad > 0 ? (
            <Row
              label={tStep("rebate")}
              value={`− ${formatCad(result.hqOseRebateCad, locale)}`}
              accent
            />
          ) : null}
          <hr className="lb-rule my-2" />
          <Row
            label={tStep("totalProject")}
            value={formatCad(result.totalCostAfterRebateCad, locale)}
            big
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="lb-eyebrow text-foreground/60 mb-2">
              {tStep("energySavings")}
            </p>
            <p className="lb-h3">
              {formatNumber(result.energySavingsKwhYear, locale)} {tStep("kwhYear")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="lb-eyebrow text-foreground/60 mb-2">
              {tStep("ghgReduction")}
            </p>
            <p className="lb-h3">
              {formatNumber(result.ghgReductionKgYear, locale)} {tStep("kgYear")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="lb-light">
          <CardHeader>
            <CardTitle className="text-base">{tStep("includedTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {includedItems.map((s) => (
                <li key={s} className="flex gap-2">
                  <Check size={16} className="shrink-0 mt-0.5 text-green-700" /> {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tStep("notIncludedTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {notIncludedItems.map((s) => (
                <li key={s} className="flex gap-2">
                  <X size={16} className="shrink-0 mt-0.5 text-destructive" /> {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground border-l-2 border-border pl-4">
        {tStep("disclaimer")}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-6">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="rounded-full"
          onClick={onPrev}
        >
          {t("previous")}
        </Button>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="rounded-full"
            onClick={onReset}
          >
            {tStep("restart")}
          </Button>
          <Button
            type="button"
            size="lg"
            className="rounded-full"
            disabled={submission.isPending || submitted}
            onClick={() => submission.mutate()}
          >
            {submission.isPending ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                …
              </>
            ) : submitted ? (
              <>
                <Check size={14} className="mr-2" /> ✓
              </>
            ) : (
              t("submit")
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface RowProps {
  label: string;
  value: string;
  strong?: boolean;
  big?: boolean;
  accent?: boolean;
}

function Row({ label, value, strong, big, accent }: RowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span
        className={
          big
            ? "text-base font-semibold"
            : accent
              ? "text-accent"
              : "text-muted-foreground"
        }
      >
        {label}
      </span>
      <span
        className={
          big
            ? "text-2xl font-semibold tabular-nums tracking-tight"
            : strong
              ? "font-medium tabular-nums"
              : accent
                ? "tabular-nums text-accent"
                : "tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  );
}
