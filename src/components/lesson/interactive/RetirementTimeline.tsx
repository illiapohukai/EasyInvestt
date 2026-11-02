import { useState } from "react";
import { RangeField } from "@/components/common/RangeField";
import { calculateCompoundGrowth } from "@/lib/finance/compound-interest";
import { formatEuro, formatPercent, formatYears } from "@/lib/format";

/** Regular retirement age for people born 1964 or later (status 2026). */
const RETIREMENT_AGE = 67;
const SCENARIOS = [2, 4, 6];
const DELAY_YEARS = 10;
const DELAY_RATE = 4;

function finalValue(monthly: number, rate: number, years: number) {
  return calculateCompoundGrowth({
    initialAmount: 0,
    monthlyContribution: monthly,
    annualReturnPercent: rate,
    years,
  }).finalValue;
}

/** Time until retirement and how different returns change a monthly savings plan. */
export function RetirementTimeline() {
  const [age, setAge] = useState(17);
  const [monthly, setMonthly] = useState(25);

  const years = Math.max(0, RETIREMENT_AGE - age);
  const paidIn = monthly * 12 * years;
  const results = SCENARIOS.map((rate) => ({ rate, value: finalValue(monthly, rate, years) }));
  const maxValue = Math.max(paidIn, ...results.map((result) => result.value), 1);
  const lateYears = Math.max(0, years - DELAY_YEARS);
  const early = finalValue(monthly, DELAY_RATE, years);
  const late = finalValue(monthly, DELAY_RATE, lateYears);
  const startShare = ((age - 14) / (RETIREMENT_AGE - 14)) * 100;

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <RangeField
          label="Dein Alter"
          value={age}
          min={14}
          max={30}
          step={1}
          onChange={setAge}
          formatValue={(value) => `${value} Jahre`}
        />
        <RangeField
          label="Beispielbetrag pro Monat"
          value={monthly}
          min={5}
          max={200}
          step={5}
          onChange={setMonthly}
          formatValue={(value) => formatEuro(value)}
        />
      </div>

      <div className="rounded-xl bg-muted p-4">
        <p className="font-semibold">
          Bis {RETIREMENT_AGE} bleiben dir{" "}
          <span className="tabular-nums">{formatYears(years)}</span>.
        </p>
        <div aria-hidden="true" className="relative mt-3 h-3 rounded-full bg-card">
          <div
            className="absolute inset-y-0 right-0 rounded-full bg-primary"
            style={{ left: `${startShare}%` }}
          />
        </div>
        <div aria-hidden="true" className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>14</span>
          <span>{RETIREMENT_AGE}</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {RETIREMENT_AGE} ist die Regelaltersgrenze für alle ab Jahrgang 1964. Für spätere
          Jahrgänge kann sie sich noch ändern.
        </p>
      </div>

      <div>
        <h3 className="text-base font-semibold">
          {formatEuro(monthly)} im Monat bis {RETIREMENT_AGE} – drei Annahmen
        </h3>
        <ul className="mt-2 space-y-2.5">
          <li>
            <div className="flex justify-between gap-3 text-sm">
              <span>Selbst eingezahlt</span>
              <span className="font-semibold tabular-nums">{formatEuro(paidIn)}</span>
            </div>
            <div aria-hidden="true" className="mt-1 h-3 rounded-full bg-card">
              <div
                className="h-3 rounded-full bg-chart-contribution"
                style={{ width: `${(paidIn / maxValue) * 100}%` }}
              />
            </div>
          </li>
          {results.map((result) => (
            <li key={result.rate}>
              <div className="flex justify-between gap-3 text-sm">
                <span>Mit {formatPercent(result.rate)} Rendite pro Jahr</span>
                <span className="font-semibold tabular-nums">{formatEuro(result.value)}</span>
              </div>
              <div aria-hidden="true" className="mt-1 h-3 rounded-full bg-card">
                <div
                  className="hatch h-3 rounded-full bg-primary"
                  style={{ width: `${(result.value / maxValue) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p aria-live="polite" className="text-[0.9375rem]">
        Fängst du {formatYears(DELAY_YEARS)} später an, kommen bei {formatPercent(DELAY_RATE)} nur
        etwa <strong className="tabular-nums">{formatEuro(late)}</strong> statt{" "}
        <strong className="tabular-nums">{formatEuro(early)}</strong> zusammen.
      </p>
      <p className="text-sm text-muted-foreground">
        Beispielrechnung ohne Steuern, Kosten und Inflation. Eine Rendite ist nie garantiert – es
        kann auch weniger werden.
      </p>
    </div>
  );
}
