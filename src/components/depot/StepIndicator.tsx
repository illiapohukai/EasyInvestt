import { cn } from "@/lib/utils";

/** "Schritt 2 von 3" with a small progress bar. */
export function StepIndicator({
  step,
  total,
  label,
}: {
  step: number;
  total: number;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-primary">
        Schritt {step} von {total} · {label}
      </p>
      <div aria-hidden="true" className="flex gap-1.5">
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={cn("h-1.5 flex-1 rounded-full", index < step ? "bg-primary" : "bg-muted")}
          />
        ))}
      </div>
    </div>
  );
}
