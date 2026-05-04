"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  fullEstimationSchema,
  type FullEstimation,
} from "@/lib/estimation/schema";
import { calculateEstimation } from "@/lib/estimation/calculate";
import type { EstimationResult } from "@/lib/estimation/calculate";

export interface SubmitSuccess {
  ok: true;
  projectId: string;
  result: EstimationResult;
}

export interface SubmitFailure {
  ok: false;
  error: string;
  fieldErrors?: Record<string, string[]>;
}

export type SubmitResponse = SubmitSuccess | SubmitFailure;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unexpected error";
}

export async function submitEstimation(
  raw: unknown,
  locale: "fr" | "en" = "fr",
): Promise<SubmitResponse> {
  const parsed = fullEstimationSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid input",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const data: FullEstimation = parsed.data;
  const result = calculateEstimation(data);

  try {
    const project = await prisma.project.create({
      data: {
        locale: locale === "en" ? "EN" : "FR",
        name: data.project.name,
        municipality: data.project.municipality,
        contactName: data.project.contactName,
        contactEmail: data.project.contactEmail,
        address: data.address.address,
        hqOseEligible: data.hqOseEligible,
        status: "SUBMITTED",
        fields: {
          create: data.fields.map((f) => {
            const cfg = data.configurations.find((c) => c.fieldId === f.id);
            const polesForField =
              data.poles.find((p) => p.fieldId === f.id)?.poles ?? [];
            return {
              name: f.name,
              sportType: f.sportType,
              iesClass: f.iesClass,
              surfaceM2: f.surfaceM2,
              poles: {
                create: polesForField.map((p) => ({
                  index: p.index,
                  type: p.type,
                  heightM: p.heightM,
                  mountType: p.mountType,
                  nbCrossarms: p.nbCrossarms,
                  nbExistingFixtures: p.nbExistingFixtures,
                  existingPowerW: p.existingPowerW,
                  voltage: p.voltage,
                })),
              },
              configuration: cfg
                ? {
                    create: {
                      module: cfg.module,
                      power: cfg.power,
                      optic: cfg.optic,
                      cct: cfg.cct,
                      cri: cfg.cri,
                      voltage: cfg.voltage,
                      visor: cfg.visor,
                      bracket: cfg.bracket,
                      withRegulation: cfg.withRegulation,
                      control: cfg.control,
                    },
                  }
                : undefined,
            };
          }),
        },
        result: {
          create: {
            scenarioATotalQty: result.scenarioATotalQty,
            scenarioATotalPowerW: result.scenarioATotalPowerW,
            scenarioATotalPriceCad: result.scenarioATotalPriceCad,
            scenarioBTotalQty: result.scenarioBTotalQty,
            scenarioBTotalPowerW: result.scenarioBTotalPowerW,
            scenarioBTotalPriceCad: result.scenarioBTotalPriceCad,
            verdictGoNoGo: result.verdictGoNoGo,
            engineeringHours: result.engineeringHours,
            supervisionHours: result.supervisionHours,
            engineeringCostCad: result.engineeringCostCad,
            hqOseRebateCad: result.hqOseRebateCad,
            totalCostBeforeRebateCad: result.totalCostBeforeRebateCad,
            totalCostAfterRebateCad: result.totalCostAfterRebateCad,
            energySavingsKwhYear: result.energySavingsKwhYear,
            ghgReductionKgYear: result.ghgReductionKgYear,
            breakdown: result.fields as unknown as Prisma.InputJsonValue,
          },
        },
      },
      select: { id: true },
    });

    return { ok: true, projectId: project.id, result };
  } catch (error: unknown) {
    return {
      ok: false,
      error: getErrorMessage(error),
    };
  }
}
