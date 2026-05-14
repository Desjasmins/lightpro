"use client";

/**
 * Declarative wrapper around `google.maps.Polygon` for use inside a
 * `<Map>` from @vis.gl/react-google-maps. The library doesn't ship its own
 * Polygon component, so we add/remove the underlying overlay imperatively.
 */

import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import type { GeoPoint } from "@/lib/estimation/schema";

interface MapPolygonProps {
  paths: ReadonlyArray<GeoPoint>;
  /** Stroke + fill color (hex). Defaults to brand orange. */
  color?: string;
  fillOpacity?: number;
  strokeWeight?: number;
  /** Show the open/closing polyline as dashed when < 3 vertices. */
  preview?: boolean;
}

export function MapPolygon({
  paths,
  color = "#E8A33D",
  fillOpacity = 0.18,
  strokeWeight = 2,
  preview = false,
}: MapPolygonProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (paths.length === 0) return;

    const isClosed = paths.length >= 3 && !preview;

    let overlay: google.maps.Polygon | google.maps.Polyline;
    if (isClosed) {
      overlay = new google.maps.Polygon({
        paths: paths.map((p) => ({ lat: p.lat, lng: p.lng })),
        strokeColor: color,
        strokeOpacity: 1,
        strokeWeight,
        fillColor: color,
        fillOpacity,
        clickable: false,
        zIndex: 1,
      });
    } else {
      overlay = new google.maps.Polyline({
        path: paths.map((p) => ({ lat: p.lat, lng: p.lng })),
        strokeColor: color,
        strokeOpacity: 0.9,
        strokeWeight,
        clickable: false,
        zIndex: 1,
      });
    }
    overlay.setMap(map);
    return () => {
      overlay.setMap(null);
    };
  }, [map, paths, color, fillOpacity, strokeWeight, preview]);

  return null;
}
