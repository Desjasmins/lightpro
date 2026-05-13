"use server";

import { z } from "zod";

const captureInputSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  zoom: z.number().int().min(1).max(20).default(18),
  // Google Static Maps caps to 640 per dimension at scale=1. We always pass
  // scale=2 so the file is actually 2×these dims.
  width: z.number().int().min(64).max(640).default(640),
  height: z.number().int().min(64).max(640).default(360),
});

export interface CaptureSuccess {
  ok: true;
  dataUrl: string;
  width: number;
  height: number;
}

export interface CaptureFailure {
  ok: false;
  error: string;
}

export type CaptureResponse = CaptureSuccess | CaptureFailure;

const STATIC_MAPS_BASE = "https://maps.googleapis.com/maps/api/staticmap";

export async function captureSatelliteMap(
  raw: unknown,
): Promise<CaptureResponse> {
  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error(
      "[capture] Missing Google Maps API key (GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)",
    );
    return {
      ok: false,
      error: "Service temporarily unavailable. Please try again later.",
    };
  }

  const parsed = captureInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid capture parameters" };
  }
  const { lat, lng, zoom, width, height } = parsed.data;

  const url = new URL(STATIC_MAPS_BASE);
  url.searchParams.set("center", `${lat},${lng}`);
  url.searchParams.set("zoom", String(zoom));
  url.searchParams.set("size", `${width}x${height}`);
  url.searchParams.set("scale", "2"); // retina — actual file is 2× these dims
  url.searchParams.set("maptype", "satellite");
  url.searchParams.set("format", "png");
  url.searchParams.set("key", apiKey);

  const masked = url.toString().replace(apiKey, "AIza***");
  console.warn(
    `[captureSatelliteMap] requesting ${width}x${height} @scale=2 → ${masked}`,
  );

  try {
    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) {
      const text = await response.text();
      return {
        ok: false,
        error: `Static Maps API error ${response.status}: ${text.slice(0, 200)}`,
      };
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const base64 = buffer.toString("base64");
    console.warn(
      `[captureSatelliteMap] received ${buffer.byteLength} bytes (PNG, actual ${width * 2}x${height * 2})`,
    );
    return {
      ok: true,
      dataUrl: `data:image/png;base64,${base64}`,
      width, // logical width — used for ground area math
      height, // logical height — used for ground area math
    };
  } catch (error: unknown) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
