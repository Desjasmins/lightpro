/**
 * Photometric standards lookup table.
 *
 * Source: QTY-LUMINAIRE-SPORTIF.xlsx (Feuil1) — Lightbase, May 2026.
 * Each entry gives, for a representative field configuration of a given sport,
 * the number of luminaires required to meet the IES RP-6 class target lux
 * level (I/II/III/IV), along with the pole count and recommended height.
 *
 * Usage: given a user's sport + IES class + field area, find the closest
 * tabulated configuration and (optionally) scale the luminaire count by the
 * surface ratio. This yields a defensible Scenario B estimate without
 * requiring full photometric simulation.
 */

import type { IesClass, SportType } from "./schema";

export type StandardClass = "I" | "II" | "III" | "IV";

export interface StandardRow {
  /** Human-readable label (e.g. "65x65 (8 pole)"). */
  label: string;
  /** Field width — same unit as length (typically meters, follow source). */
  width: number;
  length: number;
  /** Pole count used in the reference photometry. */
  poles: number;
  /** Luminaires required by class. `null` = class not applicable. */
  qty: Record<StandardClass, number | null>;
  /** Achieved illuminance in lux (informational). */
  illuminance: number;
  /** Recommended pole height in meters. */
  heightM: number;
  /** Playing surface in m². */
  areaM2: number;
}

export interface SportStandards {
  /** Target lux per class (`null` = N/A). */
  classLux: Record<StandardClass, number | null>;
  rows: readonly StandardRow[];
}

/**
 * Map our internal SportType enum → the standards bucket. Several of our
 * sportTypes map to the same physical standard (e.g. PATINOIRE variants all
 * map to Hockey). Sports with no entry here have no Scenario B available.
 */
const SPORT_TO_STANDARD: Partial<Record<SportType, keyof typeof STANDARDS>> = {
  BASEBALL: "BASEBALL",
  FOOTBALL: "FOOTBALL",
  SOCCER: "SOCCER",
  TENNIS: "TENNIS",
  BASKETBALL: "BASKETBALL",
  PATINOIRE: "HOCKEY",
  PATINOIRE_DEK_HOCKEY: "HOCKEY",
  PATINOIRE_BASKETBALL: "HOCKEY",
};

export const STANDARDS = {
  BASEBALL: {
    classLux: { I: 1500, II: 1000, III: 500, IV: 300 },
    rows: [
      { label: "65x65 (8 pole)", width: 65, length: 65, poles: 8,
        qty: { I: 115, II: 77, III: 39, IV: 22 },
        illuminance: 288, heightM: 14, areaM2: 3318 },
      { label: "72x72 (4 pole)", width: 72, length: 72, poles: 4,
        qty: { I: 283, II: 189, III: 95, IV: 60 },
        illuminance: 319, heightM: 17, areaM2: 4072 },
      { label: "69x69 (6 pole) — 15 m", width: 69, length: 69, poles: 6,
        qty: { I: 176, II: 118, III: 59, IV: 36 },
        illuminance: 307, heightM: 15, areaM2: 3739 },
      { label: "69x69 (6 pole) — 17 m", width: 69, length: 69, poles: 6,
        qty: { I: 157, II: 105, III: 53, IV: 32 },
        illuminance: 306, heightM: 17, areaM2: 3739 },
      { label: "102x102 (6 pole)", width: 102, length: 102, poles: 6,
        qty: { I: 310, II: 207, III: 103, IV: 62 },
        illuminance: 499, heightM: 20, areaM2: 8171 },
      { label: "90x84 (8 pole)", width: 90, length: 84, poles: 8,
        qty: { I: 305, II: 203, III: 102, IV: 60 },
        illuminance: 296, heightM: 15, areaM2: 6362 },
      { label: "76x76 (9 pole)", width: 76, length: 76, poles: 9,
        qty: { I: 169, II: 113, III: 57, IV: 51 },
        illuminance: 453, heightM: 15, areaM2: 4536 },
    ],
  },
  FOOTBALL: {
    classLux: { I: 1000, II: 500, III: 300, IV: 200 },
    rows: [
      { label: "130x62 (10 pole)", width: 130, length: 62, poles: 10,
        qty: { I: 268, II: 134, III: 81, IV: 53 },
        illuminance: 198, heightM: 18, areaM2: 8060 },
      { label: "138x60 (6 pole)", width: 138, length: 60, poles: 6,
        qty: { I: 399, II: 200, III: 118, IV: 80 },
        illuminance: 296, heightM: 19, areaM2: 8280 },
      { label: "131x60 (6 pole)", width: 131, length: 60, poles: 6,
        qty: { I: 299, II: 150, III: 90, IV: 63 },
        illuminance: 211, heightM: 15, areaM2: 7860 },
    ],
  },
  SOCCER: {
    classLux: { I: 750, II: 500, III: 300, IV: 200 },
    rows: [
      { label: "73x48 (10 pole)", width: 73, length: 48, poles: 10,
        qty: { I: 100, II: 67, III: 40, IV: 24 },
        illuminance: 181, heightM: 13, areaM2: 3504 },
      { label: "58x28 (4 pole)", width: 58, length: 28, poles: 4,
        qty: { I: 60, II: 40, III: 24, IV: 17 },
        illuminance: 216, heightM: 10, areaM2: 1624 },
      { label: "104x62 (5 pole)", width: 104, length: 62, poles: 5,
        qty: { I: 199, II: 133, III: 80, IV: 57 },
        illuminance: 215, heightM: 21, areaM2: 6448 },
      { label: "100x62 (6 pole)", width: 100, length: 62, poles: 6,
        qty: { I: 172, II: 115, III: 70, IV: 46 },
        illuminance: 306, heightM: 21, areaM2: 6200 },
      { label: "84x50 (7 pole)", width: 84, length: 50, poles: 7,
        qty: { I: 115, II: 77, III: 46, IV: 28 },
        illuminance: 184, heightM: 15, areaM2: 4200 },
      { label: "101x65 (6 pole)", width: 101, length: 65, poles: 6,
        qty: { I: 175, II: 117, III: 70, IV: 43 },
        illuminance: 185, heightM: 15, areaM2: 6565 },
      { label: "105x63 (6 pole)", width: 105, length: 63, poles: 6,
        qty: { I: 175, II: 117, III: 70, IV: 42 },
        illuminance: 180, heightM: 21, areaM2: 6615 },
      { label: "99x56 (6 pole)", width: 99, length: 56, poles: 6,
        qty: { I: 126, II: 84, III: 51, IV: 33 },
        illuminance: 197, heightM: 12, areaM2: 5544 },
      { label: "68x48 (3 pole)", width: 68, length: 48, poles: 3,
        qty: { I: 71, II: 47, III: 29, IV: 20 },
        illuminance: 214, heightM: 12, areaM2: 3264 },
      { label: "57x38 (3 pole)", width: 57, length: 38, poles: 3,
        qty: { I: 57, II: 38, III: 23, IV: 16 },
        illuminance: 211, heightM: 12, areaM2: 2166 },
    ],
  },
  HOCKEY: {
    classLux: { I: null, II: 500, III: 300, IV: 200 },
    rows: [
      { label: "62x26 (4 pole)", width: 62, length: 26, poles: 4,
        qty: { I: null, II: 33, III: 20, IV: 14 },
        illuminance: 213, heightM: 17, areaM2: 1612 },
      { label: "50x25 (4 pole)", width: 50, length: 25, poles: 4,
        qty: { I: null, II: 26, III: 16, IV: 11 },
        illuminance: 214, heightM: 12, areaM2: 1250 },
      { label: "40x17 (2 pole)", width: 40, length: 17, poles: 2,
        qty: { I: null, II: 16, III: 10, IV: 6 },
        illuminance: 196, heightM: 12, areaM2: 680 },
      { label: "46x20 (6 pole)", width: 46, length: 20, poles: 6,
        qty: { I: null, II: 21, III: 13, IV: 8 },
        illuminance: 193, heightM: 8, areaM2: 920 },
      { label: "40x16 (4 pole)", width: 40, length: 16, poles: 4,
        qty: { I: null, II: 17, III: 10, IV: 8 },
        illuminance: 243, heightM: 8.5, areaM2: 640 },
      { label: "53x22 (4 pole)", width: 53, length: 22, poles: 4,
        qty: { I: null, II: 24, III: 15, IV: 9 },
        illuminance: 192, heightM: 8, areaM2: 1166 },
    ],
  },
  TENNIS: {
    classLux: { I: 1250, II: 750, III: 500, IV: 300 },
    rows: [
      { label: "32x36 (2 court, 4 pole) — 8 m", width: 32, length: 36, poles: 4,
        qty: { I: 52, II: 31, III: 21, IV: 12 },
        illuminance: 292, heightM: 8, areaM2: 1152 },
      { label: "82x37 (4 court, 6 pole)", width: 82, length: 37, poles: 6,
        qty: { I: 117, II: 71, III: 47, IV: 27 },
        illuminance: 288.75, heightM: 10, areaM2: 3034 },
      { label: "32x34 (2 court, 4 pole)", width: 32, length: 34, poles: 4,
        qty: { I: 54, II: 32, III: 22, IV: 12 },
        illuminance: 281.5, heightM: 12, areaM2: 1088 },
      { label: "52x36 (3 court, 4 pole)", width: 52, length: 36, poles: 4,
        qty: { I: 81, II: 49, III: 33, IV: 19 },
        illuminance: 295, heightM: 12, areaM2: 1872 },
      { label: "32x36 (2 court, 4 pole) — 11 m a", width: 32, length: 36, poles: 4,
        qty: { I: 47, II: 29, III: 19, IV: 11 },
        illuminance: 293.5, heightM: 11, areaM2: 1152 },
      { label: "32x36 (2 court, 4 pole) — 11 m b", width: 32, length: 36, poles: 4,
        qty: { I: 45, II: 27, III: 18, IV: 11 },
        illuminance: 308.5, heightM: 11, areaM2: 1152 },
      { label: "35x36 (2 court, 4 pole)", width: 35, length: 36, poles: 4,
        qty: { I: 47, II: 28, III: 19, IV: 11 },
        illuminance: 297.5, heightM: 11, areaM2: 1260 },
      { label: "69x36 (4 court, 9 pole)", width: 69, length: 36, poles: 9,
        qty: { I: 92, II: 55, III: 37, IV: 23 },
        illuminance: 315.25, heightM: 12.5, areaM2: 2484 },
      { label: "32x36 (2 court, 4 pole) — 9.5 m", width: 32, length: 36, poles: 4,
        qty: { I: 49, II: 30, III: 20, IV: 12 },
        illuminance: 306.5, heightM: 9.5, areaM2: 1152 },
    ],
  },
  PICKLEBALL: {
    classLux: { I: null, II: 750, III: 500, IV: 300 },
    rows: [
      { label: "34x20 (4 court, 3 pole)", width: 34, length: 20, poles: 3,
        qty: { I: null, II: 20, III: 14, IV: 8 },
        illuminance: 306.5, heightM: 12, areaM2: 680 },
    ],
  },
  VOLLEYBALL: {
    classLux: { I: null, II: null, III: 300, IV: 200 },
    rows: [
      { label: "62x54 (4 pole)", width: 62, length: 54, poles: 4,
        qty: { I: null, II: null, III: 37, IV: 22 },
        illuminance: 181, heightM: 17, areaM2: 3348 },
    ],
  },
  BASKETBALL: {
    classLux: { I: null, II: null, III: 300, IV: 200 },
    rows: [
      { label: "34x19 (2 pole)", width: 34, length: 19, poles: 2,
        qty: { I: null, II: null, III: 10, IV: 6 },
        illuminance: 183, heightM: 10, areaM2: 646 },
    ],
  },
} as const satisfies Record<string, SportStandards>;

/** Convert our IesClass enum → standard class key. NA defaults to IV. */
export function iesClassToStandard(iesClass: IesClass): StandardClass {
  if (iesClass === "CLASS_I") return "I";
  if (iesClass === "CLASS_II") return "II";
  if (iesClass === "CLASS_III") return "III";
  return "IV"; // CLASS_IV and NA both default to IV
}

export interface StandardMatch {
  /** Required luminaire count (scaled to the user's actual surface). */
  qty: number;
  /** Required pole count (from the matched reference row). */
  poles: number;
  /** Recommended pole height in meters. */
  heightM: number;
  /** Target illuminance for this class (lux). */
  targetLux: number;
  /** The reference row that was matched. */
  reference: StandardRow;
  /** Ratio applied to scale qty (userArea / referenceArea). */
  areaRatio: number;
}

/**
 * Find the standard configuration that best matches the user's terrain.
 *
 * Matching strategy:
 *   1. Filter the sport's rows to those that publish a qty for the target class
 *   2. Pick the row with the closest playing-surface area
 *   3. Scale the qty linearly by the area ratio (so a 5000 m² field uses
 *      `row.qty × 5000 / row.areaM2` luminaires)
 *
 * Returns `null` if no standard is available (unsupported sport or class
 * marked N/A for that sport).
 */
export function findStandardConfig(
  sport: SportType,
  iesClass: IesClass,
  areaM2: number,
): StandardMatch | null {
  const stdKey = SPORT_TO_STANDARD[sport];
  if (!stdKey) return null;
  const std = STANDARDS[stdKey];
  const cls = iesClassToStandard(iesClass);
  const targetLux = std.classLux[cls];
  if (targetLux == null) return null;

  let best: StandardRow | null = null;
  let bestDelta = Infinity;
  for (const row of std.rows) {
    if (row.qty[cls] == null) continue;
    const delta = Math.abs(row.areaM2 - areaM2);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = row;
    }
  }
  if (!best) return null;
  const refQty = best.qty[cls];
  if (refQty == null) return null;

  const areaRatio = areaM2 > 0 ? areaM2 / best.areaM2 : 1;
  const scaledQty = Math.max(1, Math.round(refQty * areaRatio));
  const scaledPoles = Math.max(1, Math.round(best.poles * areaRatio));

  return {
    qty: scaledQty,
    poles: scaledPoles,
    heightM: best.heightM,
    targetLux,
    reference: best,
    areaRatio,
  };
}
