"use client";

/**
 * Perimeter tab — draws a polygon directly on a frozen Maps JS view.
 *
 * The map is rendered with `gestureHandling="none"` and no controls so the
 * user can't pan/zoom (the satellite view is "frozen" at the lat/lng/zoom
 * locked in the Identity tab). Clicking the map adds a vertex; vertices are
 * stored as real lat/lng on the field.
 *
 * Surface is computed via spherical-excess formula (lib/estimation/geo.ts).
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps";
import { Button } from "@/components/ui/button";
import { geoPolygonAreaM2 } from "@/lib/estimation/geo";
import type { FieldValues, GeoPoint } from "@/lib/estimation/schema";
import { MapPolygon } from "@/components/estimation/map/map-polygon";
import { Eraser, Undo2, AlertTriangle, MapPin } from "lucide-react";

interface PerimeterTabProps {
  value: FieldValues;
  onChange: (patch: Partial<FieldValues>) => void;
  color: string;
}

function formatM2(n: number): string {
  return new Intl.NumberFormat("fr-CA", {
    maximumFractionDigits: 0,
  }).format(n);
}

interface MapClickHandlerProps {
  onMapClick: (point: GeoPoint) => void;
}

function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    // Raw google.maps click event — `latLng` is a LatLng object whose lat/lng
    // are functions, not properties. (The @vis.gl/react-google-maps wrapper
    // only adds the `detail` envelope for its own event props, not for raw
    // map.addListener calls.)
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

export function PerimeterTab({
  value,
  onChange,
  color,
}: PerimeterTabProps) {
  const t = useTranslations("TerrainEditor.perimeter");

  const vertices = (value.perimeter ?? []) as GeoPoint[];

  const surfaceM2 = useMemo(() => {
    if (vertices.length < 3) return 0;
    return geoPolygonAreaM2(vertices);
  }, [vertices]);

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

  // When the user drags a vertex marker, Google fires a final "click" on
  // mouseup at the drop point — which would add a NEW vertex right where they
  // dropped. We swallow map clicks during/just-after a vertex drag.
  const draggingRef = useRef(false);

  const handleMapClick = useCallback(
    (p: GeoPoint) => {
      if (draggingRef.current) return;
      onChange({ perimeter: [...vertices, p] });
    },
    [vertices, onChange],
  );

  function moveVertex(index: number, p: GeoPoint) {
    onChange({
      perimeter: vertices.map((v, i) => (i === index ? p : v)),
    });
  }

  function removeVertex(index: number) {
    onChange({ perimeter: vertices.filter((_, i) => i !== index) });
  }

  function undo() {
    onChange({ perimeter: vertices.slice(0, -1) });
  }

  function clear() {
    onChange({ perimeter: [], surfaceM2: 0 });
  }

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

  const isComplete = vertices.length >= 3;
  const center = { lat: value.lat, lng: value.lng };

  // Layout: single scrollable column on mobile (map sized by aspect ratio,
  // sidebar flows below in the same scroll); 2-col grid on desktop with
  // separate internal scrolls.
  return (
    <div className="lg:h-full lg:overflow-hidden lg:grid lg:grid-cols-[1fr_360px]">
      {/* MAP — frozen satellite. Cursor strategy:
            - `draggableCursor` / `draggingCursor` (Google API): sets the
              cursor on the inner canvas overlay.
            - `[&_.gm-style]:!cursor-crosshair` (Tailwind): forces crosshair
              on the `.gm-style` root only — NOT on descendants, so vertex
              markers can declare their own `cursor-pointer`. */}
      <div className="relative bg-black overflow-hidden [&_.gm-style]:!cursor-crosshair w-full h-[50vh] lg:h-full">
        <Map
          defaultCenter={center}
          defaultZoom={value.lockedZoom}
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
          <MapClickHandler onMapClick={handleMapClick} />
          <MapPolygon
            paths={vertices}
            color={color}
            preview={vertices.length < 3}
          />
          {vertices.map((p, i) => (
            <AdvancedMarker
              key={i}
              position={{ lat: p.lat, lng: p.lng }}
              draggable
              onDragStart={() => {
                draggingRef.current = true;
              }}
              onDrag={(ev) => {
                const ll = ev.latLng;
                if (!ll) return;
                moveVertex(i, { lat: ll.lat(), lng: ll.lng() });
              }}
              onDragEnd={(ev) => {
                const ll = ev.latLng;
                if (ll) moveVertex(i, { lat: ll.lat(), lng: ll.lng() });
                // Keep the flag set briefly so the trailing map "click" event
                // (which Google fires on drag mouseup) doesn't create a new
                // vertex at the drop point.
                setTimeout(() => {
                  draggingRef.current = false;
                }, 0);
              }}
              onClick={(ev) => {
                // Right-clicking is awkward inside the canvas; for now, a
                // shift-click removes a vertex. Plain click is no-op so the
                // marker doesn't add a new one through map.click bubbling.
                const domEv = ev.domEvent as MouseEvent | undefined;
                if (domEv?.shiftKey) {
                  removeVertex(i);
                }
              }}
            >
              <span
                className="block w-3.5 h-3.5 rounded-full ring-2 ring-white shadow cursor-pointer active:cursor-grabbing"
                style={{ background: color }}
                title="Glisser pour repositionner · Maj+clic pour supprimer"
              />
            </AdvancedMarker>
          ))}
        </Map>
      </div>

      {/* SIDEBAR — right column (desktop) / below map (mobile). On mobile
          we let the content flow naturally (parent handles scroll); on
          desktop we hide overflow and let the inner content div scroll. */}
      <aside className="lg:border-l border-border bg-card/30 flex flex-col lg:overflow-hidden lg:min-h-0">
        <div className="p-6 border-b border-border space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("stepLabel")}
          </p>
          <h3 className="text-2xl font-semibold">{t("title")}</h3>
        </div>

        <div className="p-6 space-y-5 lg:overflow-y-auto lg:flex-1">
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
