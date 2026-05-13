/**
 * Unit prices for the Lightpro estimation tool.
 *
 * Source: Book1.xlsx (Sheet2) — provided by Lightbase, May 2026.
 * Notes:
 *  - 347V variants are always priced as `100-277V variant + $30`.
 *  - Visor and bracket prices are per-fixture surcharges.
 *  - Control prices are per-luminaire (the box-based options share the box
 *    cost across 8 luminaires; Book1 already amortized those for us).
 *  - Installation and pole-replacement prices include lifting equipment.
 */

import type { Bracket, ControlArchitecture, Voltage } from "./schema";

/** Lightpro variants currently priced in the catalog. */
export type LightproVariant = "300W" | "400W";

/** Voltage tier — affects only the per-fixture price (+$30 for 347V). */
export type LightproVoltageTier = "LV" | "HV"; // LV = 100-277 V, HV = 347 V

/** Lightpro unit price (CAD) by variant and voltage tier. */
export function lightproPrice(
  variant: LightproVariant,
  tier: LightproVoltageTier,
): number {
  const base = variant === "300W" ? 465 : 575;
  return tier === "HV" ? base + 30 : base;
}

/** Map a fût voltage enum to the simplified pricing tier. */
export function voltageTier(voltage: Voltage | undefined): LightproVoltageTier {
  // 347 V (and the higher 480 V if used) → HV pricing.
  // Everything 277 V or below → LV pricing.
  if (voltage === "V347" || voltage === "V480") return "HV";
  return "LV";
}

/**
 * Visor surcharge (CAD per luminaire). VN = no visor = free.
 * VSS = short, VLS = long. Prices differ slightly between 300 W and 400 W.
 */
export function visorPrice(
  visor: "VN" | "VSS" | "VLS",
  variant: LightproVariant,
): number {
  if (visor === "VN") return 0;
  if (variant === "300W") return visor === "VSS" ? 29 : 89;
  return visor === "VSS" ? 31 : 91;
}

/** Bracket surcharge (CAD per luminaire). */
export function bracketPrice(bracket: Bracket): number {
  switch (bracket) {
    case "BTU":
      return 29;
    case "BTUE":
      return 49;
    case "BTR":
      return 49;
    case "BTE":
      // BTE price not in Book1 — placeholder; revisit when Lightbase confirms.
      return 49;
  }
}

/**
 * Control system price per luminaire (CAD).
 * Box-based options assume 8 luminaires per box (already amortized).
 */
export function controlPricePerLuminaire(
  control: ControlArchitecture,
): number {
  switch (control) {
    case "BASE":
      return 148; // Option 1: Individual node 5G
    case "SMART_POLE":
      return 43.5; // Option 2: Control per box (8) 5G
    case "SMART_POWERBOX":
      return 81; // Option 3: Control + Power per box (8) 5G
    case "SMART_ZONE":
      return 78.5; // Option 4: Wifi + 5G central
    case "SMART_POWERBOX_BT":
      return 100; // Option 5: Bluetooth
  }
}

/** Installation cost per luminaire (CAD), includes lifting equipment. */
export const INSTALLATION_PER_LUMINAIRE = 205;

/** Junction box NEMA 18×18 (CAD). */
export const JUNCTION_BOX_PRICE = 200;

/** Crossarm kits (CAD each). */
export const CROSSARM_L1000 = 60.62;
export const CROSSARM_L2000 = 70.62;

/** New pole installed (CAD), by height in feet. Source: Book1. */
const POLE_PRICE_TABLE_FT: readonly { ft: number; price: number }[] = [
  { ft: 30, price: 15_000 },
  { ft: 50, price: 30_000 },
  { ft: 60, price: 40_000 },
  { ft: 70, price: 60_000 },
  { ft: 80, price: 80_000 },
  { ft: 90, price: 120_000 },
] as const;

/**
 * Get the price for a new pole, rounding the requested height up to the next
 * tabulated value (we never under-spec a pole on an estimate).
 */
export function newPolePriceByHeightFt(heightFt: number): number {
  for (const row of POLE_PRICE_TABLE_FT) {
    if (row.ft >= heightFt) return row.price;
  }
  // Above 90 ft → use the tallest in the table; flag in the report.
  return POLE_PRICE_TABLE_FT[POLE_PRICE_TABLE_FT.length - 1]!.price;
}

/** Convert meters to feet. */
export const FT_PER_M = 3.28084;
