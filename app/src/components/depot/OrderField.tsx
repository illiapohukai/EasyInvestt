import { useId } from "react";
import { cn } from "@/lib/utils";

/** Large text input for amounts and quantities (German number format). */
export function OrderField({
  label,
  value,
  onChange,
  hint,
  error,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint: string;
  error: string | null;
  suffix: string;
}) {
  const id = useId();
  const hintId = useId();
  const errorId = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block font-semibold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${errorId} ${hintId}` : hintId}
          className={cn(
            "min-h-14 w-full rounded-lg border bg-card pr-16 pl-3 text-xl font-semibold tabular-nums",
            error ? "border-destructive" : "border-input",
          )}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-base font-semibold text-muted-foreground"
        >
          {suffix}
        </span>
      </div>
      {error ? (
        <p id={errorId} className="text-[0.9375rem] font-medium text-destructive">
          {error}
        </p>
      ) : null}
      <p id={hintId} className="text-sm text-muted-foreground">
        {hint}
      </p>
    </div>
  );
}
