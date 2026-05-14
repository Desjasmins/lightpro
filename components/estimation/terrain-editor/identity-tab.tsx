"use client";

/**
 * Identity tab — set name/sport/IES/address, then "freeze" the satellite view.
 *
 * The freeze flow replaces the old screenshot capture: instead of producing a
 * static image, we lock the field's `lat/lng/lockedZoom` to the user's chosen
 * map state. Subsequent tabs (Perimeter, Poles) render a live but
 * non-interactive Maps JS view at this same lat/lng/zoom — no image needed.
 *
 * Re-locking after work has been done warns + clears perimeter/poles, since
 * those positions are anchored in lat/lng but the user's mental model expects
 * to "redo" the choice.
 */

import { AddressCombobox } from "@/components/estimation/address-combobox";
import type { SelectedPlace } from "@/components/estimation/places-autocomplete";
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
import {
  iesClasses,
  sportTypes,
  type FieldValues,
} from "@/lib/estimation/schema";
import {
  AdvancedMarker,
  Map,
  Pin,
  useMap,
  type MapCameraChangedEvent,
} from "@vis.gl/react-google-maps";
import { ArrowRight, Check, Lock, MapPin, Unlock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

interface IdentityTabProps {
  value: FieldValues;
  onChange: (patch: Partial<FieldValues>) => void;
  /** Optional callback to advance to the next tab; only provided when valid. */
  onAdvance?: () => void;
}

const DEFAULT_CENTER = { lat: 45.5017, lng: -73.5673 };
const DEFAULT_ZOOM = 11;

function MapFlyTo({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap();
  // Destructure to primitives so React Hook deps stay stable across renders
  // (the parent passes a fresh object each render, which would otherwise
  // re-trigger the effect on every parent update).
  const lat = target?.lat;
  const lng = target?.lng;
  useEffect(() => {
    if (!map || lat == null || lng == null) return;
    map.panTo({ lat, lng });
    map.setZoom(18);
  }, [map, lat, lng]);
  return null;
}

export function IdentityTab({ value, onChange, onAdvance }: IdentityTabProps) {
  const t = useTranslations("TerrainEditor.identity");
  const tStepper = useTranslations("TerrainEditor.stepper");
  const tFooter = useTranslations("TerrainEditor.footer");
  const tSports = useTranslations("Sports");
  const tIes = useTranslations("IesClasses");

  const sportLabels = Object.fromEntries(
    sportTypes.map((s) => [s, tSports(s)]),
  );
  const iesLabels = Object.fromEntries(iesClasses.map((c) => [c, tIes(c)]));

  const initialCenter =
    value.lat !== 0 && value.lng !== 0
      ? { lat: value.lat, lng: value.lng }
      : DEFAULT_CENTER;
  const initialZoom = value.lockedZoom ?? DEFAULT_ZOOM;

  const [camera, setCamera] = useState({
    lat: initialCenter.lat,
    lng: initialCenter.lng,
    zoom: initialZoom,
  });
  const [pendingPlace, setPendingPlace] = useState<{
    lat: number;
    lng: number;
    address: string;
    placeId?: string;
  } | null>(null);
  const [, startTransition] = useTransition();

  const isLocked = value.lockedZoom != null;

  function handleSelectPlace(place: SelectedPlace) {
    setPendingPlace(place);
    onChange({
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      placeId: place.placeId,
      // Selecting a new address invalidates any frozen view.
      lockedZoom: undefined,
    });
  }

  function handleCameraChange(ev: MapCameraChangedEvent) {
    if (isLocked) return;
    startTransition(() => {
      setCamera({
        lat: ev.detail.center.lat,
        lng: ev.detail.center.lng,
        zoom: ev.detail.zoom,
      });
    });
  }

  function lockView() {
    // Store the raw float zoom so the reloaded framing matches exactly what
    // the user saw — rounding made the polygon overlay clip on re-open.
    const zoom = Math.max(1, Math.min(21, camera.zoom));
    onChange({
      lat: camera.lat,
      lng: camera.lng,
      lockedZoom: zoom,
    });
    toast.success(t("lockSuccess"));
  }

  function unlockView() {
    // Modifying the framing invalidates the polygon and pole positions
    // (anchored to the previous lat/lng/zoom). We reset both unconditionally
    // — the user clicked "Modifier la vue", they know they're redoing.
    onChange({
      lockedZoom: undefined,
      perimeter: [],
      surfaceM2: 0,
      poles: [],
    });
  }

  const nameValid = value.name.trim().length >= 2;
  const addressValid =
    value.address.trim().length >= 5 && value.lat !== 0 && value.lng !== 0;
  const allValid = nameValid && addressValid && isLocked;

  return (
    <>
      {/*
        Layout strategy:
          - mobile: single scrollable column. Map (aspect-video, no fixed
            height) on top, then the sidebar form flows below. Parent owns the
            scroll; no nested scroll containers crushing each other.
          - desktop (lg): 2-col grid. Sidebar fixed 380px left, map fills the
            rest. Sidebar gets its own internal scroll.
        flex-col-reverse on mobile + lg:grid puts the map first visually
        without reshuffling DOM order (which keeps the sidebar header focused
        for keyboard / screen readers).
      */}
      <div className="flex flex-col-reverse lg:h-full lg:overflow-hidden lg:grid lg:grid-cols-[380px_1fr]">
        {/* ─── SIDEBAR — DOM 1; desktop column 1 (left); mobile bottom ── */}
        <aside className="border-border bg-card/30 flex flex-col lg:border-r lg:overflow-hidden lg:min-h-0">
          <div className="p-6 border-b border-border space-y-3">
            <div className="space-y-1">
              <h3 className="text-2xl font-semibold">{t("title")}</h3>
            </div>
            <ol className="text-xs text-muted-foreground leading-relaxed space-y-1.5 list-none">
              {(tStepper.raw("guideSteps") as string[]).map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-foreground/10 text-foreground text-[10px] font-semibold tabular-nums">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="p-6 space-y-4 lg:overflow-y-auto lg:flex-1">
            {/* Address — visible only on desktop (mobile shows the address
                input as a separate row pinned above the map; see bottom of
                this component). */}
            <div className="space-y-1.5 hidden lg:block">
              <Label>{t("address")}</Label>
              <AddressCombobox
                defaultValue={value.address}
                placeholder={t("addressPh")}
                onSelect={handleSelectPlace}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("name")}</Label>
              <Input
                value={value.name}
                placeholder={t("namePh")}
                onChange={(e) => onChange({ name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("activity")}</Label>
              <Select
                value={value.sportType}
                onValueChange={(v) =>
                  onChange({ sportType: v as typeof value.sportType })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue labels={sportLabels} />
                </SelectTrigger>
                <SelectContent>
                  {sportTypes.map((s) => (
                    <SelectItem key={s} value={s}>
                      {tSports(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("iesLevel")}</Label>
              <Select
                value={value.iesClass}
                onValueChange={(v) =>
                  onChange({ iesClass: v as typeof value.iesClass })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue labels={iesLabels} />
                </SelectTrigger>
                <SelectContent>
                  {iesClasses.map((c) => (
                    <SelectItem key={c} value={c}>
                      {tIes(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Coords + status */}
            <div className="pt-2 border-t border-border space-y-1 text-xs text-muted-foreground">
              <div className="inline-flex items-center gap-1.5">
                <MapPin size={12} /> {camera.lat.toFixed(5)},{" "}
                {camera.lng.toFixed(5)}
              </div>
              <div>
                {t("zoomLabel")} {camera.zoom.toFixed(1)}
              </div>
              <div>
                {isLocked ? (
                  <span className="inline-flex items-center gap-1 text-foreground">
                    <Check size={12} /> {tStepper("locked")}
                  </span>
                ) : (
                  <span>{t("captureHint")}</span>
                )}
              </div>
            </div>
          </div>

          {/* Footer CTA — visible once all locked */}
          {allValid && onAdvance ? (
            <div className="p-4 border-t border-border bg-green-500/5">
              <Button
                type="button"
                size="lg"
                className="w-full rounded-full"
                onClick={onAdvance}
              >
                {tFooter("next")}
                <ArrowRight size={14} className="ml-2" />
              </Button>
            </div>
          ) : null}
        </aside>

        {/* ─── MAP — DOM 2; mobile top (flex-col-reverse); desktop right ──
            Mobile: `h-[50vh]` + `shrink-0` so the map keeps its full height
            even when the form sidebar below pushes the total content past
            the viewport (flex children otherwise shrink by default).
            Desktop: `lg:h-full` fills the grid row. */}
        <div className="relative bg-black overflow-hidden w-full h-[50vh] shrink-0 lg:h-full lg:shrink">
          <Map
            defaultCenter={initialCenter}
            defaultZoom={initialZoom}
            onCameraChanged={handleCameraChange}
            mapTypeId="satellite"
            gestureHandling={isLocked ? "none" : "greedy"}
            disableDefaultUI={isLocked}
            mapTypeControl={false}
            streetViewControl={false}
            fullscreenControl={false}
            zoomControl={!isLocked}
            clickableIcons={false}
            keyboardShortcuts={!isLocked}
            mapId="lightbase-estimation"
            className="h-full w-full"
          >
            <MapFlyTo
              target={
                pendingPlace
                  ? { lat: pendingPlace.lat, lng: pendingPlace.lng }
                  : null
              }
            />
            {(() => {
              const markerLat = pendingPlace?.lat ?? value.lat;
              const markerLng = pendingPlace?.lng ?? value.lng;
              if (
                markerLat == null ||
                markerLng == null ||
                (markerLat === 0 && markerLng === 0)
              ) {
                return null;
              }
              return (
                <AdvancedMarker
                  position={{ lat: markerLat, lng: markerLng }}
                  title={pendingPlace?.address ?? value.address}
                >
                  <Pin
                    background="#E8A33D"
                    borderColor="#000"
                    glyphColor="#000"
                  />
                </AdvancedMarker>
              );
            })()}
          </Map>

          {/* Lock / unlock action — top-right floating */}
          {isLocked ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="absolute top-3 right-3 rounded-full shadow-lg z-10"
              onClick={unlockView}
            >
              <Unlock size={13} className="mr-1.5" />
              {tStepper("unlockView")}
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              className="absolute top-3 right-3 rounded-full shadow-xl z-10"
              disabled={!addressValid}
              onClick={lockView}
            >
              <Lock size={16} className="mr-2" />
              {tStepper("lockView")}
            </Button>
          )}
        </div>

        {/* Mobile-only address bar — last in DOM so `flex-col-reverse` pins
            it ABOVE the map on mobile. Hidden on desktop where the sidebar
            already exposes the same combobox. */}
        <div className="lg:hidden bg-card/30 border-b border-border p-4 space-y-1.5">
          <Label>{t("address")}</Label>
          <AddressCombobox
            defaultValue={value.address}
            placeholder={t("addressPh")}
            onSelect={handleSelectPlace}
          />
        </div>
      </div>
    </>
  );
}
