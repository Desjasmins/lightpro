"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  poleSchema,
  poleTypes,
  mountTypes,
  voltages,
} from "@/lib/estimation/schema";
import type { EstimationDraft } from "@/lib/estimation/store";
import type { PolesByField } from "@/lib/estimation/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

interface StepProps {
  draft: EstimationDraft;
  update: (patch: Partial<EstimationDraft>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const polesArraySchema = z.object({
  poles: z.array(poleSchema).min(1, "At least one pole required"),
});
type PolesValues = z.infer<typeof polesArraySchema>;

function genId() {
  return `p_${Math.random().toString(36).slice(2, 10)}`;
}

const emptyPole = {
  index: 1,
  type: "ACIER" as const,
  heightM: 18,
  mountType: "TRAVERSE" as const,
  nbCrossarms: 1,
  nbExistingFixtures: 4,
  existingPowerW: 1000,
  voltage: "V480" as const,
};

interface PolesEditorProps {
  fieldId: string;
  initial: PolesValues["poles"];
  tStep: ReturnType<typeof useTranslations>;
  tPoleTypes: ReturnType<typeof useTranslations>;
  tMount: ReturnType<typeof useTranslations>;
  tVoltage: ReturnType<typeof useTranslations>;
  onChange: (poles: PolesValues["poles"]) => void;
}

function PolesEditor({
  fieldId,
  initial,
  tStep,
  tPoleTypes,
  tMount,
  tVoltage,
  onChange,
}: PolesEditorProps) {
  const [rows, setRows] = useState<PolesValues["poles"]>(initial);

  useEffect(() => {
    onChange(rows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  function addRow() {
    setRows((r) => [
      ...r,
      { ...emptyPole, id: genId(), index: r.length + 1 },
    ]);
  }

  function removeRow(idx: number) {
    setRows((r) => r.filter((_, i) => i !== idx).map((p, i) => ({ ...p, index: i + 1 })));
  }

  function patchRow(idx: number, patch: Partial<PolesValues["poles"][number]>) {
    setRows((r) => r.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }

  return (
    <div className="space-y-4">
      {rows.map((row, idx) => (
        <Card key={row.id ?? idx}>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {tStep("poleIndex")}
              </label>
              <Input value={row.index} readOnly tabIndex={-1} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {tStep("type")}
              </label>
              <Select
                value={row.type}
                onValueChange={(v) => patchRow(idx, { type: v as typeof row.type })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {poleTypes.map((p) => (
                    <SelectItem key={p} value={p}>{tPoleTypes(p)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {tStep("heightM")}
              </label>
              <Input
                type="number"
                min={0}
                step="any"
                value={row.heightM}
                onChange={(e) => patchRow(idx, { heightM: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {tStep("mountType")}
              </label>
              <Select
                value={row.mountType}
                onValueChange={(v) => patchRow(idx, { mountType: v as typeof row.mountType })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {mountTypes.map((m) => (
                    <SelectItem key={m} value={m}>{tMount(m)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {tStep("nbCrossarms")}
              </label>
              <Input
                type="number"
                min={0}
                max={4}
                value={row.nbCrossarms}
                onChange={(e) => patchRow(idx, { nbCrossarms: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {tStep("nbExistingFixtures")}
              </label>
              <Input
                type="number"
                min={0}
                value={row.nbExistingFixtures}
                onChange={(e) => patchRow(idx, { nbExistingFixtures: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {tStep("existingPowerW")}
              </label>
              <Input
                type="number"
                min={0}
                value={row.existingPowerW}
                onChange={(e) => patchRow(idx, { existingPowerW: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {tStep("voltage")}
              </label>
              <Select
                value={row.voltage}
                onValueChange={(v) => patchRow(idx, { voltage: v as typeof row.voltage })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {voltages.map((v) => (
                    <SelectItem key={v} value={v}>{tVoltage(v)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-full flex justify-end">
              {rows.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(idx)}
                >
                  <Trash2 size={14} className="mr-1" /> {tStep("removePole")}
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
      <Button
        type="button"
        variant="outline"
        className="rounded-full"
        onClick={addRow}
      >
        <Plus size={14} className="mr-1" />
        {tStep("addPole")}
      </Button>
      <input type="hidden" data-field-id={fieldId} />
    </div>
  );
}

export function Step4Poles({ draft, update, onNext, onPrev }: StepProps) {
  const t = useTranslations("Estimation");
  const tStep = useTranslations("Estimation.step4");
  const tPoleTypes = useTranslations("PoleTypes");
  const tMount = useTranslations("MountTypes");
  const tVoltage = useTranslations("Voltages");

  const [polesByField, setPolesByField] = useState<PolesByField[]>(() => {
    const existing = new Map(draft.poles.map((p) => [p.fieldId, p.poles]));
    return draft.fields.map((f) => ({
      fieldId: f.id!,
      poles:
        existing.get(f.id!) && (existing.get(f.id!)?.length ?? 0) > 0
          ? existing.get(f.id!)!
          : [{ ...emptyPole, id: genId(), index: 1 }],
    }));
  });

  function handleSubmit() {
    update({ poles: polesByField });
    onNext();
  }

  if (draft.fields.length === 0) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">No fields yet — go back to step 3.</p>
        <Button onClick={onPrev} className="rounded-full">{t("previous")}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="lb-h2">{tStep("title")}</h1>
        <p className="lb-lede text-base">{tStep("subtitle")}</p>
      </header>

      <Tabs defaultValue={draft.fields[0]!.id!} className="w-full">
        <TabsList className="flex-wrap h-auto justify-start bg-card/40 p-1">
          {draft.fields.map((f, i) => (
            <TabsTrigger key={f.id} value={f.id!}>
              #{i + 1} {f.name || `Terrain ${i + 1}`}
            </TabsTrigger>
          ))}
        </TabsList>
        {draft.fields.map((f) => {
          const initial = polesByField.find((p) => p.fieldId === f.id)?.poles ?? [];
          return (
            <TabsContent key={f.id} value={f.id!} className="pt-6">
              <PolesEditor
                fieldId={f.id!}
                initial={initial}
                tStep={tStep}
                tPoleTypes={tPoleTypes}
                tMount={tMount}
                tVoltage={tVoltage}
                onChange={(poles) =>
                  setPolesByField((cur) =>
                    cur.map((p) =>
                      p.fieldId === f.id ? { fieldId: f.id!, poles } : p,
                    ),
                  )
                }
              />
            </TabsContent>
          );
        })}
      </Tabs>

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
