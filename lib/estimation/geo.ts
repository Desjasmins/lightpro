// Geographic math for converting on-screen pixel polygons (drawn over a Static
// Maps capture) into real-world square meters.

/**
 * Web Mercator ground resolution: meters per *displayed* pixel at the given
 * latitude and zoom level.
 *
 * Note: Static Maps with `scale=2` returns a PNG with 2x more pixels than the
 * logical viewport, but each "scale=1" pixel still represents this ground
 * resolution. So `metersPerPixel` applies to the logical (scale=1) pixel.
 */
export function metersPerPixel(lat: number, zoom: number): number {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
}

/**
 * Total ground width/height (in meters) covered by a Static Maps capture.
 *
 * @param widthPx Logical width passed to Static Maps (e.g. 1280).
 * @param heightPx Logical height passed to Static Maps (e.g. 800).
 * @param lat Center latitude.
 * @param zoom Zoom level used for the capture (e.g. 18).
 */
export function captureGroundDimensions(
  widthPx: number,
  heightPx: number,
  lat: number,
  zoom: number,
): { widthM: number; heightM: number } {
  const mpp = metersPerPixel(lat, zoom);
  return { widthM: widthPx * mpp, heightM: heightPx * mpp };
}

export interface NormalizedPoint {
  x: number; // 0..1
  y: number; // 0..1
}

/**
 * Compute the polygon area in m² using the Shoelace formula, after converting
 * normalized polygon vertices into real-world meters via the capture's ground
 * dimensions.
 *
 * Assumes the polygon vertices are in [0,1] coordinates relative to the
 * displayed capture (x going right, y going down).
 */
export function polygonAreaM2(
  vertices: ReadonlyArray<NormalizedPoint>,
  groundWidthM: number,
  groundHeightM: number,
): number {
  if (vertices.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i]!;
    const b = vertices[(i + 1) % vertices.length]!;
    const ax = a.x * groundWidthM;
    const ay = a.y * groundHeightM;
    const bx = b.x * groundWidthM;
    const by = b.y * groundHeightM;
    sum += ax * by - bx * ay;
  }
  return Math.abs(sum) / 2;
}

/**
 * Convenience helper: directly compute polygon area given a Static Maps
 * capture's lat / zoom / dimensions and the normalized polygon vertices.
 */
export function polygonAreaForCapture(
  vertices: ReadonlyArray<NormalizedPoint>,
  options: {
    lat: number;
    zoom: number;
    widthPx: number;
    heightPx: number;
  },
): number {
  const { widthM, heightM } = captureGroundDimensions(
    options.widthPx,
    options.heightPx,
    options.lat,
    options.zoom,
  );
  return polygonAreaM2(vertices, widthM, heightM);
}
