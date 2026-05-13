"use client";

import { useEffect, useState, useCallback } from "react";
import type { ProjectStepValues, FieldValues } from "./schema";

const STORAGE_KEY = "lightbase-estimation-draft-v2";

/**
 * In-session capture metadata. The dataURL is large (~500KB base64); keep all
 * captures in sessionStorage but expect a hard limit at ~5MB total.
 */
export interface FieldCapture {
  dataUrl: string;
  /** Final PNG dimensions (after scale=2 retina doubling). */
  width: number;
  height: number;
}

export type FieldDraft = FieldValues;

export interface EstimationDraft {
  step: number;
  project?: ProjectStepValues;
  fields: FieldDraft[];
  /** Map from fieldId → capture dataURL + dimensions. Session-only. */
  captures: Record<string, FieldCapture>;
  hqOseEligible: boolean;
}

const emptyDraft: EstimationDraft = {
  step: 1,
  fields: [],
  captures: {},
  hqOseEligible: false,
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

  const upsertField = useCallback(
    (field: FieldDraft, capture?: FieldCapture) => {
      setDraft((d) => {
        const existing = d.fields.findIndex((f) => f.id === field.id);
        const fields =
          existing === -1
            ? [...d.fields, field]
            : d.fields.map((f, i) => (i === existing ? field : f));
        const captures = capture
          ? { ...d.captures, [field.id]: capture }
          : d.captures;
        return { ...d, fields, captures };
      });
    },
    [],
  );

  const removeField = useCallback((fieldId: string) => {
    setDraft((d) => {
      const fields = d.fields.filter((f) => f.id !== fieldId);
      const { [fieldId]: _drop, ...captures } = d.captures;
      void _drop;
      return { ...d, fields, captures };
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
