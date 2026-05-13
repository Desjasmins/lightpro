"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  poleTypes,
  mountTypes,
  voltages,
  type FieldValues,
  type PoleValues,
} from "@/lib/estimation/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Check, Pin, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PolesTabProps {
  value: FieldValues;
  captureDataUrl: string;
  onChange: (patch: Partial<FieldValues>) => void;
  color: string;
}

function genId(): string {
  return `p_${Math.random().toString(36).slice(2, 10)}`;
}

const defaults = {
  type: "ACIER" as const,
  heightM: 18,
  mountType: "TRAVERSE" as const,
  nbCrossarms: 1,
  nbExistingFixtures: 4,
  existingPowerW: 1000,
  voltage: "V480" as const,
};

export function PolesTab({
  value,
  captureDataUrl,
  onChange,
  color,
}: PolesTabProps) {
  const t = useTranslations("TerrainEditor.poles");
  const tPoleTypes = useTranslations("PoleTypes");
  const tMount = useTranslations("MountTypes");
  const tVoltage = useTranslations("Voltages");

  const poleTypeLabels = Object.fromEntries(
    poleTypes.map((p) => [p, tPoleTypes(p)]),
  );
  const mountLabels = Object.fromEntries(
    mountTypes.map((m) => [m, tMount(m)]),
  );
  const voltageLabels = Object.fromEntries(
    voltages.map((v) => [v, tVoltage(v)]),
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<string | null>(null);
  const draggedRef = useRef<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const poles = value.poles;
  const perimeter = value.perimeter ?? [];

  function addPoleAt(x: number, y: number) {
    const newPole: PoleValues = {
      id: genId(),
      index: poles.length + 1,
      ...defaults,
      positionX: x,
      positionY: y,
    };
    onChange({ poles: [...poles, newPole] });
    setEditingId(newPole.id!);
  }

  function patchPole(id: string, patch: Partial<PoleValues>) {
    onChange({
      poles: poles.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });
  }

  function removePole(id: string) {
    onChange({
      poles: poles
        .filter((p) => p.id !== id)
        .map((p, i) => ({ ...p, index: i + 1 })),
    });
    if (editingId === id) setEditingId(null);
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (draggingRef.current) return;
    if ((e.target as HTMLElement).closest("[data-pole-marker]")) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    addPoleAt(x, y);
  }

  function startDrag(id: string, e: React.PointerEvent) {
    e.stopPropagation();
    draggingRef.current = id;
    draggedRef.current = false;
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
  }

  function onDrag(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    draggedRef.current = true;
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    patchPole(draggingRef.current, { positionX: x, positionY: y });
  }

  function endDrag(e: React.PointerEvent) {
    const el = e.currentTarget as HTMLElement;
    if (el.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    const id = draggingRef.current;
    const moved = draggedRef.current;
    setTimeout(() => {
      draggingRef.current = null;
      draggedRef.current = false;
    }, 50);
    // If pointer was pressed and released without moving, treat as a click on
    // the marker → open editor for that pole.
    if (id && !moved) {
      setEditingId(id);
    }
  }

  // Close the editor with Escape.
  useEffect(() => {
    if (!editingId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setEditingId(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editingId]);

  if (!captureDataUrl) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center text-sm text-muted-foreground max-w-md">
          <AlertTriangle size={28} className="mx-auto mb-3 text-destructive" />
          {t("captureMissing")}
        </div>
      </div>
    );
  }

  const editingPole = poles.find((p) => p.id === editingId);
  const polygonPoints = perimeter
    .map((p) => `${p.x * 100},${p.y * 100}`)
    .join(" ");

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_380px] overflow-hidden">
      {/* MAP — fills the left area */}
      <div className="relative bg-black/70 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div
            ref={containerRef}
            onClick={handleCanvasClick}
            className="relative max-w-full max-h-full overflow-hidden rounded-lg border border-white/10 shadow-2xl cursor-crosshair select-none"
            style={{
              aspectRatio: `${value.captureWidthPx ?? 1280} / ${value.captureHeightPx ?? 800}`,
              width: "100%",
              height: "auto",
              maxHeight: "100%",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={captureDataUrl}
              alt=""
              className="block w-full h-full object-contain pointer-events-none select-none"
              draggable={false}
            />
            {perimeter.length >= 3 ? (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <polygon
                  points={polygonPoints}
                  fill={color}
                  fillOpacity={0.15}
                  stroke={color}
                  strokeWidth={0.3}
                  strokeDasharray="0.6 0.6"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            ) : null}

            {poles.map((pole) => {
              if (pole.positionX == null || pole.positionY == null) return null;
              const isEditing = pole.id === editingId;
              return (
                <button
                  key={pole.id}
                  type="button"
                  data-pole-marker
                  onPointerDown={(e) => startDrag(pole.id!, e)}
                  onPointerMove={onDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[8px] font-semibold text-black shadow ring-1 transition-transform cursor-grab active:cursor-grabbing",
                    isEditing ? "ring-white scale-125" : "ring-black/40",
                  )}
                  style={{
                    left: `${pole.positionX * 100}%`,
                    top: `${pole.positionY * 100}%`,
                    background: color,
                    zIndex: isEditing ? 20 : 10,
                  }}
                  title={`Fût #${pole.index}`}
                >
                  {pole.index}
                </button>
              );
            })}

            {poles.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center bg-black/80 px-5 py-3 rounded-full text-white text-sm backdrop-blur shadow-2xl">
                  {t("clickHint")}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* SIDEBAR — instructions + list only; editor is in popup */}
      <aside className="border-l border-border bg-card/30 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-border space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("stepLabel")}
          </p>
          <h3 className="text-2xl font-semibold">{t("title")}</h3>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 pb-4 space-y-4">
            <div
              className="rounded-xl border p-4 space-y-2"
              style={{ borderColor: `${color}66`, background: `${color}10` }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold text-black"
                  style={{ background: color }}
                >
                  <Pin size={16} />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-sm">{t("howToTitle")}</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {t("howToBody")}
                    {poles.length > 0 ? ` ${t("howToBodyEditExtra")}` : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                {t("placedCount")}
              </p>
              <p
                className="text-3xl font-semibold tabular-nums"
                style={poles.length > 0 ? { color } : undefined}
              >
                {poles.length}
              </p>
            </div>
          </div>

          {poles.length > 0 ? (
            <div className="px-6 pb-6 space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {t("clickToEdit")}
              </p>
              <ul className="space-y-1.5">
                {poles.map((pole) => (
                  <li key={pole.id}>
                    <button
                      type="button"
                      onClick={() => setEditingId(pole.id!)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition cursor-pointer border border-transparent hover:bg-muted"
                    >
                      <span
                        className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold text-black"
                        style={{ background: color }}
                      >
                        {pole.index}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          Fût #{pole.index}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {pole.heightM} m · {pole.nbExistingFixtures}{" "}
                          luminaires · {pole.existingPowerW} W
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {poles.length >= 1 ? (
          <div className="p-4 border-t border-border bg-green-500/5">
            <p className="text-xs text-center text-green-600 font-medium">
              {t(poles.length > 1 ? "readyHintPlural" : "readyHint", {
                count: poles.length,
              })}
            </p>
          </div>
        ) : null}
      </aside>

      {/* Pole editor popup — rendered inside the tab so it overlays both map
          and sidebar. z-[80] sits above the terrain editor (z-[60]). */}
      {editingPole ? (
        <PoleEditorPopup
          pole={editingPole}
          color={color}
          poleTypeLabels={poleTypeLabels}
          mountLabels={mountLabels}
          voltageLabels={voltageLabels}
          onChange={(patch) => patchPole(editingPole.id!, patch)}
          onRemove={() => removePole(editingPole.id!)}
          onClose={() => setEditingId(null)}
          t={t}
        />
      ) : null}
    </div>
  );
}

interface PoleEditorPopupProps {
  pole: PoleValues;
  color: string;
  poleTypeLabels: Record<string, string>;
  mountLabels: Record<string, string>;
  voltageLabels: Record<string, string>;
  onChange: (patch: Partial<PoleValues>) => void;
  onRemove: () => void;
  onClose: () => void;
  t: ReturnType<typeof useTranslations>;
}

function PoleEditorPopup({
  pole,
  color,
  poleTypeLabels,
  mountLabels,
  voltageLabels,
  onChange,
  onRemove,
  onClose,
  t,
}: PoleEditorPopupProps) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-background ring-1 ring-foreground/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold text-black shrink-0"
              style={{ background: color }}
            >
              {pole.index}
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-semibold truncate">
                {t("editTitle", { index: pole.index })}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {t("editSubtitle")}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label={t("done")}
          >
            <X size={16} />
          </Button>
        </header>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("type")}
            </Label>
            <Select
              value={pole.type}
              onValueChange={(v) =>
                onChange({ type: v as typeof pole.type })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue labels={poleTypeLabels} />
              </SelectTrigger>
              <SelectContent>
                {poleTypes.map((p) => (
                  <SelectItem key={p} value={p}>
                    {poleTypeLabels[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                {t("heightM")}
              </Label>
              <Input
                type="number"
                min={0}
                step="any"
                value={pole.heightM}
                onChange={(e) =>
                  onChange({ heightM: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                {t("voltage")}
              </Label>
              <Select
                value={pole.voltage}
                onValueChange={(v) =>
                  onChange({ voltage: v as typeof pole.voltage })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue labels={voltageLabels} />
                </SelectTrigger>
                <SelectContent>
                  {voltages.map((v) => (
                    <SelectItem key={v} value={v}>
                      {voltageLabels[v]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("mount")}
            </Label>
            <Select
              value={pole.mountType}
              onValueChange={(v) =>
                onChange({ mountType: v as typeof pole.mountType })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue labels={mountLabels} />
              </SelectTrigger>
              <SelectContent>
                {mountTypes.map((m) => (
                  <SelectItem key={m} value={m}>
                    {mountLabels[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                {t("crossarms")}
              </Label>
              <Input
                type="number"
                min={0}
                max={4}
                value={pole.nbCrossarms}
                onChange={(e) =>
                  onChange({ nbCrossarms: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                {t("fixtures")}
              </Label>
              <Input
                type="number"
                min={0}
                value={pole.nbExistingFixtures}
                onChange={(e) =>
                  onChange({ nbExistingFixtures: Number(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("powerW")}
            </Label>
            <Input
              type="number"
              min={0}
              value={pole.existingPowerW}
              onChange={(e) =>
                onChange({ existingPowerW: Number(e.target.value) })
              }
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between gap-2 px-5 py-4 border-t border-border bg-muted/30 rounded-b-2xl">
          <Button
            type="button"
            variant="destructive"
            size="default"
            onClick={() => {
              onRemove();
              onClose();
            }}
          >
            <Trash2 size={14} className="mr-1.5" />
            {t("remove")}
          </Button>
          <Button
            type="button"
            size="default"
            className="rounded-full"
            onClick={onClose}
          >
            <Check size={14} className="mr-1.5" />
            {t("done")}
          </Button>
        </footer>
      </div>
    </div>
  );
}
