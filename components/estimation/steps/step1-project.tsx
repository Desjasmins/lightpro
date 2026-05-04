"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  projectStepSchema,
  type ProjectStepValues,
} from "@/lib/estimation/schema";
import type { EstimationDraft } from "@/lib/estimation/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface StepProps {
  draft: EstimationDraft;
  update: (patch: Partial<EstimationDraft>) => void;
  onNext: () => void;
}

export function Step1Project({ draft, update, onNext }: StepProps) {
  const t = useTranslations("Estimation");
  const tStep = useTranslations("Estimation.step1");

  const form = useForm<ProjectStepValues>({
    resolver: zodResolver(projectStepSchema),
    defaultValues: draft.project ?? {
      name: "",
      municipality: "",
      contactName: "",
      contactEmail: "",
    },
  });

  function onSubmit(values: ProjectStepValues) {
    update({ project: values });
    onNext();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <header className="space-y-2">
          <h1 className="lb-h2">{tStep("title")}</h1>
          <p className="lb-lede text-base">{tStep("subtitle")}</p>
        </header>

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
                  <Input placeholder={tStep("municipalityPh")} {...field} />
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

        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" className="rounded-full">
            {t("next")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
