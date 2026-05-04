"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  addressStepSchema,
  type AddressStepValues,
} from "@/lib/estimation/schema";
import type { EstimationDraft } from "@/lib/estimation/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface StepProps {
  draft: EstimationDraft;
  update: (patch: Partial<EstimationDraft>) => void;
  onNext: () => void;
  onPrev: () => void;
}

function buildMapSrc(address: string): string {
  const q = encodeURIComponent(address.trim() || "Montréal, QC, Canada");
  // Embed without API key — works for low-volume static usage.
  return `https://www.google.com/maps?q=${q}&t=k&z=18&ie=UTF8&iwloc=&output=embed`;
}

export function Step2Address({ draft, update, onNext, onPrev }: StepProps) {
  const t = useTranslations("Estimation");
  const tStep = useTranslations("Estimation.step2");

  const form = useForm<AddressStepValues>({
    resolver: zodResolver(addressStepSchema),
    defaultValues: draft.address ?? { address: "" },
  });

  const watched = form.watch("address");

  function onSubmit(values: AddressStepValues) {
    update({ address: values });
    onNext();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <header className="space-y-2">
          <h1 className="lb-h2">{tStep("title")}</h1>
          <p className="lb-lede text-base">{tStep("subtitle")}</p>
        </header>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tStep("address")}</FormLabel>
              <FormControl>
                <Input placeholder={tStep("addressPh")} {...field} />
              </FormControl>
              <FormDescription>{tStep("mapHint")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-card">
          <iframe
            key={watched}
            title="Google Maps satellite preview"
            src={buildMapSrc(watched)}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full w-full"
          />
        </div>

        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="rounded-full"
            onClick={onPrev}
          >
            {t("previous")}
          </Button>
          <Button type="submit" size="lg" className="rounded-full">
            {t("next")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
