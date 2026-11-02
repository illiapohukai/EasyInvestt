import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Callout } from "@/components/common/Callout";
import { Disclaimer } from "@/components/common/Disclaimer";
import { Button } from "@/components/ui/button";
import {
  calculateCompoundGrowth,
  COMPOUND_LIMITS,
  DEFAULT_COMPOUND_INPUT,
  OPTIMISTIC_RETURN_PERCENT,
  type CompoundField,
  type CompoundInput,
} from "@/lib/finance/compound-interest";
import { describeResult } from "@/lib/finance/describe-result";
import {
  formatEuro,
  formatNumber,
  formatPercent,
  formatYears,
  formatYearsDative,
} from "@/lib/format";
import { progressStore } from "@/lib/progress/store";
import { cn } from "@/lib/utils";
import { ContributionSplit } from "./ContributionSplit";
import { GrowthChart } from "./GrowthChart";
import { NumberField } from "./NumberField";

const RATE_PRESETS = [0, 2, 5, 7];

const FIELDS: {
  field: CompoundField;
  label: string;
  unit: string;
  hint?: string;
  format: (value: number) => string;
}[] = [
  {
    field: "initialAmount",
    label: "Startbetrag",
    unit: "€",
    hint: "Einmalig zu Beginn, z. B. Erspartes. 0 € ist auch okay.",
    format: (value) => formatEuro(value),
  },
  {
    field: "monthlyContribution",
    label: "Monatliche Sparrate",
    unit: "€",
    hint: "Wird jeweils am Monatsanfang eingezahlt.",
    format: (value) => formatEuro(value),
  },
  {
    field: "annualReturnPercent",
    label: "Rendite pro Jahr",
    unit: "%",
    hint: "Angenommener Durchschnitt – in echt schwankt die Rendite.",
    format: formatPercent,
  },
  {
    field: "years",
    label: "Anlagedauer",
    unit: "Jahre",
    format: formatYears,
  },
];

function sameInput(a: CompoundInput, b: CompoundInput) {
  return (
    a.initialAmount === b.initialAmount &&
    a.monthlyContribution === b.monthlyContribution &&
    a.annualReturnPercent === b.annualReturnPercent &&
    a.years === b.years
  );
}

export function CompoundCalculator({ initial }: { initial: CompoundInput }) {
  const [input, setInput] = useState<CompoundInput>(initial);
  const [invalid, setInvalid] = useState<Partial<Record<CompoundField, boolean>>>({});
  const [revision, setRevision] = useState(0);
  const savedInput = useRef(initial);

  const result = calculateCompoundGrowth(input);
  const hasInvalid = Object.values(invalid).some(Boolean);

  // Persist changed values so the calculator reopens with them.
  useEffect(() => {
    if (sameInput(input, savedInput.current)) return;
    savedInput.current = input;
    progressStore.saveCalculator(input);
  }, [input]);

  const handleValidity = useCallback((field: CompoundField, valid: boolean) => {
    setInvalid((current) =>
      current[field] === !valid ? current : { ...current, [field]: !valid },
    );
  }, []);

  function setField(field: CompoundField, value: number) {
    setInput((current) => ({ ...current, [field]: value }));
  }

  function applyRate(rate: number) {
    setField("annualReturnPercent", rate);
    setRevision((value) => value + 1);
  }

  function resetValues() {
    setInput(DEFAULT_COMPOUND_INPUT);
    setRevision((value) => value + 1);
  }

  const nothingToGrow = input.initialAmount === 0 && input.monthlyContribution === 0;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
      <section aria-labelledby="eingaben-titel" className="surface space-y-5 p-5">
        <h2 id="eingaben-titel" className="text-lg font-bold">
          Deine Annahmen
        </h2>
        {FIELDS.map((config) => (
          <div key={config.field} className="space-y-2">
            <NumberField
              field={config.field}
              label={config.label}
              unit={config.field === "years" && input.years === 1 ? "Jahr" : config.unit}
              hint={config.hint}
              value={input[config.field]}
              formatValue={config.format}
              onChange={(value) => setField(config.field, value)}
              onValidityChange={handleValidity}
              revision={revision}
            />
            {config.field === "annualReturnPercent" ? (
              <div
                role="group"
                aria-label="Rendite schnell wählen"
                className="flex flex-wrap gap-2"
              >
                {RATE_PRESETS.map((rate) => {
                  const active = input.annualReturnPercent === rate;
                  return (
                    <button
                      key={rate}
                      type="button"
                      aria-pressed={active}
                      onClick={() => applyRate(rate)}
                      className={cn(
                        "min-h-11 min-w-14 rounded-full border px-3.5 text-sm font-semibold tabular-nums transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-card hover:bg-muted",
                      )}
                    >
                      {formatPercent(rate)}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ))}
        {input.annualReturnPercent > OPTIMISTIC_RETURN_PERCENT ? (
          <Callout tone="warning" title="Sehr optimistisch">
            Mehr als {formatPercent(OPTIMISTIC_RETURN_PERCENT)} pro Jahr über viele Jahre ist
            selten. Auch breit gestreute Aktienanlagen hatten schwache Phasen – rechne lieber
            zusätzlich mit einem vorsichtigeren Wert.
          </Callout>
        ) : null}
        <Button variant="secondary" size="sm" onClick={resetValues}>
          <RotateCcw aria-hidden="true" />
          Standardwerte
        </Button>
      </section>

      <section aria-labelledby="ergebnis-titel" className="space-y-5">
        <div className="surface space-y-5 p-5">
          <div>
            <h2 id="ergebnis-titel" className="text-sm font-semibold text-muted-foreground">
              Ergebnis nach {formatYearsDative(input.years)}
            </h2>
            <p className="mt-1 text-[clamp(1.75rem,8vw,2.25rem)] leading-tight font-bold [overflow-wrap:anywhere] tabular-nums">
              {formatEuro(result.finalValue)}
            </p>
          </div>

          {hasInvalid ? (
            <Callout tone="warning">
              Bitte prüfe die markierten Eingaben. Das Ergebnis zeigt solange die letzten gültigen
              Werte.
            </Callout>
          ) : null}

          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted p-3">
              <dt className="text-sm text-muted-foreground">Selbst eingezahlt</dt>
              <dd className="text-lg font-bold tabular-nums">
                {formatEuro(result.totalContributions)}
              </dd>
            </div>
            <div className="rounded-lg bg-primary-soft p-3">
              <dt className="text-sm text-muted-foreground">Zinsen und Erträge</dt>
              <dd className="text-lg font-bold text-primary-strong tabular-nums">
                {formatEuro(result.growth)}
              </dd>
            </div>
          </dl>

          {!nothingToGrow ? (
            <ContributionSplit contributions={result.totalContributions} growth={result.growth} />
          ) : null}

          <p aria-live="polite" className="text-[0.9375rem]">
            {describeResult(result)}
          </p>
        </div>

        {!nothingToGrow && input.years > 0 ? (
          <div className="surface space-y-3 p-5">
            <h2 className="text-lg font-bold">So wächst dein Geld</h2>
            <GrowthChart points={result.points} />
          </div>
        ) : null}

        <div className="surface space-y-3 p-5">
          <h2 className="text-lg font-bold">So rechnet der Rechner</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-[0.9375rem] text-foreground/90">
            <li>Die Sparrate wird jeweils am Anfang des Monats eingezahlt.</li>
            <li>
              Die Jahresrendite wird in einen gleichwertigen Monatszins umgerechnet: 100 € werden
              bei 5 % nach einem Jahr zu 105 €.
            </li>
            <li>
              Die Rendite ist jedes Jahr gleich. In der Realität schwanken Kurse – es kann auch
              Verluste geben.
            </li>
            <li>Steuern, Kosten, Gebühren und Inflation sind nicht berücksichtigt.</li>
            <li>Beträge sind auf ganze Euro gerundet.</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Erlaubte Werte: Startbetrag bis {formatEuro(COMPOUND_LIMITS.initialAmount.max)},
            Sparrate bis {formatEuro(COMPOUND_LIMITS.monthlyContribution.max)} im Monat, Rendite{" "}
            {formatNumber(COMPOUND_LIMITS.annualReturnPercent.min)} bis{" "}
            {formatPercent(COMPOUND_LIMITS.annualReturnPercent.max)}, Dauer{" "}
            {formatNumber(COMPOUND_LIMITS.years.min)} bis {formatYears(COMPOUND_LIMITS.years.max)}.
          </p>
        </div>

        <Disclaimer extra="Die Ergebnisse sind Beispielrechnungen und keine Prognose." />
      </section>
    </div>
  );
}
