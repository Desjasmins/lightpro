"use client";

import { useTranslations } from "next-intl";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  fieldsStepSchema,
  fieldSchema,
  iesClasses,
  sportTypes,
} from "@/lib/estimation/schema";

type FieldsStepInput = z.input<typeof fieldsStepSchema>;
type FieldsStepOutput = z.output<typeof fieldsStepSchema>;
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StepProps {
  draft: EstimationDraft;
  update: (patch: Partial<EstimationDraft>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const emptyField: z.infer<typeof fieldSchema> = {
  name: "",
  sportType: "SOCCER",
  iesClass: "CLASS_IV",
  surfaceM2: 0,
};

function genId() {
  return `f_${Math.random().toString(36).slice(2, 10)}`;
}

export function Step3Fields({ draft, update, onNext, onPrev }: StepProps) {
  const t = useTranslations("Estimation");
  const tStep = useTranslations("Estimation.step3");
  const tSports = useTranslations("Sports");
  const tIes = useTranslations("IesClasses");

  const initial =
    draft.fields.length > 0
      ? draft.fields
      : [{ ...emptyField, id: genId() }];

  const form = useForm<FieldsStepInput, undefined, FieldsStepOutput>({
    resolver: zodResolver(fieldsStepSchema),
    defaultValues: { fields: initial },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fields",
  });

  function onSubmit(values: FieldsStepOutput) {
    const enriched = values.fields.map((f) => ({
      ...f,
      id: f.id ?? genId(),
    }));
    // Sync poles array — keep poles for existing fieldIds, drop orphans
    const ids = new Set(enriched.map((f) => f.id!));
    const keptPoles = draft.poles.filter((p) => ids.has(p.fieldId));
    update({ fields: enriched, poles: keptPoles });
    onNext();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <header className="space-y-2">
          <h1 className="lb-h2">{tStep("title")}</h1>
          <p className="lb-lede text-base">{tStep("subtitle")}</p>
        </header>

        <div className="space-y-4">
          {fields.map((field, idx) => (
            <Card key={field.id}>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base font-medium">
                  #{idx + 1}
                </CardTitle>
                {fields.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(idx)}
                  >
                    <Trash2 size={14} className="mr-1" />
                    {tStep("removeField")}
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`fields.${idx}.name`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>{tStep("fieldName")}</FormLabel>
                      <FormControl>
                        <Input placeholder={tStep("fieldNamePh")} {...f} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`fields.${idx}.sportType`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>{tStep("sportType")}</FormLabel>
                      <Select onValueChange={f.onChange} value={f.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sportTypes.map((s) => (
                            <SelectItem key={s} value={s}>
                              {tSports(s)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`fields.${idx}.iesClass`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>{tStep("iesClass")}</FormLabel>
                      <Select onValueChange={f.onChange} value={f.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {iesClasses.map((c) => (
                            <SelectItem key={c} value={c}>
                              {tIes(c)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`fields.${idx}.surfaceM2`}
                  render={({ field: f }) => (
                    <FormItem>
                      <FormLabel>{tStep("surfaceM2")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          name={f.name}
                          ref={f.ref}
                          onBlur={f.onBlur}
                          onChange={f.onChange}
                          value={
                            typeof f.value === "number" || typeof f.value === "string"
                              ? f.value
                              : ""
                          }
                        />
                      </FormControl>
                      <FormDescription>{tStep("surfaceM2Hint")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => append({ ...emptyField, id: genId() })}
          >
            <Plus size={14} className="mr-1" />
            {tStep("addField")}
          </Button>
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
