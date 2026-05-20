interface ConfidentialWatermarkProps {
  name: string;
  email: string;
  date: string;
}

/**
 * Discreet bottom-right watermark on /estimation/tool.
 *
 * Identity (name + email + access date) bound to the gate cookie. Pointer
 * events are disabled so the watermark never intercepts clicks. Print-safe
 * (uses neutral colors when rendered on paper).
 */
export function ConfidentialWatermark({
  name,
  email,
  date,
}: ConfidentialWatermarkProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-2 right-3 z-[9997] max-w-[60vw] select-none rounded border border-border/40 bg-background/55 px-2.5 py-1.5 text-right text-[10px] uppercase leading-tight tracking-[0.16em] text-foreground/40 backdrop-blur-md print:border-none print:bg-transparent print:text-foreground/60"
    >
      Confidentiel · {name} · {email} · {date}
    </div>
  );
}
