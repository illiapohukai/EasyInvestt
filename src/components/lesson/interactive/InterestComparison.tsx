import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Calculator } from "lucide-react";
import { RangeField } from "@/components/common/RangeField";
import { Button } from "@/components/ui/button";
import { compoundValue, simpleInterestValue } from "@/lib/finance/compound-interest";
import { formatEuro, formatPercent, formatYears, formatYearsDative } from "@/lib/format";

const PRINCIPAL = 100;
const STEP_YEARS = 3;

/** Compares paid-out interest with reinvested interest for a one-off 100 €. */
export function InterestComparison() {
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(5);

  const simple = simpleInterestValue(PRINCIPAL, rate, years);
  const compound = compoundValue(PRINCIPAL, rate, years);
  const max = Math.max(simple, compound, 1);
  const advantage = compound - simple;

  const steps = Array.from({ length: STEP_YEARS }, (_, index) => {
    const year = index + 1;
    const start = compoundValue(PRINCIPAL, rate, year - 1);
    const interest = start * (rate / 100);
    return { year, start, interest, end: start + interest };
  });

  const rows = [
    {
      label: "Zinsen werden ausgezahlt",
      sub: "ohne Zinseszins",
      value: simple,
      barClass: "bg-chart-contribution",
    },
    {
      label: "Zinsen bleiben angelegt",
      sub: "mit Zinseszins",
      value: compound,
      barClass: "bg-primary hatch",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <RangeField
          label="Zinssatz pro Jahr"
          value={rate}
          min={1}
          max={10}
          step={0.5}
          onChange={setRate}
          formatValue={formatPercent}
        />
        <RangeField
          label="Zeitraum"
          value={years}
          min={1}
          max={40}
          step={1}
          onChange={setYears}
          formatValue={formatYears}
        />
      </div>

      <div className="space-y-3 rounded-xl bg-muted p-4">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span>
                <span className="font-semibold">{row.label}</span>{" "}
                <span className="text-muted-foreground">({row.sub})</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                {formatEuro(row.value, { cents: true })}
              </span>
            </div>
            <div aria-hidden="true" className="mt-1 h-3 rounded-full bg-card">
              <div
                className={`h-3 rounded-full transition-[width] duration-300 ${row.barClass}`}
                style={{ width: `${(row.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p aria-live="polite" className="text-[0.9375rem]">
        Nach {formatYearsDative(years)} bringt der Zinseszins{" "}
        <strong className="tabular-nums">{formatEuro(advantage, { cents: true })}</strong> mehr –
        nur weil die Zinsen selbst wieder Zinsen bekommen.
      </p>

      <div>
        <h3 className="text-base font-semibold">Die ersten Jahre Schritt für Schritt</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-[0.8125rem] tabular-nums sm:text-sm">
            <caption className="sr-only">
              Entwicklung von {formatEuro(PRINCIPAL)} bei {formatPercent(rate)} mit Zinseszins
            </caption>
            <thead className="text-muted-foreground">
              <tr>
                <th scope="col" className="py-1.5 pr-2 font-medium">
                  Jahr
                </th>
                <th scope="col" className="py-1.5 pr-2 font-medium">
                  Start
                </th>
                <th scope="col" className="py-1.5 pr-2 font-medium">
                  + Zinsen
                </th>
                <th scope="col" className="py-1.5 font-medium">
                  Ende
                </th>
              </tr>
            </thead>
            <tbody>
              {steps.map((step) => (
                <tr key={step.year} className="border-t border-border">
                  <th scope="row" className="py-1.5 pr-2 font-medium">
                    {step.year}
                  </th>
                  <td className="py-1.5 pr-2">{formatEuro(step.start, { cents: true })}</td>
                  <td className="py-1.5 pr-2 text-primary">
                    {formatEuro(step.interest, { cents: true })}
                  </td>
                  <td className="py-1.5 font-semibold">{formatEuro(step.end, { cents: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Button asChild variant="soft" className="w-full sm:w-auto">
        <Link to="/rechner">
          <Calculator aria-hidden="true" />
          Mit eigenen Zahlen im Rechner ausprobieren
        </Link>
      </Button>
    </div>
  );
}
