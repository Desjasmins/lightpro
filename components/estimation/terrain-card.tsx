"use client";

import { useTranslations } from "next-intl";
import type { FieldValues } from "@/lib/estimation/schema";
import { Button } from "@/components/ui/button";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";

interface TerrainCardProps {
  field: FieldValues;
  color: string;
  captureDataUrl?: string;
  onEdit: () => void;
  onRemove: () => void;
}

function formatM2(n: number): string {
  return new Intl.NumberFormat("fr-CA", {
    maximumFractionDigits: 0,
  }).format(n);
}

export function TerrainCard({
  field,
  color,
  captureDataUrl,
  onEdit,
  onRemove,
}: TerrainCardProps) {
  const t = useTranslations("TerrainCard");
  const tSports = useTranslations("Sports");
  const tIes = useTranslations("IesClasses");

  const isComplete =
    field.name.length > 0 &&
    field.surfaceM2 > 0 &&
    field.poles.length > 0 &&
    Boolean(captureDataUrl);

  const polygonPoints = (field.perimeter ?? [])
    .map((p) => `${p.x * 100},${p.y * 100}`)
    .join(" ");

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card/40 transition hover:border-foreground/30 hover:shadow-lg">
      {/* Image area with overlays */}
      <button
        type="button"
        onClick={onEdit}
        className="relative aspect-video w-full overflow-hidden bg-card cursor-pointer"
        aria-label={`Modifier ${field.name}`}
      >
        {captureDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={captureDataUrl}
            alt={field.name}
            className="absolute inset-0 w-full h-full object-cover transition duration-500 group-hover:scale-[1.03]"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            {t("noCapture")}
          </div>
        )}

        {/* Polygon overlay */}
        {field.perimeter && field.perimeter.length >= 3 ? (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polygon
              points={polygonPoints}
              fill={color}
              fillOpacity={0.18}
              stroke={color}
              strokeWidth={0.4}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        ) : null}

        {/* Pole markers overlay */}
        {field.poles.map((pole) => {
          if (pole.positionX == null || pole.positionY == null) return null;
          return (
            <span
              key={pole.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center w-2.5 h-2.5 rounded-full text-[6px] font-semibold text-black ring-1 ring-black/30 shadow"
              style={{
                left: `${pole.positionX * 100}%`,
                top: `${pole.positionY * 100}%`,
                background: color,
              }}
              aria-hidden
            >
              {pole.index}
            </span>
          );
        })}

        {/* Status badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold text-black shadow-lg"
            style={{ background: color }}
            aria-hidden
          >
            {isComplete ? <Check size={13} /> : "·"}
          </span>
          {isComplete ? (
            <span className="text-[10px] uppercase tracking-wider font-semibold bg-green-600/90 text-white px-2 py-0.5 rounded-full backdrop-blur">
              {t("complete")}
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-wider font-semibold bg-destructive/90 text-white px-2 py-0.5 rounded-full backdrop-blur">
              {t("draft")}
            </span>
          )}
        </div>

        {/* Bottom gradient for readability */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      </button>

      {/* Info area */}
      <div className="p-4 space-y-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold truncate">
            {field.name || t("noName")}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {tSports(field.sportType)} · {tIes(field.iesClass)}
          </p>
        </div>

        <div className="flex items-baseline justify-between text-sm border-t border-border pt-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("surface")}
            </p>
            <p className="font-semibold tabular-nums">
              {field.surfaceM2 > 0 ? `${formatM2(field.surfaceM2)} m²` : "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("polesLabel")}
            </p>
            <p className="font-semibold tabular-nums">{field.poles.length}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full flex-1"
            onClick={onEdit}
          >
            <Pencil size={13} className="mr-1.5" /> {t("edit")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label={t("removeAria")}
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>
    </article>
  );
}

interface AddTerrainCardProps {
  onClick: () => void;
}

export function AddTerrainCard({ onClick }: AddTerrainCardProps) {
  const t = useTranslations("TerrainList");
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border bg-card/20 aspect-video cursor-pointer transition hover:border-foreground/50 hover:bg-card/40 min-h-[240px]"
    >
      <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-foreground/10 text-foreground group-hover:bg-foreground/20 transition">
        <Plus size={28} />
      </span>
      <span className="text-base font-medium">{t("addTitle")}</span>
      <span className="text-xs text-muted-foreground max-w-[60%] text-center">
        {t("addSubtitle")}
      </span>
    </button>
  );
}
