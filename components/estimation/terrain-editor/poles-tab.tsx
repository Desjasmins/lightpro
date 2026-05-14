"use client";

/**
 * Poles tab — places fûts on a frozen Maps JS view.
 *
 * Pole positions are stored as real-world lat/lng. Markers are draggable via
 * Google's `AdvancedMarker`; clicking the map adds a new pole at the click
 * latlng; clicking an existing marker opens the editor popup.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps";
import {
  poleTypes,
  mountTypes,
  voltages,
  type FieldValues,
  type GeoPoint,
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
import { MapPolygon } from "@/components/estimation/map/map-polygon";
import { AlertTriangle, Check, Pin, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PolesTabProps {
  value: FieldValues;
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

interface MapClickHandlerProps {
  onMapClick: (point: GeoPoint) => void;
}

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const listener = map.addListener(
      "click",
      (ev: google.maps.MapMouseEvent) => {
        const ll = ev.latLng;
        if (!ll) return;
        onMapClick({ lat: ll.lat(), lng: ll.lng() });
      },
    );
    return () => listener.remove();
  }, [map, onMapClick]);
  return null;
}

export function PolesTab({ value, onChange, color }: PolesTabProps) {
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

  const [editingId, setEditingId] = useState<string | null>(null);
  // Suppresses the trailing "click" Google fires on drag mouseup, which would
  // otherwise add a new pole right at the drop point of an existing one.
  const draggingRef = useRef(false);

  const poles = value.poles;
  const perimeter = (value.perimeter ?? []) as GeoPoint[];

  const addPoleAt = useCallback(
    (point: GeoPoint) => {
      if (draggingRef.current) return;
      const newPole: PoleValues = {
        id: genId(),
        index: poles.length + 1,
        ...defaults,
        lat: point.lat,
        lng: point.lng,
      };
      onChange({ poles: [...poles, newPole] });
      setEditingId(newPole.id!);
    },
    [poles, onChange],
  );

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

  // Close the editor with Escape.
  useEffect(() => {
    if (!editingId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setEditingId(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editingId]);

  if (value.lockedZoom == null || value.lat === 0) {
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
  const center = { lat: value.lat, lng: value.lng };

  // Same layout pattern as Perimeter: one scrollable column on mobile,
  // 2-col grid with separate scrolls on desktop.
  return (
    <div className="lg:h-full lg:overflow-hidden lg:grid lg:grid-cols-[1fr_380px]">
      {/* MAP — frozen satellite. */}
      <div className="relative bg-black overflow-hidden [&_.gm-style]:!cursor-crosshair w-full h-[50vh] lg:h-full">
        <Map
          defaultCenter={center}
          defaultZoom={value.lockedZoom}
          // Force flat camera — same reason as Perimeter tab: prevents the
          // built-in tilt/3D control from breaking the click→latlng math.
          tilt={0}
          heading={0}
          rotateControl={false}
          mapTypeId="satellite"
          gestureHandling="none"
          disableDefaultUI={true}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          zoomControl={false}
          clickableIcons={false}
          keyboardShortcuts={false}
          draggableCursor="crosshair"
          draggingCursor="crosshair"
          mapId="lightbase-estimation"
          className="h-full w-full"
        >
          <MapClickHandler onMapClick={addPoleAt} />

          {/* Perimeter outline (informational) */}
          {perimeter.length >= 3 ? (
            <MapPolygon
              paths={perimeter}
              color={color}
              fillOpacity={0.12}
              strokeWeight={2}
            />
          ) : null}

          {poles.map((pole) => {
            if (pole.lat == null || pole.lng == null) return null;
            const isEditing = pole.id === editingId;
            return (
              <AdvancedMarker
                key={pole.id}
                position={{ lat: pole.lat, lng: pole.lng }}
                draggable
                onClick={() => {
                  if (draggingRef.current) return;
                  setEditingId(pole.id!);
                }}
                onDragStart={() => {
                  draggingRef.current = true;
                }}
                onDragEnd={(ev) => {
                  const ll = ev.latLng;
                  if (ll) {
                    patchPole(pole.id!, { lat: ll.lat(), lng: ll.lng() });
                  }
                  // Keep flag set briefly so the trailing map click event
                  // (fired on drag mouseup) doesn't create a phantom pole.
                  setTimeout(() => {
                    draggingRef.current = false;
                  }, 0);
                }}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold text-black ring-1 transition-transform shadow cursor-pointer active:cursor-grabbing",
                    isEditing
                      ? "ring-white scale-125"
                      : "ring-black/40 hover:scale-110",
                  )}
                  style={{ background: color }}
                >
                  {pole.index}
                </span>
              </AdvancedMarker>
            );
          })}
        </Map>

        {poles.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center bg-black/80 px-5 py-3 rounded-full text-white text-sm backdrop-blur shadow-2xl">
              {t("clickHint")}
            </div>
          </div>
        ) : null}
      </div>

      {/* SIDEBAR */}
      <aside className="lg:border-l border-border bg-card/30 flex flex-col lg:overflow-hidden lg:min-h-0">
        <div className="p-6 border-b border-border space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("stepLabel")}
          </p>
          <h3 className="text-2xl font-semibold">{t("title")}</h3>
        </div>

        <div className="lg:flex-1 lg:overflow-y-auto">
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
