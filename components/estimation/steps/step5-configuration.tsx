"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  modules,
  powers,
  optics,
  ccts,
  cris,
  voltages,
  visors,
  brackets,
  controls,
  type ConfigurationValues,
} from "@/lib/estimation/schema";
import { matchProduct } from "@/lib/estimation/catalog";
import type { EstimationDraft } from "@/lib/estimation/store";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface StepProps {
  draft: EstimationDraft;
  update: (patch: Partial<EstimationDraft>) => void;
  onNext: () => void;
  onPrev: () => void;
}

function defaultConfig(
  fieldId: string,
  averagePoleW: number,
): ConfigurationValues {
  const match = matchProduct(averagePoleW);
  return {
    fieldId,
    module: match.module,
    power: match.power,
    optic: "D30",
    cct: "K4000",
    cri: "CRI70",
    voltage: "V480",
    visor: match.module === "SIMPLE" ? "VN" : "VN_VN",
    bracket: "BTU",
    withRegulation: true,
    control: "BASE",
    hqOseEligible: false,
  };
}

export function Step5Configuration({ draft, update, onNext, onPrev }: StepProps) {
  const t = useTranslations("Estimation");
  const tStep = useTranslations("Estimation.step5");
  const tModules = useTranslations("Modules");
  const tPowers = useTranslations("Powers");
  const tOptics = useTranslations("Optics");
  const tCcts = useTranslations("Ccts");
  const tCris = useTranslations("Cris");
  const tVoltages = useTranslations("Voltages");
  const tVisors = useTranslations("Visors");
  const tBrackets = useTranslations("Brackets");
  const tControls = useTranslations("Controls");

  const [hqOse, setHqOse] = useState(draft.hqOseEligible);

  const [configs, setConfigs] = useState<ConfigurationValues[]>(() => {
    return draft.fields.map((f) => {
      const existing = draft.configurations.find((c) => c.fieldId === f.id);
      if (existing) return existing;
      const polesForField =
        draft.poles.find((p) => p.fieldId === f.id)?.poles ?? [];
      const avg =
        polesForField.length > 0
          ? polesForField.reduce((a, p) => a + p.existingPowerW, 0) /
            polesForField.length
          : 400;
      return defaultConfig(f.id!, avg);
    });
  });

  function patch(fieldId: string, p: Partial<ConfigurationValues>) {
    setConfigs((cur) =>
      cur.map((c) => (c.fieldId === fieldId ? { ...c, ...p } : c)),
    );
  }

  function handleSubmit() {
    const enriched = configs.map((c) => ({ ...c, hqOseEligible: hqOse }));
    update({ configurations: enriched, hqOseEligible: hqOse });
    onNext();
  }

  if (draft.fields.length === 0) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">No fields yet — go back to step 3.</p>
        <Button onClick={onPrev} className="rounded-full">
          {t("previous")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="lb-h2">{tStep("title")}</h1>
        <p className="lb-lede text-base">{tStep("subtitle")}</p>
      </header>

      <Tabs defaultValue={draft.fields[0]!.id!}>
        <TabsList className="flex-wrap h-auto justify-start bg-card/40 p-1">
          {draft.fields.map((f, i) => (
            <TabsTrigger key={f.id} value={f.id!}>
              #{i + 1} {f.name || `Terrain ${i + 1}`}
            </TabsTrigger>
          ))}
        </TabsList>
        {draft.fields.map((f) => {
          const cfg = configs.find((c) => c.fieldId === f.id)!;
          return (
            <TabsContent key={f.id} value={f.id!} className="pt-6">
              <Card>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                  <div className="space-y-1.5">
                    <Label>{tStep("module")}</Label>
                    <Select
                      value={cfg.module}
                      onValueChange={(v) => patch(f.id!, { module: v as typeof cfg.module })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {modules.map((m) => (
                          <SelectItem key={m} value={m}>{tModules(m)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{tStep("power")}</Label>
                    <Select
                      value={cfg.power}
                      onValueChange={(v) => patch(f.id!, { power: v as typeof cfg.power })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {powers.map((p) => (
                          <SelectItem key={p} value={p}>{tPowers(p)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{tStep("optic")}</Label>
                    <Select
                      value={cfg.optic}
                      onValueChange={(v) => patch(f.id!, { optic: v as typeof cfg.optic })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {optics.map((o) => (
                          <SelectItem key={o} value={o}>{tOptics(o)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{tStep("cct")}</Label>
                    <Select
                      value={cfg.cct}
                      onValueChange={(v) => patch(f.id!, { cct: v as typeof cfg.cct })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ccts.map((c) => (
                          <SelectItem key={c} value={c}>{tCcts(c)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{tStep("cri")}</Label>
                    <Select
                      value={cfg.cri}
                      onValueChange={(v) => patch(f.id!, { cri: v as typeof cfg.cri })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {cris.map((c) => (
                          <SelectItem key={c} value={c}>{tCris(c)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{tStep("voltage")}</Label>
                    <Select
                      value={cfg.voltage}
                      onValueChange={(v) => patch(f.id!, { voltage: v as typeof cfg.voltage })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {voltages.map((v) => (
                          <SelectItem key={v} value={v}>{tVoltages(v)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{tStep("visor")}</Label>
                    <Select
                      value={cfg.visor}
                      onValueChange={(v) => patch(f.id!, { visor: v as typeof cfg.visor })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {visors.map((v) => (
                          <SelectItem key={v} value={v}>{tVisors(v)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{tStep("bracket")}</Label>
                    <Select
                      value={cfg.bracket}
                      onValueChange={(v) => patch(f.id!, { bracket: v as typeof cfg.bracket })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {brackets.map((b) => (
                          <SelectItem key={b} value={b}>{tBrackets(b)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>{tStep("control")}</Label>
                    <Select
                      value={cfg.control}
                      onValueChange={(v) => patch(f.id!, { control: v as typeof cfg.control })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {controls.map((c) => (
                          <SelectItem key={c} value={c}>{tControls(c)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 flex items-center gap-3 pt-2">
                    <Checkbox
                      id={`reg-${f.id}`}
                      checked={cfg.withRegulation}
                      onCheckedChange={(v) => patch(f.id!, { withRegulation: v === true })}
                    />
                    <Label htmlFor={`reg-${f.id}`} className="cursor-pointer">
                      {tStep("withRegulation")}
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      <Card className="lb-light">
        <CardContent className="flex items-center gap-3 pt-6">
          <Checkbox
            id="hq-ose"
            checked={hqOse}
            onCheckedChange={(v) => setHqOse(v === true)}
          />
          <Label htmlFor="hq-ose" className="cursor-pointer text-foreground">
            {tStep("hqOseEligible")}
          </Label>
        </CardContent>
      </Card>

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
        <Button
          type="button"
          size="lg"
          className="rounded-full"
          onClick={handleSubmit}
        >
          {t("next")}
        </Button>
      </div>
    </div>
  );
}
