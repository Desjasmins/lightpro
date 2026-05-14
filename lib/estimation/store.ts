"use client";

import { useEffect, useState, useCallback } from "react";
import type { ProjectStepValues, FieldValues } from "./schema";

// v3 — broke compat with v2 (removed captures dataUrl, switched polygon and
// pole positions from normalized pixel coords to real-world lat/lng).
const STORAGE_KEY = "lightbase-estimation-draft-v3";

export type FieldDraft = FieldValues;

export interface EstimationDraft {
  step: number;
  project?: ProjectStepValues;
  fields: FieldDraft[];
  hqOseEligible: boolean;
}

const emptyDraft: EstimationDraft = {
  step: 1,
  fields: [],
  // Most municipal/institutional clients qualify for HQ-OSE — opt-out by user.
  hqOseEligible: true,
};

function readDraft(): EstimationDraft {
  if (typeof window === "undefined") return emptyDraft;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDraft;
    const parsed = JSON.parse(raw) as Partial<EstimationDraft>;
    return { ...emptyDraft, ...parsed };
  } catch {
    return emptyDraft;
  }
}

function writeDraft(draft: EstimationDraft) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // storage may be full — ignore for MVP
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

  const upsertField = useCallback((field: FieldDraft) => {
    setDraft((d) => {
      const existing = d.fields.findIndex((f) => f.id === field.id);
      const fields =
        existing === -1
          ? [...d.fields, field]
          : d.fields.map((f, i) => (i === existing ? field : f));
      return { ...d, fields };
    });
  }, []);

  const removeField = useCallback((fieldId: string) => {
    setDraft((d) => {
      const fields = d.fields.filter((f) => f.id !== fieldId);
      return { ...d, fields };
    });
  }, []);

  return {
    draft,
    hydrated,
    update,
    setStep,
    reset,
    upsertField,
    removeField,
  };
}
