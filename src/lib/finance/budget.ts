export interface BudgetRow {
  id: string;
  label: string;
  amount: number;
}

export interface BudgetSummary {
  income: number;
  expenses: number;
  /** Income minus expenses. Negative means more is spent than earned. */
  balance: number;
}

/** Sums all rows; empty, negative or invalid amounts count as zero. */
export function sumBudgetRows(rows: readonly BudgetRow[]): number {
  return rows.reduce(
    (sum, row) => sum + (Number.isFinite(row.amount) && row.amount > 0 ? row.amount : 0),
    0,
  );
}

export function summarizeBudget(
  income: readonly BudgetRow[],
  expenses: readonly BudgetRow[],
): BudgetSummary {
  const totalIncome = sumBudgetRows(income);
  const totalExpenses = sumBudgetRows(expenses);
  return { income: totalIncome, expenses: totalExpenses, balance: totalIncome - totalExpenses };
}
