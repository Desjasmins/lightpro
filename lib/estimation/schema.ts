import { z } from "zod";

export const sportTypes = [
  "BASEBALL",
  "SOCCER",
  "FOOTBALL",
  "TENNIS",
  "BASKETBALL",
  "PATINOIRE",
  "PATINOIRE_DEK_HOCKEY",
  "PATINOIRE_BASKETBALL",
  "PETANQUE",
  "PISCINE",
  "SKATE_PARC",
  "BADMINTON",
  "STATIONNEMENT",
  "JEUX_ENFANTS",
  "GLISSADE",
  "ECLAIRAGE_SERVICE",
  "AUTRE",
] as const;
export type SportType = (typeof sportTypes)[number];

export const iesClasses = [
  "CLASS_I",
  "CLASS_II",
  "CLASS_III",
  "CLASS_IV",
  "NA",
] as const;
export type IesClass = (typeof iesClasses)[number];

export const poleTypes = [
  "BOIS",
  "ACIER",
  "BETON",
  "ALUMINIUM",
  "MURAL",
  "AUTRE",
] as const;

export const mountTypes = ["TRAVERSE", "FUT"] as const;

export const voltages = ["V120", "V220", "V277", "V347", "V480"] as const;
export type Voltage = (typeof voltages)[number];

export const modules = ["SIMPLE", "DOUBLE", "QUADRUPLE"] as const;

export const powers = ["M200", "M300", "M400", "M600", "M800", "M1200"] as const;

export const optics = ["D15", "D30", "D60", "D90"] as const;

export const ccts = ["K3000", "K4000", "K5700"] as const;

export const cris = ["CRI70", "CRI80"] as const;

export const visors = [
  "VN",
  "VSS",
  "VLS",
  "VN_VN",
  "VSS_VSS",
  "VSS_VN",
  "VLS_VSS",
  "VLS_VN",
] as const;

/** Simplified visor choices exposed to the user on the configuration tab. */
export const visorsSimple = ["VN", "VSS", "VLS"] as const;
export type VisorSimple = (typeof visorsSimple)[number];

export const brackets = ["BTU", "BTUE", "BTR", "BTE"] as const;
export type Bracket = (typeof brackets)[number];

export const controls = [
  "BASE",
  "SMART_POLE",
  "SMART_POWERBOX",
  "SMART_ZONE",
  "SMART_POWERBOX_BT",
] as const;
export type ControlArchitecture = (typeof controls)[number];

export const projectStepSchema = z.object({
  name: z.string().min(2, "Required").max(120),
  municipality: z.string().min(2, "Required").max(120),
  contactName: z.string().min(2, "Required").max(120),
  contactEmail: z.string().email("Invalid email"),
});
export type ProjectStepValues = z.infer<typeof projectStepSchema>;

export const polygonPointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});
export type PolygonPoint = z.infer<typeof polygonPointSchema>;

export const poleSchema = z.object({
  id: z.string().optional(),
  index: z.coerce.number().int().min(1).max(99),
  type: z.enum(poleTypes),
  heightM: z.coerce.number().positive().max(120),
  mountType: z.enum(mountTypes),
  nbCrossarms: z.coerce.number().int().min(0).max(4),
  nbExistingFixtures: z.coerce.number().int().min(0).max(99),
  existingPowerW: z.coerce.number().int().min(0).max(5000),
  voltage: z.enum(voltages),
  positionX: z.coerce.number().min(0).max(1).optional(),
  positionY: z.coerce.number().min(0).max(1).optional(),
});
export type PoleValues = z.infer<typeof poleSchema>;

export const configurationSchema = z.object({
  fieldId: z.string(),
  module: z.enum(modules),
  power: z.enum(powers),
  optic: z.enum(optics),
  cct: z.enum(ccts),
  cri: z.enum(cris),
  voltage: z.enum(voltages),
  visor: z.enum(visors),
  bracket: z.enum(brackets),
  withRegulation: z.boolean(),
  control: z.enum(controls),
  hqOseEligible: z.boolean(),
});
export type ConfigurationValues = z.infer<typeof configurationSchema>;

/**
 * Per-field configuration captured in the 4th tab of the terrain editor.
 * The remaining ConfigurationValues fields (module, power, optic, …) are
 * auto-derived from the poles in lib/estimation/config-derive.ts.
 */
export const fieldConfigSchema = z.object({
  bracket: z.enum(brackets),
  visor: z.enum(visorsSimple),
  control: z.enum(controls),
  replaceCrossarms: z.boolean(),
});
export type FieldConfigValues = z.infer<typeof fieldConfigSchema>;

/**
 * A full self-contained Field — has its own address, capture, perimeter, poles,
 * and per-field product configuration.
 */
export const fieldSchema = z.object({
  id: z.string(),
  // Identity
  name: z.string().min(2, "Required").max(120),
  sportType: z.enum(sportTypes),
  iesClass: z.enum(iesClasses),
  // Geographic
  address: z.string().min(5, "Required").max(240),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  placeId: z.string().optional(),
  // Capture metadata (session-only screenshotDataUrl is in the store, not in the schema)
  captureZoom: z.number().int().min(1).max(20).optional(),
  captureWidthPx: z.number().int().min(64).max(2048).optional(),
  captureHeightPx: z.number().int().min(64).max(2048).optional(),
  // Perimeter (polygon vertices in normalized 0..1 coords)
  perimeter: z.array(polygonPointSchema).optional(),
  surfaceM2: z.coerce.number().positive("Must be positive").max(500000),
  // Poles
  poles: z.array(poleSchema),
  // Per-field configuration (optional during draft, required to reach summary)
  config: fieldConfigSchema.optional(),
});
export type FieldValues = z.infer<typeof fieldSchema>;

export const fullEstimationSchema = z.object({
  project: projectStepSchema,
  fields: z.array(fieldSchema).min(1),
  configurations: z.array(configurationSchema).min(1),
  hqOseEligible: z.boolean(),
});
export type FullEstimation = z.infer<typeof fullEstimationSchema>;
