import { matchProduct } from "./catalog";
import type {
  ConfigurationValues,
  FieldConfigValues,
  FieldValues,
  VisorSimple,
} from "./schema";

/**
 * Translate the user-facing simple visor + module pairing rule into the
 * 8-value visor code expected by the catalog. SIMPLE module → single visor;
 * DOUBLE/QUADRUPLE → paired code (e.g. VSS → VSS_VSS, VLS → VLS_VN).
 */
function pairVisor(
  simple: VisorSimple,
  module: ConfigurationValues["module"],
): ConfigurationValues["visor"] {
  if (module === "SIMPLE") return simple;
  if (simple === "VN") return "VN_VN";
  if (simple === "VSS") return "VSS_VSS";
  return "VLS_VN";
}

/**
 * Build a complete ConfigurationValues for the calculator from a field's
 * per-field config (4 user inputs) plus auto-derived defaults based on the
 * existing poles.
 */
export function deriveFullConfiguration(
  field: FieldValues,
  hqOseEligible: boolean,
): ConfigurationValues {
  const avgPower =
    field.poles.length > 0
      ? field.poles.reduce((a, p) => a + p.existingPowerW, 0) /
        field.poles.length
      : 400;
  const match = matchProduct(avgPower);
  const cfg: FieldConfigValues = field.config ?? {
    bracket: "BTU",
    visor: "VN",
    control: "BASE",
    replaceCrossarms: false,
  };
  return {
    fieldId: field.id,
    module: match.module,
    power: match.power,
    optic: "D30",
    cct: "K4000",
    cri: "CRI70",
    voltage: field.poles[0]?.voltage ?? "V480",
    visor: pairVisor(cfg.visor, match.module),
    bracket: cfg.bracket,
    withRegulation: true,
    control: cfg.control,
    hqOseEligible,
  };
}

/** Derive a configurations array from a list of fields. */
export function deriveConfigurations(
  fields: readonly FieldValues[],
  hqOseEligible: boolean,
): ConfigurationValues[] {
  return fields.map((f) => deriveFullConfiguration(f, hqOseEligible));
}

export function defaultFieldConfig(): FieldConfigValues {
  return {
    bracket: "BTU",
    visor: "VN",
    control: "BASE",
    replaceCrossarms: false,
  };
}
