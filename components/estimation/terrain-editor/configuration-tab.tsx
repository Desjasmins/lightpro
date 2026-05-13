"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  brackets,
  controls,
  visorsSimple,
  type FieldConfigValues,
  type FieldValues,
} from "@/lib/estimation/schema";
import { defaultFieldConfig } from "@/lib/estimation/config-derive";
import { Check, Settings } from "lucide-react";

interface ConfigurationTabProps {
  value: FieldValues;
  onChange: (patch: Partial<FieldValues>) => void;
  color: string;
}

export function ConfigurationTab({
  value,
  onChange,
  color,
}: ConfigurationTabProps) {
  const t = useTranslations("TerrainEditor.configuration");
  const tVisors = useTranslations("Visors");
  const tControls = useTranslations("Controls");
  const tBrackets = useTranslations("Brackets");

  const cfg: FieldConfigValues = value.config ?? defaultFieldConfig();

  function patchCfg(p: Partial<FieldConfigValues>) {
    onChange({ config: { ...cfg, ...p } });
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-6 space-y-8">
      <div className="space-y-1">
        <h3 className="lb-h3">{t("title")}</h3>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* 1. Brackets */}
      <FieldSection
        index={1}
        color={color}
        title={t("brackets.title")}
        description={t("brackets.description")}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {brackets.map((b) => {
            const active = cfg.bracket === b;
            return (
              <button
                key={b}
                type="button"
                onClick={() => patchCfg({ bracket: b })}
                className={cn(
                  "relative flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition cursor-pointer",
                  active
                    ? "ring-2"
                    : "border-border hover:border-foreground/40 hover:bg-card/40",
                )}
                style={
                  active
                    ? {
                        borderColor: color,
                        background: `${color}10`,
                        boxShadow: `0 0 0 2px ${color}33`,
                      }
                    : undefined
                }
              >
                {active ? (
                  <span
                    className="absolute top-2 right-2 inline-flex items-center justify-center w-5 h-5 rounded-full text-black"
                    style={{ background: color }}
                  >
                    <Check size={12} />
                  </span>
                ) : null}
                <span className="text-xs font-mono text-muted-foreground">
                  {b}
                </span>
                <span className="text-sm font-medium leading-snug">
                  {tBrackets(b)}
                </span>
              </button>
            );
          })}
        </div>
      </FieldSection>

      {/* 2. Visor */}
      <FieldSection
        index={2}
        color={color}
        title={t("visor.title")}
        description={t("visor.description")}
      >
        <div className="grid grid-cols-3 gap-3">
          {visorsSimple.map((v) => {
            const active = cfg.visor === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => patchCfg({ visor: v })}
                className={cn(
                  "relative flex flex-col items-stretch gap-2 rounded-xl border p-3 text-left transition cursor-pointer",
                  active
                    ? "ring-2"
                    : "border-border hover:border-foreground/40 hover:bg-card/40",
                )}
                style={
                  active
                    ? {
                        borderColor: color,
                        background: `${color}10`,
                        boxShadow: `0 0 0 2px ${color}33`,
                      }
                    : undefined
                }
              >
                {active ? (
                  <span
                    className="absolute top-2 right-2 z-10 inline-flex items-center justify-center w-5 h-5 rounded-full text-black"
                    style={{ background: color }}
                  >
                    <Check size={12} />
                  </span>
                ) : null}
                <div className="aspect-[4/3] w-full rounded-lg bg-white border border-border overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/estimation/visors/${v}.png`}
                    alt={tVisors(v)}
                    className="w-full h-full object-contain p-2"
                    draggable={false}
                  />
                </div>
                <div className="space-y-0.5">
                  <span className="block text-xs font-mono text-muted-foreground">
                    {v}
                  </span>
                  <span className="block text-sm font-medium leading-snug">
                    {t(`visor.options.${v}`)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </FieldSection>

      {/* 3. Control */}
      <FieldSection
        index={3}
        color={color}
        title={t("control.title")}
        description={t("control.description")}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {controls.map((c, i) => {
              const active = cfg.control === c;
              const optionNumber = i + 1;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => patchCfg({ control: c })}
                  className={cn(
                    "relative flex flex-col items-stretch gap-2 rounded-xl border p-3 text-left transition cursor-pointer",
                    active
                      ? "ring-2"
                      : "border-border hover:border-foreground/40 hover:bg-card/40",
                  )}
                  style={
                    active
                      ? {
                          borderColor: color,
                          background: `${color}10`,
                          boxShadow: `0 0 0 2px ${color}33`,
                        }
                      : undefined
                  }
                >
                  {active ? (
                    <span
                      className="absolute top-2 right-2 z-10 inline-flex items-center justify-center w-5 h-5 rounded-full text-black"
                      style={{ background: color }}
                    >
                      <Check size={12} />
                    </span>
                  ) : null}
                  <div className="aspect-square w-full rounded-lg bg-white border border-border overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/estimation/controls/option-${optionNumber}.png`}
                      alt={tControls(c)}
                      className="w-full h-full object-contain p-2"
                      draggable={false}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t("control.optionLabel", { index: optionNumber })}
                    </span>
                    <span className="block text-sm font-medium leading-snug">
                      {tControls(c)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail panel for the selected control */}
          <ControlDetailPanel
            control={cfg.control}
            optionNumber={controls.indexOf(cfg.control) + 1}
            color={color}
            t={t}
            tControls={tControls}
          />
        </div>
      </FieldSection>

      {/* 4. Replace crossarms */}
      <FieldSection
        index={4}
        color={color}
        title={t("crossarms.title")}
        description={t("crossarms.description")}
      >
        <BinaryChoice
          name="replaceCrossarms"
          value={cfg.replaceCrossarms}
          color={color}
          yesLabel={t("crossarms.yes")}
          noLabel={t("crossarms.no")}
          onChange={(v) => patchCfg({ replaceCrossarms: v })}
        />
      </FieldSection>
    </div>
  );
}

interface FieldSectionProps {
  index: number;
  color: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

function FieldSection({
  index,
  color,
  title,
  description,
  children,
}: FieldSectionProps) {
  return (
    <section className="space-y-3">
      <header className="flex items-start gap-3">
        <span
          className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold text-black"
          style={{ background: color }}
        >
          {index}
        </span>
        <div className="space-y-0.5">
          <Label className="text-base font-medium">{title}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </header>
      <div className="pl-11">{children}</div>
    </section>
  );
}

interface BinaryChoiceProps {
  name: string;
  value: boolean;
  color: string;
  yesLabel: string;
  noLabel: string;
  onChange: (v: boolean) => void;
}

function BinaryChoice({
  name,
  value,
  color,
  yesLabel,
  noLabel,
  onChange,
}: BinaryChoiceProps) {
  const options: { v: boolean; label: string }[] = [
    { v: true, label: yesLabel },
    { v: false, label: noLabel },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 max-w-md">
      {options.map((o) => {
        const active = o.v === value;
        return (
          <button
            key={String(o.v)}
            type="button"
            role="radio"
            aria-checked={active}
            name={name}
            onClick={() => onChange(o.v)}
            className={cn(
              "relative flex items-center justify-center gap-2 rounded-xl border px-4 py-3 transition cursor-pointer",
              active
                ? "ring-2"
                : "border-border hover:border-foreground/40 hover:bg-card/40",
            )}
            style={
              active
                ? {
                    borderColor: color,
                    background: `${color}10`,
                    boxShadow: `0 0 0 2px ${color}33`,
                  }
                : undefined
            }
          >
            {active ? (
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-black"
                style={{ background: color }}
              >
                <Check size={12} />
              </span>
            ) : (
              <span
                className="inline-block w-5 h-5 rounded-full border-2"
                style={{ borderColor: "var(--border)" }}
              />
            )}
            <span className="text-sm font-medium">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

interface ControlDetailPanelProps {
  control: FieldConfigValues["control"];
  optionNumber: number;
  color: string;
  t: ReturnType<typeof useTranslations>;
  tControls: ReturnType<typeof useTranslations>;
}

function ControlDetailPanel({
  control,
  optionNumber,
  color,
  t,
  tControls,
}: ControlDetailPanelProps) {
  return (
    <div
      className="rounded-2xl border bg-card/30 overflow-hidden"
      style={{ borderColor: `${color}66` }}
    >
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
        {/* Larger image */}
        <div className="bg-white border-b md:border-b-0 md:border-r border-border flex items-center justify-center p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/estimation/controls/option-${optionNumber}.png`}
            alt={tControls(control)}
            className="w-full h-auto max-h-64 object-contain"
            draggable={false}
          />
        </div>

        {/* Description */}
        <div className="p-6 space-y-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("control.optionLabel", { index: optionNumber })}
            </p>
            <h4 className="text-lg font-semibold">{tControls(control)}</h4>
          </div>
          <p className="text-sm leading-relaxed text-foreground/80">
            {t(`control.details.${control}`)}
          </p>
        </div>
      </div>
    </div>
  );
}

export { Settings };
