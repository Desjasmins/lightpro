"use client";

import { useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import {
  fullEstimationSchema,
  projectStepSchema,
  type ProjectStepValues,
} from "@/lib/estimation/schema";
import { deriveConfigurations } from "@/lib/estimation/config-derive";
import type { EstimationDraft } from "@/lib/estimation/store";
import { calculateEstimation } from "@/lib/estimation/calculate";
import { submitEstimation } from "@/app/actions/estimation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, Mail, AlertTriangle } from "lucide-react";

interface StepProps {
  draft: EstimationDraft;
  update: (patch: Partial<EstimationDraft>) => void;
  onPrev: () => void;
  onReset: () => void;
}

const contactFormSchema = projectStepSchema.extend({
  consent: z.literal(true, { error: "Required" }),
});
type ContactFormValues = z.infer<typeof contactFormSchema>;

function formatCad(n: number, locale: string): string {
  return new Intl.NumberFormat(locale === "en" ? "en-CA" : "fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function Step4Contact({
  draft,
  update,
  onPrev,
  onReset,
}: StepProps) {
  const t = useTranslations("Estimation");
  const tStep = useTranslations("Estimation.step6");
  const tStep5 = useTranslations("Estimation.step5");
  const locale = useLocale();

  const recap = useMemo(() => {
    if (draft.fields.length === 0) return null;
    const configurations = deriveConfigurations(
      draft.fields,
      draft.hqOseEligible,
    );
    if (configurations.length === 0) return null;
    return calculateEstimation({
      project: {
        name: draft.project?.name ?? "",
        municipality: draft.project?.municipality ?? "",
        contactName: draft.project?.contactName ?? "",
        contactEmail: draft.project?.contactEmail ?? "x@example.com",
      },
      fields: draft.fields,
      configurations,
      hqOseEligible: draft.hqOseEligible,
    });
  }, [draft]);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: draft.project?.name ?? "",
      municipality: draft.project?.municipality ?? "",
      contactName: draft.project?.contactName ?? "",
      contactEmail: draft.project?.contactEmail ?? "",
      consent: false as unknown as true,
    },
  });

  const submission = useMutation({
    mutationFn: async (values: ContactFormValues) => {
      const project: ProjectStepValues = {
        name: values.name,
        municipality: values.municipality,
        contactName: values.contactName,
        contactEmail: values.contactEmail,
      };
      update({ project });

      const fullPayload = {
        project,
        fields: draft.fields,
        configurations: deriveConfigurations(draft.fields, draft.hqOseEligible),
        hqOseEligible: draft.hqOseEligible,
      };

      const parsed = fullEstimationSchema.safeParse(fullPayload);
      if (!parsed.success) {
        throw new Error(
          locale === "en"
            ? "Estimation data is incomplete — go back and check previous steps."
            : "Données incomplètes — vérifiez les étapes précédentes.",
        );
      }

      const response = await submitEstimation(
        parsed.data,
        locale === "en" ? "en" : "fr",
      );
      if (!response.ok) throw new Error(response.error);
      return response;
    },
    onSuccess: () => {
      toast.success(
        locale === "en"
          ? "Report sent. Check your inbox."
          : "Bilan envoyé. Vérifiez votre boîte de réception.",
      );
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error ? error.message : tStep("errorBody"),
      );
    },
  });

  if (submission.isSuccess) {
    return (
      <div className="space-y-8 text-center py-12">
        <div className="mx-auto inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent text-accent-foreground">
          <Check size={28} />
        </div>
        <div className="space-y-3">
          <h1 className="lb-h2">{tStep("successTitle")}</h1>
          <p className="lb-lede mx-auto text-base">
            {tStep("successBody", { email: form.getValues("contactEmail") })}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="rounded-full"
          onClick={onReset}
        >
          {tStep("restart")}
        </Button>
      </div>
    );
  }

  function onSubmit(values: ContactFormValues) {
    submission.mutate(values);
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="lb-h2">{tStep("title")}</h1>
        <p className="lb-lede text-base">{tStep("subtitle")}</p>
      </header>

      {recap ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              {tStep("summaryRecap")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <Row
              label={tStep5("totalProject")}
              value={formatCad(recap.totalCostAfterRebateCad, locale)}
              big
            />
            <Row
              label={tStep5("totalLuminaires")}
              value={`${recap.scenarioATotalQty} × ${formatCad(
                recap.scenarioATotalPriceCad /
                  Math.max(1, recap.scenarioATotalQty),
                locale,
              )}`}
            />
            <Row
              label={tStep5("energySavings")}
              value={`${new Intl.NumberFormat(
                locale === "en" ? "en-CA" : "fr-CA",
              ).format(Math.round(recap.energySavingsKwhYear))} ${tStep5("kwhYear")}`}
            />
          </CardContent>
        </Card>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tStep("projectName")}</FormLabel>
                  <FormControl>
                    <Input placeholder={tStep("projectNamePh")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="municipality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tStep("municipality")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={tStep("municipalityPh")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tStep("contactName")}</FormLabel>
                  <FormControl>
                    <Input placeholder={tStep("contactNamePh")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tStep("contactEmail")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={tStep("contactEmailPh")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="consent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-lg border border-border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value === true}
                    onCheckedChange={(v) =>
                      field.onChange(
                        v === true ? (true as const) : (false as unknown as true),
                      )
                    }
                  />
                </FormControl>
                <div className="space-y-1">
                  <Label className="cursor-pointer leading-relaxed">
                    {tStep("consent")}
                  </Label>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {submission.isError ? (
            <Card className="border-destructive/50">
              <CardContent className="flex items-start gap-3 pt-4 text-sm">
                <AlertTriangle
                  size={16}
                  className="shrink-0 mt-0.5 text-destructive"
                />
                <div>
                  <p className="font-medium text-destructive">
                    {tStep("errorTitle")}
                  </p>
                  <p className="text-muted-foreground mt-1">
                    {submission.error instanceof Error
                      ? submission.error.message
                      : tStep("errorBody")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="rounded-full"
              onClick={onPrev}
              disabled={submission.isPending}
            >
              {t("previous")}
            </Button>
            <Button
              type="submit"
              size="lg"
              className="rounded-full"
              disabled={submission.isPending}
            >
              {submission.isPending ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  {tStep("submitting")}
                </>
              ) : (
                <>
                  <Mail size={14} className="mr-2" />
                  {tStep("submit")}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

interface RowProps {
  label: string;
  value: string;
  big?: boolean;
}

function Row({ label, value, big }: RowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span
        className={
          big ? "text-base font-semibold" : "text-sm text-muted-foreground"
        }
      >
        {label}
      </span>
      <span
        className={
          big
            ? "text-2xl font-semibold tabular-nums tracking-tight"
            : "text-sm tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  );
}
