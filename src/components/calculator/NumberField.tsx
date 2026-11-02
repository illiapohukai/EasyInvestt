import type { CSSProperties } from "react";
import { useEffect, useId, useRef, useState } from "react";
import {
  COMPOUND_LIMITS,
  validateCompoundField,
  type CompoundField,
} from "@/lib/finance/compound-interest";
import { formatNumber, parseLocaleNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface NumberFieldProps {
  field: CompoundField;
  label: string;
  /** Last valid value. */
  value: number;
  unit: string;
  hint?: string | undefined;
  formatValue: (value: number) => string;
  onChange: (value: number) => void;
  /** Reports whether the typed text is currently valid. */
  onValidityChange: (field: CompoundField, valid: boolean) => void;
  /** Increment to force the text to show `value` again (e.g. after presets or reset). */
  revision?: number;
}

/**
 * Text input (for exact values, German number format) combined with a slider
 * (for quick exploration). Invalid text is kept visible with an explanation,
 * while the calculation keeps using the last valid value.
 */
export function NumberField({
  field,
  label,
  value,
  unit,
  hint,
  formatValue,
  onChange,
  onValidityChange,
  revision = 0,
}: NumberFieldProps) {
  const limits = COMPOUND_LIMITS[field];
  const id = useId();
  const inputId = `${id}-input`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const [draft, setDraft] = useState(() => formatNumber(value));
  const [error, setError] = useState<string | null>(null);
  const lastEmitted = useRef(value);
  const lastRevision = useRef(revision);

  // Sync the text when the value changes from outside (presets, reset, stored values).
  useEffect(() => {
    if (value !== lastEmitted.current || revision !== lastRevision.current) {
      lastEmitted.current = value;
      lastRevision.current = revision;
      setDraft(formatNumber(value));
      setError(null);
      onValidityChange(field, true);
    }
  }, [value, revision, field, onValidityChange]);

  function emit(next: number) {
    lastEmitted.current = next;
    onChange(next);
  }

  function handleText(text: string) {
    setDraft(text);
    const parsed = parseLocaleNumber(text);
    const message =
      text.trim() === ""
        ? "Bitte gib einen Wert ein."
        : parsed === null
          ? "Bitte gib eine Zahl ein, z. B. 1.500 oder 2,5."
          : validateCompoundField(field, parsed);
    setError(message);
    onValidityChange(field, message === null);
    if (message === null && parsed !== null) emit(parsed);
  }

  function handleBlur() {
    if (error === null) setDraft(formatNumber(value));
  }

  function handleSlider(next: number) {
    setDraft(formatNumber(next));
    setError(null);
    onValidityChange(field, true);
    emit(next);
  }

  const sliderValue = Math.min(limits.sliderMax, Math.max(limits.min, value));
  const progress = ((sliderValue - limits.min) / (limits.sliderMax - limits.min)) * 100;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div>
      <label htmlFor={inputId} className="font-semibold">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={inputId}
          type="text"
          inputMode={limits.integer ? "numeric" : "decimal"}
          autoComplete="off"
          enterKeyHint="done"
          value={draft}
          onChange={(event) => handleText(event.target.value)}
          onBlur={handleBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={cn(
            "h-12 w-full rounded-lg border bg-card pr-16 pl-3.5 text-lg font-semibold tabular-nums",
            error ? "border-destructive" : "border-input",
          )}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground"
        >
          {unit}
        </span>
      </div>
      {error ? (
        <p id={errorId} className="mt-1 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      <input
        type="range"
        min={limits.min}
        max={limits.sliderMax}
        step={limits.step}
        value={sliderValue}
        onChange={(event) => handleSlider(Number(event.target.value))}
        aria-label={`${label} – Schieberegler`}
        aria-valuetext={formatValue(sliderValue)}
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
