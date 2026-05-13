// Simplified calculation engine — MVP version.
// Implements scenario A (1-for-1) per §9.2 and §10.
// Scenario B (full IES RP-6-22) is reported as "study required" until tables arrive.

import {
  HQ_OSE_RATE,
  HOURS_USE_PER_YEAR,
  HQ_TARIFF_PER_KWH,
  GHG_FACTOR_KG_PER_KWH,
  HOURLY_RATE_CPE,
  HOURLY_RATE_ING,
  POWER_WATTS,
  bracketCost,
  buildProductCode,
  controlCostPerPole,
  engineeringHours,
  matchProduct,
  unitPriceCad,
  visorCost,
} from "./catalog";
import type { FullEstimation, PoleValues } from "./schema";

export interface FieldBreakdown {
  fieldId: string;
  fieldName: string;
  productCode: string;
  module: string;
  power: string;
  qty: number;
  totalPowerW: number;
  fixturesPriceCad: number;
  accessoriesPriceCad: number;
  controlPriceCad: number;
  engineeringHours: number;
  engineeringCostCad: number;
  oldPowerW: number;
  energySavingsKwhYear: number;
  ghgReductionKgYear: number;
  verdict: "GO" | "NOGO";
}

export interface EstimationResult {
  scenarioATotalQty: number;
  scenarioATotalPowerW: number;
  scenarioATotalPriceCad: number;
  scenarioBTotalQty: number | null;
  scenarioBTotalPowerW: number | null;
  scenarioBTotalPriceCad: number | null;
  verdictGoNoGo: "GO" | "NOGO";
  engineeringHours: number;
  supervisionHours: number;
  engineeringCostCad: number;
  hqOseRebateCad: number;
  totalCostBeforeRebateCad: number;
  totalCostAfterRebateCad: number;
  energySavingsKwhYear: number;
  ghgReductionKgYear: number;
  fields: FieldBreakdown[];
}

function totalsForField(
  fieldId: string,
  fieldName: string,
  poles: PoleValues[],
  cfg: FullEstimation["configurations"][number],
): FieldBreakdown {
  // Scenario A — 1-for-1 replacement: total qty = sum of existing fixtures
  const totalQty = poles.reduce((a, p) => a + p.nbExistingFixtures, 0);

  // For the unit price, prefer the user-chosen (module, power); fall back to per-pole match.
  // We use the user-chosen config for ALL fixtures of the field (uniform configuration assumption).
  const unit = unitPriceCad(cfg.module, cfg.power, cfg.withRegulation);
  const fixturesPrice = unit * totalQty;

  // Accessories
  const accessoriesPrice =
    (visorCost(cfg.visor) + bracketCost(cfg.bracket)) * totalQty;

  // Control: per pole
  const controlPrice = controlCostPerPole(cfg.control) * poles.length;

  // Engineering for this field
  const eh = engineeringHours(totalQty);
  // Mix: 50/50 CPE/ING
  const engineeringCost =
    (eh.expertise / 2) * HOURLY_RATE_CPE +
    (eh.expertise / 2) * HOURLY_RATE_ING +
    eh.supervision * HOURLY_RATE_ING;

  const newWattsPerFixture = POWER_WATTS[cfg.power];
  const totalNewW = newWattsPerFixture * totalQty;

  const oldPowerW = poles.reduce(
    (a, p) => a + p.existingPowerW * p.nbExistingFixtures,
    0,
  );

  const energySavingsKwhYear =
    Math.max(0, (oldPowerW - totalNewW) * HOURS_USE_PER_YEAR) / 1000;
  const ghgReductionKgYear = energySavingsKwhYear * GHG_FACTOR_KG_PER_KWH * 1000;

  // Verdict — capacity check: sum of slots available (crossarms ≥1 → up to 4 fixtures, otherwise 1)
  const capacity = poles.reduce(
    (a, p) => a + Math.max(1, p.nbCrossarms * 4),
    0,
  );
  const verdict: "GO" | "NOGO" = totalQty <= capacity ? "GO" : "NOGO";

  const productCode = buildProductCode(
    cfg.module,
    cfg.cct,
    cfg.optic,
    cfg.power,
    cfg.cri,
    cfg.visor,
    cfg.bracket,
  );

  return {
    fieldId,
    fieldName,
    productCode,
    module: cfg.module,
    power: cfg.power,
    qty: totalQty,
    totalPowerW: totalNewW,
    fixturesPriceCad: fixturesPrice,
    accessoriesPriceCad: accessoriesPrice,
    controlPriceCad: controlPrice,
    engineeringHours: eh.total,
    engineeringCostCad: engineeringCost,
    oldPowerW,
    energySavingsKwhYear,
    ghgReductionKgYear,
    verdict,
  };
}

export function calculateEstimation(
  data: FullEstimation,
): EstimationResult {
  const fields: FieldBreakdown[] = data.fields.map((f) => {
    const cfg = data.configurations.find((c) => c.fieldId === f.id) ??
      // safe fallback (should not happen, ConfigurationStep ensures coverage)
      ({
        fieldId: f.id,
        ...matchProduct(400),
        optic: "D30" as const,
        cct: "K4000" as const,
        cri: "CRI70" as const,
        voltage: "V480" as const,
        visor: "VN" as const,
        bracket: "BTU" as const,
        withRegulation: true,
        control: "BASE" as const,
        hqOseEligible: false,
      });

    return totalsForField(f.id, f.name, f.poles, cfg);
  });

  const scenarioATotalQty = fields.reduce((a, f) => a + f.qty, 0);
  const scenarioATotalPowerW = fields.reduce((a, f) => a + f.totalPowerW, 0);
  const fixturesTotal = fields.reduce((a, f) => a + f.fixturesPriceCad, 0);
  const accessoriesTotal = fields.reduce(
    (a, f) => a + f.accessoriesPriceCad + f.controlPriceCad,
    0,
  );
  const engineeringCost = fields.reduce((a, f) => a + f.engineeringCostCad, 0);
  const engineeringHoursTotal = fields.reduce(
    (a, f) => a + f.engineeringHours,
    0,
  );

  const totalBefore = fixturesTotal + accessoriesTotal + engineeringCost;
  const rebate = data.hqOseEligible ? fixturesTotal * HQ_OSE_RATE : 0;
  const totalAfter = totalBefore - rebate;

  const energySavings = fields.reduce(
    (a, f) => a + f.energySavingsKwhYear,
    0,
  );
  const ghg = fields.reduce((a, f) => a + f.ghgReductionKgYear, 0);

  const verdictGoNoGo = fields.some((f) => f.verdict === "NOGO")
    ? "NOGO"
    : "GO";

  return {
    scenarioATotalQty,
    scenarioATotalPowerW,
    scenarioATotalPriceCad: fixturesTotal,
    scenarioBTotalQty: null,
    scenarioBTotalPowerW: null,
    scenarioBTotalPriceCad: null,
    verdictGoNoGo,
    engineeringHours: engineeringHoursTotal,
    supervisionHours: engineeringHoursTotal * (1 / 11), // approximation of the 10% slice
    engineeringCostCad: engineeringCost,
    hqOseRebateCad: rebate,
    totalCostBeforeRebateCad: totalBefore,
    totalCostAfterRebateCad: totalAfter,
    energySavingsKwhYear: energySavings,
    ghgReductionKgYear: ghg,
    fields,
  };
}
