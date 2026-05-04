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

export const brackets = ["BTU", "BTUE", "BTR", "BTE"] as const;

export const controls = [
  "BASE",
  "SMART_POLE",
  "SMART_POWERBOX",
  "SMART_ZONE",
] as const;

export const projectStepSchema = z.object({
  name: z.string().min(2, "Required").max(120),
  municipality: z.string().min(2, "Required").max(120),
  contactName: z.string().min(2, "Required").max(120),
  contactEmail: z.string().email("Invalid email"),
});
export type ProjectStepValues = z.infer<typeof projectStepSchema>;

export const addressStepSchema = z.object({
  address: z.string().min(5, "Required").max(240),
});
export type AddressStepValues = z.infer<typeof addressStepSchema>;

export const fieldSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Required").max(120),
  sportType: z.enum(sportTypes),
  iesClass: z.enum(iesClasses),
  surfaceM2: z.coerce.number().positive("Must be positive").max(200000),
});
export type FieldValues = z.infer<typeof fieldSchema>;

export const fieldsStepSchema = z.object({
  fields: z.array(fieldSchema).min(1, "At least one field required"),
});
export type FieldsStepValues = z.infer<typeof fieldsStepSchema>;

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
});
export type PoleValues = z.infer<typeof poleSchema>;

export const polesPerFieldSchema = z.object({
  fieldId: z.string(),
  poles: z.array(poleSchema).min(1, "At least one pole required"),
});

export const polesStepSchema = z.object({
  byField: z.array(polesPerFieldSchema),
});
export type PolesStepValues = z.infer<typeof polesStepSchema>;

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

export const configurationStepSchema = z.object({
  configurations: z.array(configurationSchema).min(1),
  hqOseEligible: z.boolean(),
});
export type ConfigurationStepValues = z.infer<typeof configurationStepSchema>;

export const fullEstimationSchema = z.object({
  project: projectStepSchema,
  address: addressStepSchema,
  fields: z.array(fieldSchema).min(1),
  poles: z.array(polesPerFieldSchema),
  configurations: z.array(configurationSchema).min(1),
  hqOseEligible: z.boolean(),
});
export type FullEstimation = z.infer<typeof fullEstimationSchema>;
