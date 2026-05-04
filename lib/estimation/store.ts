"use client";

import { useEffect, useState, useCallback } from "react";
import type {
  ProjectStepValues,
  AddressStepValues,
  FieldValues,
  PoleValues,
  ConfigurationValues,
} from "./schema";

const STORAGE_KEY = "lightbase-estimation-draft-v1";

export interface PolesByField {
  fieldId: string;
  poles: PoleValues[];
}

export interface EstimationDraft {
  step: number;
  project?: ProjectStepValues;
  address?: AddressStepValues;
  fields: FieldValues[];
  poles: PolesByField[];
  configurations: ConfigurationValues[];
  hqOseEligible: boolean;
}

const emptyDraft: EstimationDraft = {
  step: 1,
  fields: [],
  poles: [],
  configurations: [],
  hqOseEligible: false,
};

function readDraft(): EstimationDraft {
  if (typeof window === "undefined") return emptyDraft;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDraft;
    return { ...emptyDraft, ...(JSON.parse(raw) as Partial<EstimationDraft>) };
  } catch {
    return emptyDraft;
  }
}

function writeDraft(draft: EstimationDraft) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // ignore storage failures
  }
}

export function useEstimationDraft() {
  const [draft, setDraft] = useState<EstimationDraft>(emptyDraft);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDraft(readDraft());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeDraft(draft);
  }, [draft, hydrated]);

  const update = useCallback((patch: Partial<EstimationDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  const setStep = useCallback((step: number) => {
    setDraft((d) => ({ ...d, step }));
  }, []);

  const reset = useCallback(() => {
    setDraft(emptyDraft);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return { draft, hydrated, update, setStep, reset };
}
