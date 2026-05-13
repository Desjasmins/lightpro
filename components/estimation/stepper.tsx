"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepperProps {
  current: number;
  total: number;
  onJump?: (step: number) => void;
}

const stepKeys = ["terrains", "summary", "contact"] as const;

export function Stepper({ current, total, onJump }: StepperProps) {
  const t = useTranslations("Estimation");

  return (
    <div className="border-b border-border bg-card/40">
      <ol className="lb-container flex items-center gap-2 overflow-x-auto py-5 text-xs">
        {stepKeys.slice(0, total).map((key, i) => {
          const n = i + 1;
          const status =
            n < current ? "done" : n === current ? "active" : "todo";
          return (
            <li key={key} className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => status !== "todo" && onJump?.(n)}
                disabled={status === "todo"}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 transition border cursor-pointer",
                  status === "active" &&
                    "bg-foreground text-background border-foreground",
                  status === "done" &&
                    "bg-transparent text-foreground border-foreground/40 hover:border-foreground",
                  status === "todo" &&
                    "bg-transparent text-foreground/40 border-border cursor-not-allowed",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
                    status === "active" &&
                      "bg-background text-foreground border-background",
                    status === "done" &&
                      "bg-foreground text-background border-foreground",
                    status === "todo" && "border-border",
                  )}
                >
                  {status === "done" ? <Check size={11} /> : n}
                </span>
                <span className="tracking-tight font-medium uppercase">
                  {t(`steps.${key}`)}
                </span>
              </button>
              {i < total - 1 ? (
                <span className="h-px w-6 bg-border" aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
