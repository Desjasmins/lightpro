"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  polygonAreaForCapture,
  type NormalizedPoint,
} from "@/lib/estimation/geo";
import { Check, Eraser, Undo2, X, MapPin } from "lucide-react";

export interface PolygonDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Title shown in the header (typically the field name). */
  title: string;
  screenshotDataUrl: string;
  /** Geographic metadata of the capture — required for area computation. */
  captureLat: number;
  captureLng: number;
  captureZoom: number;
  captureWidthPx: number;
  captureHeightPx: number;
  /** Existing polygon to seed the editor (in normalized 0..1 coords). */
  initialVertices?: NormalizedPoint[];
  /** Color of the polygon outline + fill. */
  color?: string;
  /** Called when the user confirms a polygon. Surface is in m². */
  onConfirm: (vertices: NormalizedPoint[], surfaceM2: number) => void;
}

export function PolygonDrawer({
  open,
  onClose,
  title,
  screenshotDataUrl,
  captureLat,
  captureLng: _captureLng,
  captureZoom,
  captureWidthPx,
  captureHeightPx,
  initialVertices,
  color = "#E8A33D",
  onConfirm,
}: PolygonDrawerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [vertices, setVertices] = useState<NormalizedPoint[]>(
    initialVertices ?? [],
  );
  const [hoverPoint, setHoverPoint] = useState<NormalizedPoint | null>(null);

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setVertices(initialVertices ?? []);
      setHoverPoint(null);
    }
  }, [open, initialVertices]);

  // ESC closes
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && vertices.length >= 3) confirm();
      if ((e.key === "Backspace" || e.key === "Delete") && vertices.length > 0) {
        e.preventDefault();
        undo();
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vertices]);

  const surfaceM2 = useMemo(() => {
    if (vertices.length < 3) return 0;
    return polygonAreaForCapture(vertices, {
      lat: captureLat,
      zoom: captureZoom,
      widthPx: captureWidthPx,
      heightPx: captureHeightPx,
    });
  }, [vertices, captureLat, captureZoom, captureWidthPx, captureHeightPx]);

  if (!open) return null;

  function relativePos(e: React.MouseEvent<HTMLDivElement>): NormalizedPoint | null {
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
    setVertices((v) => [...v, p]);
  }

  function trackHover(e: React.MouseEvent<HTMLDivElement>) {
    setHoverPoint(relativePos(e));
  }

  function undo() {
    setVertices((v) => v.slice(0, -1));
  }

  function clear() {
    setVertices([]);
  }

  function confirm() {
    if (vertices.length < 3) return;
    onConfirm(vertices, surfaceM2);
  }

  function formatM2(n: number): string {
    return new Intl.NumberFormat("fr-CA", {
      maximumFractionDigits: 0,
    }).format(n);
  }

  // Build SVG points string for polygon outline
  const pointsAttr = vertices.map((p) => `${p.x * 100},${p.y * 100}`).join(" ");
  const previewSegment =
    vertices.length > 0 && hoverPoint
      ? `${vertices.at(-1)!.x * 100},${vertices.at(-1)!.y * 100} ${hoverPoint.x * 100},${hoverPoint.y * 100}`
      : null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 px-6 py-3 border-b border-white/10 bg-black/80 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <MapPin size={16} className="text-foreground/70 shrink-0" />
          <h2 className="text-sm font-medium truncate text-white">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={vertices.length === 0}
          >
            <Undo2 size={14} className="mr-1.5" /> Annuler le point
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={clear}
            disabled={vertices.length === 0}
          >
            <Eraser size={14} className="mr-1.5" /> Effacer
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X size={16} />
          </Button>
        </div>
      </header>

      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
        <div
          ref={containerRef}
          onClick={addPoint}
          onMouseMove={trackHover}
          onMouseLeave={() => setHoverPoint(null)}
          className="relative max-w-full max-h-full overflow-hidden rounded-lg border border-white/10 shadow-2xl cursor-crosshair"
          style={{ aspectRatio: `${captureWidthPx} / ${captureHeightPx}` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshotDataUrl}
            alt="Capture satellite"
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
            {previewSegment && vertices.length >= 1 ? (
              <line
                x1={vertices.at(-1)!.x * 100}
                y1={vertices.at(-1)!.y * 100}
                x2={hoverPoint!.x * 100}
                y2={hoverPoint!.y * 100}
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
                r={0.7}
                fill={color}
                stroke="white"
                strokeWidth={0.2}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {vertices.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center bg-black/70 px-4 py-2 rounded-full text-white/90 text-xs backdrop-blur">
                Cliquez sur la carte pour ajouter des points du périmètre
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between gap-4 px-6 py-4 border-t border-white/10 bg-black/80 shrink-0">
        <div className="flex items-baseline gap-6 text-white">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/50">
              Points
            </p>
            <p className="text-base font-medium tabular-nums">
              {vertices.length}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/50">
              Surface
            </p>
            <p className="text-2xl font-semibold tabular-nums tracking-tight">
              {vertices.length >= 3 ? `${formatM2(surfaceM2)} m²` : "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="rounded-full"
            onClick={onClose}
          >
            Annuler
          </Button>
          <Button
            type="button"
            size="lg"
            className="rounded-full"
            disabled={vertices.length < 3}
            onClick={confirm}
          >
            <Check size={16} className="mr-2" />
            Valider {vertices.length >= 3
              ? `(${formatM2(surfaceM2)} m²)`
              : ""}
          </Button>
        </div>
      </footer>
    </div>
  );
}
