import { useState } from "react";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { useDepot } from "@/hooks/use-depot";
import { useHydrated } from "@/hooks/use-hydrated";
import { transactionsToCsv } from "@/lib/depot/csv";
import type { PortfolioRecord } from "@/lib/depot/types";
import { DepotDisclaimer } from "./DepotNotices";
import { DepotSkeleton } from "./DepotSkeleton";
import { BackLink, NoPortfolioNotice } from "./OrderCommon";
import { TransactionList } from "./TransactionList";

function downloadCsv(portfolio: PortfolioRecord): boolean {
  try {
    const blob = new Blob([transactionsToCsv(portfolio.transactions)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `geldstart-uebungsdepot-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

export function TransactionsPage() {
  const hydrated = useHydrated();
  const { state } = useDepot();
  const [message, setMessage] = useState("");
  if (!hydrated) return <DepotSkeleton />;
  const portfolio = state.portfolio;
  if (!portfolio) return <NoPortfolioNotice />;
  const transactions = [...portfolio.transactions].reverse();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <BackLink to="/depot">Zum Depot</BackLink>
      <PageHeader
        eyebrow="Übungsdepot · Simulation"
        title="Transaktionen"
        description="Alle virtuellen Käufe und Verkäufe, neueste zuerst. Keine davon ist eine echte Order."
      />
      <section aria-labelledby="alle-transaktionen-titel" className="surface space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="alle-transaktionen-titel" className="text-lg font-bold">
            {transactions.length === 1 ? "1 Transaktion" : `${transactions.length} Transaktionen`}
          </h2>
          {transactions.length > 0 ? (
            <Button
              variant="secondary"
              onClick={() =>
                setMessage(
                  downloadCsv(portfolio)
                    ? "CSV-Datei wurde erstellt."
                    : "Die CSV-Datei konnte in diesem Browser nicht erstellt werden.",
                )
              }
            >
              <Download aria-hidden="true" />
              Als CSV exportieren
            </Button>
          ) : null}
        </div>
        <p role="status" className="text-sm font-medium text-primary-strong empty:hidden">
          {message}
        </p>
        <TransactionList transactions={transactions} />
        {transactions.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Die CSV-Datei enthält eine Spalte „Simulation“ sowie Stand und Datenstatus jedes Kurses.
            Sie wird nur auf deinem Gerät erzeugt.
          </p>
        ) : null}
      </section>
      <DepotDisclaimer />
    </div>
  );
}
