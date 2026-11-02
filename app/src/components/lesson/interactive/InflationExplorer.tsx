import { useState } from "react";
import { RangeField } from "@/components/common/RangeField";
import { purchasingPower } from "@/lib/finance/inflation";
import { formatEuro, formatPercent, formatYears, formatYearsDative } from "@/lib/format";

const AMOUNT = 100;

/** Shows how inflation reduces what 100 € can buy. */
export function InflationExplorer() {
  const [years, setYears] = useState(10);
  const [inflation, setInflation] = useState(2);

  const worth = purchasingPower(AMOUNT, inflation, years);
  const futurePrice = AMOUNT * Math.pow(1 + inflation / 100, years);
  const share = Math.max(0, Math.min(100, (worth / AMOUNT) * 100));

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <RangeField
          label="Inflation pro Jahr"
          value={inflation}
          min={0.5}
          max={8}
          step={0.5}
          onChange={setInflation}
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
        <div>
          <div className="flex justify-between gap-3 text-sm">
            <span>Heute</span>
            <span className="font-semibold tabular-nums">{formatEuro(AMOUNT)}</span>
          </div>
          <div aria-hidden="true" className="mt-1 h-3 rounded-full bg-chart-contribution" />
        </div>
        <div>
          <div className="flex justify-between gap-3 text-sm">
            <span>In {formatYearsDative(years)} (in heutiger Kaufkraft)</span>
            <span className="font-semibold tabular-nums">{formatEuro(worth)}</span>
          </div>
          <div aria-hidden="true" className="mt-1 h-3 rounded-full bg-card">
            <div
              className="h-3 rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${share}%` }}
            />
          </div>
        </div>
      </div>

      <p aria-live="polite" className="text-[0.9375rem]">
        Bei {formatPercent(inflation)} Inflation kannst du dir mit {formatEuro(AMOUNT)} in{" "}
        {formatYearsDative(years)} nur noch so viel kaufen wie heute mit{" "}
        <strong className="tabular-nums">{formatEuro(worth)}</strong>. Was heute{" "}
        {formatEuro(AMOUNT)} kostet, kostet dann etwa{" "}
        <strong className="tabular-nums">{formatEuro(futurePrice)}</strong>.
      </p>
      <p className="text-sm text-muted-foreground">
        Vereinfachte Rechnung mit gleichbleibender Inflation. In Wirklichkeit schwankt sie von Jahr
        zu Jahr.
      </p>
    </div>
  );
}
