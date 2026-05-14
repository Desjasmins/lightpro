/**
 * Two-scenario cost estimator.
 *
 * Scenario A (1:1) — replace each existing fixture with a Lightpro LED unit.
 *   Uses the data the user typed in (poles, existing fixtures, voltage, etc.).
 *   Quantity = sum of `nbExistingFixtures` across the field's poles.
 *
 * Scenario B (IES standard) — what the field SHOULD have to meet RP-6.
 *   Looks up the per-sport, per-IES-class photometric reference table
 *   (lib/estimation/standards.ts), then scales by the user's actual surface.
 *   Quantity = `STD.qty * (userArea / referenceArea)`, rounded.
 *
 * Both scenarios share the same per-field configuration choices the user made
 * (bracket, visor, control, replaceCrossarms) and the same fixture variant
 * (LP 300W / LP 400W, 100-277 V / 347 V) derived from the existing poles.
 *
 * The output is intentionally rich so the UI can render either scenario
 * side-by-side or independently.
 */

import { defaultFieldConfig } from "./config-derive";
import {
  CROSSARM_L1000,
  FT_PER_M,
  INSTALLATION_PER_LUMINAIRE,
  bracketPrice,
  controlPricePerLuminaire,
  lightproPrice,
  newPolePriceByHeightFt,
  visorPrice,
  voltageTier,
  type LightproVariant,
} from "./pricing";
import type { FieldConfigValues, FieldValues, IesClass } from "./schema";
import { findStandardConfig, type StandardMatch } from "./standards";

/** Detailed cost breakdown for one scenario. */
export interface CostBreakdown {
  qtyLuminaires: number;
  qtyPolesExisting: number;
  qtyPolesNew: number;
  /** Lightpro variant used (300W / 400W) for the price lookup. */
  variant: LightproVariant;
  luminairesCost: number;
  visorsCost: number;
  bracketsCost: number;
  controlsCost: number;
  crossarmsCost: number;
  newPolesCost: number;
  installationCost: number;
  /** Sum of all cost components above. */
  subtotal: number;
}

/** Result for one terrain. */
export interface FieldEstimate {
  fieldId: string;
  fieldName: string;
  /** Street address the user picked; surfaced in the email report. */
  address: string;
  sport: string;
  iesClass: IesClass;
  surfaceM2: number;
  /** Scenario A — 1-for-1 replacement of what the user entered. */
  scenarioA: CostBreakdown;
  /** Scenario B — what the IES standard requires. `null` if no STD available. */
  scenarioB: CostBreakdown | null;
  /** Standard reference details (target lux, ref row, GO/NOGO). */
  standard: StandardComparison | null;
}

/** Comparison of user's existing infrastructure to the standard's requirements. */
export interface StandardComparison {
  targetLux: number;
  requiredPoles: number;
  requiredLuminaires: number;
  requiredHeightM: number;
  existingPoles: number;
  existingLuminaires: number;
  existingMinHeightM: number;
  missingPoles: number;
  missingLuminaires: number;
  /** Closest matched reference row label (e.g. "65x65 (8 pole)"). */
  referenceLabel: string;
  /** userArea / referenceArea, used to scale the reference. */
  areaRatio: number;
  /** GO if existing fûts ≥ required AND existing height ≥ required. */
  goNoGo: "GO" | "NOGO";
  /** Reasons for NOGO (for UI explanation). */
  goNoGoReasons: ("INSUFFICIENT_POLES" | "INSUFFICIENT_HEIGHT")[];
}

/** Project-level totals across all fields. */
export interface ProjectEstimate {
  fields: FieldEstimate[];
  totalScenarioA: number;
  /** `null` if no field has a Scenario B available. */
  totalScenarioB: number | null;
  /** B − A (positive = standard costs more). `null` if B unavailable. */
  deltaCost: number | null;
}

// ─────────────────────────────────────────────────────────────────────
// Variant + voltage selection
// ─────────────────────────────────────────────────────────────────────

/**
 * Pick the Lightpro variant for this field.
 *
 * For now: always LP 300 W. Lightbase will provide a decision rule later
 * (e.g. based on pole height, target lumens, or an explicit user choice).
 */
function pickVariant(
  _avgPowerW: number,
  _iesClass: IesClass,
): LightproVariant {
  return "300W";
}

function averageExistingPowerW(field: FieldValues): number {
  if (field.poles.length === 0) return 0;
  return (
    field.poles.reduce((a, p) => a + p.existingPowerW, 0) / field.poles.length
  );
}

function totalExistingFixtures(field: FieldValues): number {
  return field.poles.reduce((a, p) => a + p.nbExistingFixtures, 0);
}

function totalExistingCrossarms(field: FieldValues): number {
  return field.poles.reduce((a, p) => a + p.nbCrossarms, 0);
}

function minExistingHeightM(field: FieldValues): number {
  if (field.poles.length === 0) return 0;
  return Math.min(...field.poles.map((p) => p.heightM));
}

// ─────────────────────────────────────────────────────────────────────
// Cost computation
// ─────────────────────────────────────────────────────────────────────

interface BreakdownInputs {
  qtyLuminaires: number;
  qtyExistingPoles: number;
  qtyNewPoles: number;
  /** Height (m) used to price each new pole; falls back to 60 ft equiv. */
  newPoleHeightM: number;
  field: FieldValues;
  cfg: FieldConfigValues;
  variant: LightproVariant;
}

function computeBreakdown(inputs: BreakdownInputs): CostBreakdown {
  const {
    qtyLuminaires,
    qtyExistingPoles,
    qtyNewPoles,
    newPoleHeightM,
    field,
    cfg,
    variant,
  } = inputs;

  const tier = voltageTier(field.poles[0]?.voltage);

  const luminairesCost = qtyLuminaires * lightproPrice(variant, tier);
  const visorsCost = qtyLuminaires * visorPrice(cfg.visor, variant);
  const bracketsCost = qtyLuminaires * bracketPrice(cfg.bracket);
  const controlsCost = qtyLuminaires * controlPricePerLuminaire(cfg.control);

  // Crossarms are tied to the existing poles (we only replace what's there).
  const crossarmsCost = cfg.replaceCrossarms
    ? totalExistingCrossarms(field) * CROSSARM_L1000
    : 0;

  // New poles are only ever non-zero in Scenario B.
  const newPolesCost =
    qtyNewPoles > 0
      ? qtyNewPoles * newPolePriceByHeightFt(newPoleHeightM * FT_PER_M)
      : 0;

  const installationCost = qtyLuminaires * INSTALLATION_PER_LUMINAIRE;

  const subtotal =
    luminairesCost +
    visorsCost +
    bracketsCost +
    controlsCost +
    crossarmsCost +
    newPolesCost +
    installationCost;

  return {
    qtyLuminaires,
    qtyPolesExisting: qtyExistingPoles,
    qtyPolesNew: qtyNewPoles,
    variant,
    luminairesCost,
    visorsCost,
    bracketsCost,
    controlsCost,
    crossarmsCost,
    newPolesCost,
    installationCost,
    subtotal,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────

export function estimateField(field: FieldValues): FieldEstimate {
  const cfg = field.config ?? defaultFieldConfig();
  const avgPowerW = averageExistingPowerW(field);
  const variant = pickVariant(avgPowerW, field.iesClass);
  const qtyExistingFixtures = totalExistingFixtures(field);

  // ─── Scenario A: 1-for-1 ───
  const scenarioA = computeBreakdown({
    qtyLuminaires: qtyExistingFixtures,
    qtyExistingPoles: field.poles.length,
    qtyNewPoles: 0,
    newPoleHeightM: 0,
    field,
    cfg,
    variant,
  });

  // ─── Scenario B: IES standard ───
  let scenarioB: CostBreakdown | null = null;
  let standard: StandardComparison | null = null;

  const match: StandardMatch | null = findStandardConfig(
    field.sportType,
    field.iesClass,
    field.surfaceM2,
  );

  if (match) {
    const existingMinHeight = minExistingHeightM(field);
    const missingPoles = Math.max(0, match.poles - field.poles.length);
    const missingLuminaires = Math.max(
      0,
      match.qty - qtyExistingFixtures,
    );
    const reasons: StandardComparison["goNoGoReasons"] = [];
    if (field.poles.length < match.poles) reasons.push("INSUFFICIENT_POLES");
    if (existingMinHeight > 0 && existingMinHeight < match.heightM) {
      reasons.push("INSUFFICIENT_HEIGHT");
    }
    const goNoGo: "GO" | "NOGO" = reasons.length === 0 ? "GO" : "NOGO";

    standard = {
      targetLux: match.targetLux,
      requiredPoles: match.poles,
      requiredLuminaires: match.qty,
      requiredHeightM: match.heightM,
      existingPoles: field.poles.length,
      existingLuminaires: qtyExistingFixtures,
      existingMinHeightM: existingMinHeight,
      missingPoles,
      missingLuminaires,
      referenceLabel: match.reference.label,
      areaRatio: match.areaRatio,
      goNoGo,
      goNoGoReasons: reasons,
    };

    scenarioB = computeBreakdown({
      qtyLuminaires: match.qty,
      qtyExistingPoles: field.poles.length,
      qtyNewPoles: missingPoles,
      newPoleHeightM: match.heightM,
      field,
      cfg,
      variant,
    });
  }

  return {
    fieldId: field.id,
    fieldName: field.name,
    address: field.address,
    sport: field.sportType,
    iesClass: field.iesClass,
    surfaceM2: field.surfaceM2,
    scenarioA,
    scenarioB,
    standard,
  };
}

export function estimateProject(
  fields: readonly FieldValues[],
): ProjectEstimate {
  const fieldEstimates = fields.map(estimateField);
  const totalScenarioA = fieldEstimates.reduce(
    (a, e) => a + e.scenarioA.subtotal,
    0,
  );
  const anyB = fieldEstimates.some((e) => e.scenarioB !== null);
  const totalScenarioB = anyB
    ? fieldEstimates.reduce(
        // For fields without Scenario B, fall back to Scenario A so totals
        // remain comparable instead of artificially deflated.
        (a, e) => a + (e.scenarioB?.subtotal ?? e.scenarioA.subtotal),
        0,
      )
    : null;
  const deltaCost =
    totalScenarioB !== null ? totalScenarioB - totalScenarioA : null;
  return {
    fields: fieldEstimates,
    totalScenarioA,
    totalScenarioB,
    deltaCost,
  };
}
