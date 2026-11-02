import type { CSSProperties } from "react";
import { useId } from "react";

interface RangeFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue: (value: number) => string;
  hint?: string;
}

/** Labelled native range input with the current value shown next to the label. */
export function RangeField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue,
  hint,
}: RangeFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const clamped = Math.min(max, Math.max(min, value));
  const progress = max > min ? ((clamped - min) / (max - min)) * 100 : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        <output htmlFor={id} className="shrink-0 font-semibold tabular-nums">
          {formatValue(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={clamped}
        aria-valuetext={formatValue(value)}
        aria-describedby={hint ? hintId : undefined}
        onChange={(event) => onChange(Number(event.target.value))}
        className="range-input"
        style={{ "--range-progress": `${progress}%` } as CSSProperties}
      />
      {hint ? (
        <p id={hintId} className="-mt-1 text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
