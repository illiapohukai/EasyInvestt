import { useId, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Calculator, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Callout } from "@/components/common/Callout";
import { RangeField } from "@/components/common/RangeField";
import { Button } from "@/components/ui/button";
import { summarizeBudget, type BudgetRow } from "@/lib/finance/budget";
import { DEFAULT_COMPOUND_INPUT } from "@/lib/finance/compound-interest";
import { formatEuro, parseLocaleNumber } from "@/lib/format";
import { progressStore } from "@/lib/progress/store";
import { cn } from "@/lib/utils";

interface DraftRow {
  id: string;
  label: string;
  /** Raw text as typed, so "12,5" can be entered naturally. */
  amountText: string;
}

const MAX_ROWS = 8;
const MAX_AMOUNT = 100_000;

const EXAMPLE_INCOME: DraftRow[] = [
  { id: "e1", label: "Taschengeld", amountText: "60" },
  { id: "e2", label: "Minijob", amountText: "180" },
];

const EXAMPLE_EXPENSES: DraftRow[] = [
  { id: "a1", label: "Handyvertrag", amountText: "15" },
  { id: "a2", label: "Freizeit und Ausgehen", amountText: "70" },
  { id: "a3", label: "Essen unterwegs", amountText: "40" },
  { id: "a4", label: "Kleidung", amountText: "30" },
  { id: "a5", label: "Streaming und Apps", amountText: "10" },
];

function parseAmount(text: string): { amount: number; error: string | null } {
  if (text.trim() === "") return { amount: 0, error: null };
  const value = parseLocaleNumber(text);
  if (value === null) return { amount: 0, error: "Bitte gib eine Zahl ein, z. B. 12,50." };
  if (value < 0) return { amount: 0, error: "Bitte gib einen Betrag ohne Minus ein." };
  if (value > MAX_AMOUNT) return { amount: 0, error: `Höchstens ${formatEuro(MAX_AMOUNT)}.` };
  return { amount: value, error: null };
}

function toBudgetRows(rows: DraftRow[]): BudgetRow[] {
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    amount: parseAmount(row.amountText).amount,
  }));
}

interface RowGroupProps {
  title: string;
  kind: "Einnahme" | "Ausgabe";
  rows: DraftRow[];
  total: number;
  onChange: (rows: DraftRow[]) => void;
  onAdd: () => void;
}

function RowGroup({ title, kind, rows, total, onChange, onAdd }: RowGroupProps) {
  const groupId = useId();

  function update(id: string, patch: Partial<DraftRow>) {
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  return (
    <fieldset className="min-w-0 space-y-2">
      <legend className="flex w-full items-baseline justify-between gap-3 pb-1">
        <span className="font-semibold">{title}</span>
        <span className="text-sm font-semibold tabular-nums">
          {formatEuro(total, { cents: true })}
        </span>
      </legend>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {kind === "Einnahme"
            ? "Noch keine Einnahmen eingetragen."
            : "Noch keine Ausgaben eingetragen."}
        </p>
      ) : null}
      <ul className="space-y-2">
        {rows.map((row, index) => {
          const { error } = parseAmount(row.amountText);
          const name = row.label.trim() || `${kind} ${index + 1}`;
          const errorId = `${groupId}-${row.id}-error`;
          return (
            <li key={row.id}>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={row.label}
                  onChange={(event) => update(row.id, { label: event.target.value })}
                  aria-label={`Bezeichnung ${kind} ${index + 1}`}
                  placeholder={kind === "Einnahme" ? "z. B. Taschengeld" : "z. B. Handy"}
                  maxLength={40}
                  autoComplete="off"
                  className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-card px-3 text-base"
                />
                <div className="relative w-[5.5rem] shrink-0">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={row.amountText}
                    onChange={(event) => update(row.id, { amountText: event.target.value })}
                    aria-label={`Betrag in Euro für ${name}`}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    placeholder="0"
                    autoComplete="off"
                    className={cn(
                      "h-11 w-full rounded-lg border bg-card pr-7 pl-3 text-right text-base tabular-nums",
                      error ? "border-destructive" : "border-input",
                    )}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground"
                  >
                    €
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onChange(rows.filter((item) => item.id !== row.id))}
                  aria-label={`${name} entfernen`}
                  className="shrink-0 text-muted-foreground"
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
              {error ? (
                <p id={errorId} className="mt-1 text-sm text-destructive">
                  {error}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      <Button
        variant="ghost"
        size="sm"
        onClick={onAdd}
        disabled={rows.length >= MAX_ROWS}
        className="-ml-2 text-primary"
      >
        <Plus aria-hidden="true" />
        {kind} hinzufügen
      </Button>
    </fieldset>
  );
}

/** Monthly budget planner. Values live only in component state and are not stored. */
export function BudgetPlanner() {
  const navigate = useNavigate();
  const nextId = useRef(1);
  const [income, setIncome] = useState<DraftRow[]>(EXAMPLE_INCOME);
  const [expenses, setExpenses] = useState<DraftRow[]>(EXAMPLE_EXPENSES);
  const [savings, setSavings] = useState(25);

  const summary = summarizeBudget(toBudgetRows(income), toBudgetRows(expenses));
  const maxSavings = Math.max(0, Math.floor(summary.balance));
  const effectiveSavings = Math.min(savings, maxSavings);

  function newRow(prefix: string): DraftRow {
    nextId.current += 1;
    return { id: `${prefix}-neu-${nextId.current}`, label: "", amountText: "" };
  }

  function restoreExample() {
    setIncome(EXAMPLE_INCOME);
    setExpenses(EXAMPLE_EXPENSES);
    setSavings(25);
  }

  function openCalculator() {
    const current = progressStore.getSnapshot().calculator ?? DEFAULT_COMPOUND_INPUT;
    progressStore.saveCalculator({ ...current, monthlyContribution: effectiveSavings });
    void navigate({ to: "/rechner" });
  }

  let balanceMessage: { tone: "success" | "warning" | "info"; text: string };
  if (summary.balance > 0) {
    balanceMessage = {
      tone: "success",
      text: `Dir bleiben ${formatEuro(summary.balance, { cents: true })} im Monat. Einen Teil davon kannst du fest zur Seite legen.`,
    };
  } else if (summary.balance < 0) {
    balanceMessage = {
      tone: "warning",
      text: `Du gibst ${formatEuro(-summary.balance, { cents: true })} mehr aus, als du einnimmst. Schau, wo du etwas kürzen kannst, bevor du ans Sparen denkst.`,
    };
  } else {
    balanceMessage = {
      tone: "info",
      text: "Einnahmen und Ausgaben sind gleich hoch – es bleibt nichts übrig. Schon kleine Kürzungen schaffen Spielraum.",
    };
  }

  return (
    <div className="space-y-5">
      <RowGroup
        title="Einnahmen pro Monat"
        kind="Einnahme"
        rows={income}
        total={summary.income}
        onChange={setIncome}
        onAdd={() => setIncome((rows) => [...rows, newRow("e")])}
      />
      <RowGroup
        title="Ausgaben pro Monat"
        kind="Ausgabe"
        rows={expenses}
        total={summary.expenses}
        onChange={setExpenses}
        onAdd={() => setExpenses((rows) => [...rows, newRow("a")])}
      />

      <div className="rounded-xl bg-muted p-4">
        <dl className="space-y-1.5 tabular-nums">
          <div className="flex justify-between gap-3">
            <dt>Einnahmen</dt>
            <dd>{formatEuro(summary.income, { cents: true })}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Ausgaben</dt>
            <dd>− {formatEuro(summary.expenses, { cents: true })}</dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-dashed border-input pt-1.5 text-lg font-bold">
            <dt>Übrig</dt>
            <dd className={summary.balance < 0 ? "text-destructive" : undefined}>
              {formatEuro(summary.balance, { cents: true })}
            </dd>
          </div>
        </dl>
      </div>

      <div aria-live="polite">
        <Callout tone={balanceMessage.tone}>{balanceMessage.text}</Callout>
      </div>

      {maxSavings > 0 ? (
        <div className="space-y-3">
          <RangeField
            label="Davon sparen pro Monat"
            value={effectiveSavings}
            min={0}
            max={maxSavings}
            step={1}
            onChange={setSavings}
            formatValue={(value) => formatEuro(value)}
          />
          <p className="text-[0.9375rem]">
            Mit {formatEuro(effectiveSavings)} im Monat kommen in einem Jahr{" "}
            <strong className="tabular-nums">{formatEuro(effectiveSavings * 12)}</strong> zusammen –
            noch ganz ohne Zinsen. In fünf Jahren sind es {formatEuro(effectiveSavings * 60)}.
          </p>
          <Button onClick={openCalculator} className="w-full sm:w-auto">
            <Calculator aria-hidden="true" />
            Im Rechner ausprobieren
          </Button>
        </div>
      ) : null}

      <Button variant="secondary" size="sm" onClick={restoreExample}>
        <RotateCcw aria-hidden="true" />
        Beispiel wiederherstellen
      </Button>
    </div>
  );
}
