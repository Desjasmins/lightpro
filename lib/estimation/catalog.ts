// Lightpro OM catalog and pricing — based on prompt v4 §7, §9.4, §10
// All values are MVP defaults. Marked [À CONFIRMER] items use placeholder pricing.

import type {
  Module,
  Power,
  Cct,
  Cri,
  Visor,
  Bracket,
  ControlArchitecture,
} from "@prisma/client";

export interface ProductMatch {
  module: Module;
  power: Power;
}

/**
 * §9.4 — Existing power → recommended Lightpro module + power (1-for-1).
 * The goal is to maintain at least the original illuminance.
 */
export function matchProduct(existingPowerW: number): ProductMatch {
  if (existingPowerW <= 250) return { module: "SIMPLE", power: "M200" };
  if (existingPowerW <= 400) return { module: "SIMPLE", power: "M300" };
  if (existingPowerW <= 700) return { module: "DOUBLE", power: "M400" };
  if (existingPowerW <= 1000) return { module: "DOUBLE", power: "M600" };
  if (existingPowerW <= 1500) return { module: "QUADRUPLE", power: "M800" };
  return { module: "QUADRUPLE", power: "M1200" };
}

/**
 * §10.1 — UMQ 2023 baseline unit prices (CAD), with placeholder extrapolation
 * for combinations not in the original grid. [À CONFIRMER 2026]
 */
export function unitPriceCad(
  module: Module,
  power: Power,
  withRegulation: boolean,
): number {
  // Base price by power (extrapolated from UMQ 2023 M300=269.40, M600=525.24)
  const baseByPower: Record<Power, number> = {
    M200: 215.0,
    M300: 269.4,
    M400: 410.0,
    M600: 525.24,
    M800: 720.0,
    M1200: 980.0,
  };

  // Module multiplier
  const moduleMult: Record<Module, number> = {
    SIMPLE: 1,
    DOUBLE: 1,
    QUADRUPLE: 1,
  };

  const base = baseByPower[power] * moduleMult[module];
  // Regulation & metering option ≈ +50% per UMQ ratio (404.16 / 269.40 = 1.50)
  return withRegulation ? base * 1.5 : base;
}

export const POWER_WATTS: Record<Power, number> = {
  M200: 200,
  M300: 300,
  M400: 400,
  M600: 600,
  M800: 800,
  M1200: 1200,
};

/**
 * §10.3 — Engineering hours per UMQ formulas.
 */
export function engineeringHours(totalQty: number) {
  const conception = totalQty / 10;
  const pose = totalQty * 0.25;
  const adjustment = totalQty * 0.25;
  const rapport = totalQty / 10;
  const expertise = conception + pose + adjustment + rapport;
  const supervision = expertise * 0.1;
  return { expertise, supervision, total: expertise + supervision };
}

export const HOURLY_RATE_CPE = 95; // CAD/h
export const HOURLY_RATE_ING = 125; // CAD/h

/**
 * §10.4 — HQ-OSE 5.1 simplified rebate (≈67%).
 */
export const HQ_OSE_RATE = 0.67;

/**
 * §9.6 — Energy savings defaults.
 */
export const HOURS_USE_PER_YEAR = 1500;
export const HQ_TARIFF_PER_KWH = 0.075; // CAD/kWh tarif M
export const GHG_FACTOR_KG_PER_KWH = 0.0015; // ~1.5 g CO₂/kWh

/**
 * §7.6 — Smart Lighting placeholder per-pole cost (CAD).
 */
export function controlCostPerPole(arch: ControlArchitecture): number {
  switch (arch) {
    case "BASE":
      return 0;
    case "SMART_POLE":
      return 240;
    case "SMART_POWERBOX":
      return 320;
    case "SMART_ZONE":
      return 480;
    case "SMART_POWERBOX_BT":
      return 400;
  }
}

/**
 * §7.4 — Visor placeholder per-fixture surcharge (CAD).
 */
export function visorCost(v: Visor): number {
  if (v === "VN" || v === "VN_VN") return 0;
  if (v === "VSS" || v === "VSS_VN" || v === "VSS_VSS") return 38;
  return 62; // VLS variants
}

/**
 * §7.5 — Bracket placeholder per-fixture surcharge (CAD).
 */
export function bracketCost(b: Bracket): number {
  switch (b) {
    case "BTU":
      return 0;
    case "BTUE":
      return 22;
    case "BTR":
      return 65;
    case "BTE":
      return 95;
  }
}

export function buildProductCode(
  module: Module,
  cct: Cct,
  optic: string,
  power: Power,
  cri: Cri,
  visor: Visor,
  bracket: Bracket,
): string {
  const fam = module === "SIMPLE" || module === "DOUBLE" || module === "QUADRUPLE"
    ? "OM300"
    : "OM300";
  const cctCode = cct.replace("K", "").slice(0, 2); // K4000 -> 40
  const criCode = cri.replace("CRI", "");
  const opticCode = optic;
  return `DLLP-${fam}-G2-VU-XX-${cctCode}-${opticCode}-${power}-${criCode}-XX-${visor}-${bracket}-XX-XX`;
}
