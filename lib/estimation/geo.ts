/**
 * Spherical earth math for polygons defined in lat/lng.
 *
 * We use these helpers in lieu of a satellite-image-pixel approach because the
 * estimator now stores polygons in real geographic coordinates (drawn on top
 * of a frozen Maps JS view). This is identical in spirit to
 * `google.maps.geometry.spherical.computeArea` — kept here so server-side code
 * (and tests) don't need the Maps JS runtime.
 */

import type { GeoPoint } from "./schema";

const EARTH_RADIUS_M = 6378137;

function deg2rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Polygon area in square meters using the spherical-excess formula.
 *
 * Implementation matches Google Maps' computeArea so values are interchangeable
 * with what the client renders. Vertices are in WGS84 (lat/lng); the polygon
 * is closed implicitly (last vertex connects back to first).
 *
 * Returns 0 for degenerate polygons (< 3 vertices).
 */
export function geoPolygonAreaM2(
  vertices: ReadonlyArray<GeoPoint>,
): number {
  const n = vertices.length;
  if (n < 3) return 0;

  let total = 0;
  for (let i = 0; i < n; i++) {
    const p1 = vertices[i]!;
    const p2 = vertices[(i + 1) % n]!;
    total +=
      deg2rad(p2.lng - p1.lng) *
      (2 + Math.sin(deg2rad(p1.lat)) + Math.sin(deg2rad(p2.lat)));
  }
  return Math.abs((total * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2);
}
