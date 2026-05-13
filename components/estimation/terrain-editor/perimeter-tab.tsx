"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  polygonAreaForCapture,
  type NormalizedPoint,
} from "@/lib/estimation/geo";
import type { FieldValues } from "@/lib/estimation/schema";
import { Eraser, Undo2, AlertTriangle, MapPin } from "lucide-react";

interface PerimeterTabProps {
  value: FieldValues;
  captureDataUrl: string;
  onChange: (patch: Partial<FieldValues>) => void;
  color: string;
}

function formatM2(n: number): string {
  return new Intl.NumberFormat("fr-CA", {
    maximumFractionDigits: 0,
  }).format(n);
}

export function PerimeterTab({
  value,
  captureDataUrl,
  onChange,
  color,
}: PerimeterTabProps) {
  const t = useTranslations("TerrainEditor.perimeter");
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverPoint, setHoverPoint] = useState<NormalizedPoint | null>(null);

  const vertices = value.perimeter ?? [];

  const surfaceM2 = useMemo(() => {
    if (
      vertices.length < 3 ||
      value.lat == null ||
      value.captureZoom == null ||
      value.captureWidthPx == null ||
      value.captureHeightPx == null
    ) {
      return 0;
    }
    return polygonAreaForCapture(vertices, {
      lat: value.lat,
      zoom: value.captureZoom,
      widthPx: value.captureWidthPx,
      heightPx: value.captureHeightPx,
    });
  }, [
    vertices,
    value.lat,
    value.captureZoom,
    value.captureWidthPx,
    value.captureHeightPx,
  ]);

  // Sync computed surface back to the field whenever it changes.
  useEffect(() => {
    const rounded = Math.round(surfaceM2);
    if (vertices.length >= 3 && rounded > 0 && value.surfaceM2 !== rounded) {
      onChange({ surfaceM2: rounded });
    } else if (vertices.length < 3 && value.surfaceM2 !== 0) {
      onChange({ surfaceM2: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surfaceM2, vertices.length]);

  function relativePos(
    e: React.MouseEvent<HTMLDivElement>,
  ): NormalizedPoint | null {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    };
  }

  function addPoint(e: React.MouseEvent<HTMLDivElement>) {
    const p = relativePos(e);
    if (!p) return;
    onChange({ perimeter: [...vertices, p] });
  }

  function undo() {
    onChange({ perimeter: vertices.slice(0, -1) });
  }

  function clear() {
    onChange({ perimeter: [], surfaceM2: 0 });
  }

  const pointsAttr = vertices.map((p) => `${p.x * 100},${p.y * 100}`).join(" ");

  if (!captureDataUrl) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center text-sm text-muted-foreground max-w-md">
          <AlertTriangle
            size={28}
            className="mx-auto mb-3 text-destructive"
          />
          {t("captureMissing")}
        </div>
      </div>
    );
  }

  const isComplete = vertices.length >= 3;

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-[1fr_360px] overflow-hidden">
      {/* MAP — fills the left area */}
      <div className="relative bg-black/70 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div
            ref={containerRef}
            onClick={addPoint}
            onMouseMove={(e) => setHoverPoint(relativePos(e))}
            onMouseLeave={() => setHoverPoint(null)}
            className="relative max-w-full max-h-full overflow-hidden rounded-lg border border-white/10 shadow-2xl cursor-crosshair"
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
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {vertices.length >= 2 ? (
                <polyline
                  points={pointsAttr}
                  stroke={color}
                  strokeWidth={0.4}
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}
              {vertices.length >= 3 ? (
                <polygon
                  points={pointsAttr}
                  fill={color}
                  fillOpacity={0.25}
                  stroke={color}
                  strokeWidth={0.4}
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}
              {hoverPoint && vertices.length >= 1 ? (
                <line
                  x1={vertices.at(-1)!.x * 100}
                  y1={vertices.at(-1)!.y * 100}
                  x2={hoverPoint.x * 100}
                  y2={hoverPoint.y * 100}
                  stroke={color}
                  strokeWidth={0.3}
                  strokeDasharray="0.8 0.8"
                  opacity={0.6}
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}
              {vertices.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x * 100}
                  cy={p.y * 100}
                  r={0.8}
                  fill={color}
                  stroke="white"
                  strokeWidth={0.25}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* SIDEBAR — right column */}
      <aside className="border-l border-border bg-card/30 flex flex-col overflow-hidden">
        {/* Step header */}
        <div className="p-6 border-b border-border space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("stepLabel")}
          </p>
          <h3 className="text-2xl font-semibold">{t("title")}</h3>
        </div>

        {/* Instructions card */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div
            className="rounded-xl border p-4 space-y-2"
            style={{ borderColor: `${color}66`, background: `${color}10` }}
          >
            <div className="flex items-start gap-3">
              <div
                className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold text-black"
                style={{ background: color }}
              >
                <MapPin size={16} />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">{t("howToTitle")}</p>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {t("howToBody")}
                </p>
              </div>
            </div>
          </div>

          {/* Stats — large, persistent */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                {t("pointsLabel")}
              </p>
              <p className="text-3xl font-semibold tabular-nums">
                {vertices.length}
              </p>
              {vertices.length > 0 && vertices.length < 3 ? (
                <p className="text-xs text-muted-foreground mt-1">
                  {t(
                    3 - vertices.length > 1 ? "needMorePlural" : "needMore",
                    { count: 3 - vertices.length },
                  )}
                </p>
              ) : null}
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                {t("surfaceLabel")}
              </p>
              <p
                className="text-3xl font-semibold tabular-nums tracking-tight"
                style={isComplete ? { color } : undefined}
              >
                {isComplete ? formatM2(surfaceM2) : "—"}
              </p>
              {isComplete ? (
                <p className="text-xs text-muted-foreground mt-1">m²</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  {t("minPoints")}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full justify-start rounded-lg"
              onClick={undo}
              disabled={vertices.length === 0}
            >
              <Undo2 size={16} className="mr-2.5" />
              {t("undo")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="lg"
              className="w-full justify-start rounded-lg"
              onClick={clear}
              disabled={vertices.length === 0}
            >
              <Eraser size={16} className="mr-2.5" />
              {t("clear")}
            </Button>
          </div>
        </div>

        {/* Bottom hint */}
        {isComplete ? (
          <div className="p-4 border-t border-border bg-green-500/5">
            <p className="text-xs text-center text-green-600 font-medium">
              {t("validatedHint")}
            </p>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
