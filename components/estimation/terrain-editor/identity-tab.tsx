"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  AdvancedMarker,
  Map,
  Pin,
  useMap,
  type MapCameraChangedEvent,
} from "@vis.gl/react-google-maps";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import type { FieldCapture } from "@/lib/estimation/store";
import { captureSatelliteMap } from "@/app/actions/capture";
import {
  AddressSearchBar,
  type SelectedPlace,
} from "@/components/estimation/places-autocomplete";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Camera, Check, Loader2, MapPin } from "lucide-react";

interface IdentityTabProps {
  value: FieldValues;
  capture?: FieldCapture;
  onChange: (patch: Partial<FieldValues>) => void;
  onCapture: (
    field: Partial<FieldValues>,
    capture: FieldCapture,
  ) => void;
}

const DEFAULT_CENTER = { lat: 45.5017, lng: -73.5673 };
const DEFAULT_ZOOM = 11;

function MapFlyTo({
  target,
}: {
  target: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (!map || !target) return;
    map.panTo(target);
    map.setZoom(18);
  }, [map, target?.lat, target?.lng]);
  return null;
}

export function IdentityTab({
  value,
  capture,
  onChange,
  onCapture,
}: IdentityTabProps) {
  const t = useTranslations("TerrainEditor.identity");
  const tSports = useTranslations("Sports");
  const tIes = useTranslations("IesClasses");

  const sportLabels = Object.fromEntries(
    sportTypes.map((s) => [s, tSports(s)]),
  );
  const iesLabels = Object.fromEntries(iesClasses.map((c) => [c, tIes(c)]));

  // Initialize the map at the saved position if any, else default Montréal
  const initialCenter =
    value.lat !== 0 && value.lng !== 0
      ? { lat: value.lat, lng: value.lng }
      : DEFAULT_CENTER;
  const initialZoom =
    value.captureZoom && value.lat !== 0 ? value.captureZoom : DEFAULT_ZOOM;

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
  const [confirmRecaptureOpen, setConfirmRecaptureOpen] = useState(false);
  const [_, startTransition] = useTransition();

  function handleSelectPlace(place: SelectedPlace) {
    setPendingPlace(place);
    // The MapFlyTo helper will animate the map there.
  }

  function handleCameraChange(ev: MapCameraChangedEvent) {
    startTransition(() => {
      setCamera({
        lat: ev.detail.center.lat,
        lng: ev.detail.center.lng,
        zoom: ev.detail.zoom,
      });
    });
  }

  const captureMutation = useMutation({
    mutationFn: async () => {
      const lat = camera.lat;
      const lng = camera.lng;
      const zoom = Math.max(1, Math.min(21, Math.round(camera.zoom)));
      // Google Static Maps caps to 640 max per dimension at scale=1.
      // We request 640×360 (16:9 within limit). The server adds scale=2 so the
      // actual PNG is 1280×720 retina. Math uses the logical dims (640×360).
      const widthPx = 640;
      const heightPx = 360;
      const result = await captureSatelliteMap({
        lat,
        lng,
        zoom,
        width: widthPx,
        height: heightPx,
      });
      if (!result.ok) throw new Error(result.error);

      onCapture(
        {
          address:
            pendingPlace?.address ||
            value.address ||
            t("captureCustom"),
          lat,
          lng,
          placeId: pendingPlace?.placeId ?? value.placeId,
          captureZoom: zoom,
          captureWidthPx: widthPx,
          captureHeightPx: heightPx,
        },
        {
          dataUrl: result.dataUrl,
          width: result.width,
          height: result.height,
        },
      );
      return result;
    },
    onSuccess: () => toast.success(t("captureSuccess")),
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : t("captureFailed")),
  });

  function handleCaptureClick() {
    const hasExistingWork =
      capture && ((value.perimeter?.length ?? 0) > 0 || value.poles.length > 0);
    if (hasExistingWork) {
      setConfirmRecaptureOpen(true);
      return;
    }
    captureMutation.mutate();
  }

  return (
    <>
    <div className="max-w-4xl mx-auto py-8 px-6 space-y-6">
      <div className="space-y-1">
        <h3 className="lb-h3">{t("title")}</h3>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Identity form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5 md:col-span-2">
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
      </div>

      {/* Address + map + capture combobox */}
      <div className="space-y-2">
        <Label>{t("address")}</Label>
        <div className="rounded-2xl border border-border bg-card/40 overflow-hidden">
          <AddressSearchBar
            placeholder={t("addressPh")}
            variant="embedded"
            onSelect={handleSelectPlace}
            trailing={
              <Button
                type="button"
                size="default"
                className="rounded-full h-9 px-4"
                disabled={captureMutation.isPending}
                onClick={handleCaptureClick}
              >
                {captureMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    {t("capturing")}
                  </>
                ) : capture ? (
                  <>
                    <Camera size={14} className="mr-2" /> {t("recaptureButton")}
                  </>
                ) : (
                  <>
                    <Camera size={14} className="mr-2" /> {t("captureButton")}
                  </>
                )}
              </Button>
            }
          />
          <div className="aspect-video w-full bg-card border-t border-border">
            <Map
              defaultCenter={initialCenter}
              defaultZoom={initialZoom}
              onCameraChanged={handleCameraChange}
              mapTypeId="satellite"
              gestureHandling="greedy"
              disableDefaultUI={false}
              mapTypeControl={false}
              streetViewControl={false}
              fullscreenControl={true}
              zoomControl={true}
              clickableIcons={false}
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
          </div>
        </div>
        <div className="px-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={12} /> {camera.lat.toFixed(5)}, {camera.lng.toFixed(5)}
          </span>
          <span>·</span>
          <span>
            {t("zoomLabel")} {camera.zoom.toFixed(1)}
          </span>
          {capture ? (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-1 text-green-600">
                <Check size={12} /> {t("viewCaptured")}
              </span>
            </>
          ) : (
            <>
              <span>·</span>
              <span>{t("captureHint")}</span>
            </>
          )}
        </div>
      </div>

      {/* Capture preview thumbnail */}
      {capture ? (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("previewTitle")}
          </p>
          <div className="overflow-hidden rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capture.dataUrl}
              alt={t("previewAlt")}
              className="block w-full h-auto"
            />
          </div>
        </div>
      ) : null}
    </div>

    <ConfirmDialog
      open={confirmRecaptureOpen}
      onOpenChange={setConfirmRecaptureOpen}
      title={t("confirmRecaptureTitle")}
      description={t("confirmRecaptureBody")}
      confirmLabel={t("confirmRecaptureConfirm")}
      destructive
      onConfirm={() => captureMutation.mutate()}
    />
    </>
  );
}
