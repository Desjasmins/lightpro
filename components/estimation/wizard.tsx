"use client";

import { useTranslations } from "next-intl";
import { useEstimationDraft } from "@/lib/estimation/store";
import { Stepper } from "./stepper";
import { Step1Address } from "./steps/step1-address";
import { Step3Summary } from "./steps/step3-summary";
import { Step4Contact } from "./steps/step4-contact";

const TOTAL = 3;

interface WizardProps {
  /** Email pre-filled on the contact step from the gate cookie. */
  prefillEmail?: string;
  /** Display name pre-filled on the contact step from the gate cookie. */
  prefillName?: string | null;
  /** Organization pre-filled on the contact step's municipality field. */
  prefillMunicipality?: string | null;
}

export function Wizard({
  prefillEmail,
  prefillName,
  prefillMunicipality,
}: WizardProps = {}) {
  const t = useTranslations("Estimation");
  const {
    draft,
    hydrated,
    update,
    setStep,
    reset,
    upsertField,
    removeField,
  } = useEstimationDraft();

  if (!hydrated) {
    return (
      <div className="lb-container py-32 text-center text-sm text-muted-foreground">
        …
      </div>
    );
  }

  const current = Math.min(Math.max(draft.step, 1), TOTAL);

  const next = () => setStep(Math.min(current + 1, TOTAL));
  const prev = () => setStep(Math.max(current - 1, 1));

  return (
    <>
      <Stepper current={current} total={TOTAL} onJump={setStep} />
      <div className="lb-container py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <p className="lb-eyebrow text-foreground/60 mb-3">
            {t("stepLabel", { current, total: TOTAL })}
          </p>
          {current === 1 ? (
            <Step1Address
              draft={draft}
              upsertField={upsertField}
              removeField={removeField}
              onNext={next}
            />
          ) : null}
          {current === 2 ? (
            <Step3Summary
              draft={draft}
              update={update}
              onNext={next}
              onPrev={prev}
            />
          ) : null}
          {current === 3 ? (
            <Step4Contact
              draft={draft}
              update={update}
              onPrev={prev}
              onReset={reset}
              prefillEmail={prefillEmail}
              prefillName={prefillName}
              prefillMunicipality={prefillMunicipality}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
