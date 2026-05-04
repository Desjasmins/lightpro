"use client";

import { useTranslations } from "next-intl";
import { useEstimationDraft } from "@/lib/estimation/store";
import { Stepper } from "./stepper";
import { Step1Project } from "./steps/step1-project";
import { Step2Address } from "./steps/step2-address";
import { Step3Fields } from "./steps/step3-fields";
import { Step4Poles } from "./steps/step4-poles";
import { Step5Configuration } from "./steps/step5-configuration";
import { Step6Summary } from "./steps/step6-summary";

const TOTAL = 6;

export function Wizard() {
  const t = useTranslations("Estimation");
  const { draft, hydrated, update, setStep, reset } = useEstimationDraft();

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
        <div className="max-w-3xl mx-auto">
          <p className="lb-eyebrow text-foreground/60 mb-3">
            {t("stepLabel", { current, total: TOTAL })}
          </p>
          {current === 1 ? (
            <Step1Project draft={draft} update={update} onNext={next} />
          ) : null}
          {current === 2 ? (
            <Step2Address
              draft={draft}
              update={update}
              onNext={next}
              onPrev={prev}
            />
          ) : null}
          {current === 3 ? (
            <Step3Fields
              draft={draft}
              update={update}
              onNext={next}
              onPrev={prev}
            />
          ) : null}
          {current === 4 ? (
            <Step4Poles
              draft={draft}
              update={update}
              onNext={next}
              onPrev={prev}
            />
          ) : null}
          {current === 5 ? (
            <Step5Configuration
              draft={draft}
              update={update}
              onNext={next}
              onPrev={prev}
            />
          ) : null}
          {current === 6 ? (
            <Step6Summary draft={draft} onPrev={prev} onReset={reset} />
          ) : null}
        </div>
      </div>
    </>
  );
}
