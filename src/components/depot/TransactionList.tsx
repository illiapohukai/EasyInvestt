import { ArrowDownToLine, Plus, StickyNote } from "lucide-react";
import { formatCents, formatDateTime, formatPrice, formatShares } from "@/lib/format";
import type { TransactionRecord } from "@/lib/depot/types";
import { GainLoss } from "./GainLoss";

export function TransactionList({ transactions }: { transactions: readonly TransactionRecord[] }) {
  if (transactions.length === 0) {
    return (
      <p className="text-[0.9375rem] text-muted-foreground">
        Noch keine virtuellen Käufe oder Verkäufe.
      </p>
    );
  }
  return (
    <ol className="divide-y divide-border">
      {transactions.map((t) => {
        const buy = t.type === "buy";
        const Icon = buy ? Plus : ArrowDownToLine;
        return (
          <li key={t.id} className="flex gap-3 py-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="font-semibold break-words">
                  {buy ? "Virtueller Kauf" : "Virtueller Verkauf"} · {t.name}
                </p>
                <p className="font-semibold tabular-nums">
                  {buy ? "−" : "+"}
                  {formatCents(t.amountCents)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground tabular-nums">
                {formatShares(t.units)} Stück × {formatPrice(t.price)} · {formatDateTime(t.at)}
              </p>
              {!buy ? (
                <p className="flex flex-wrap items-center gap-x-1.5 text-sm">
                  Realisiert: <GainLoss cents={t.realizedCents} size="sm" />
                </p>
              ) : null}
              {t.note ? (
                <p className="flex gap-1.5 text-sm text-muted-foreground">
                  <StickyNote aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <span>
                    <span className="sr-only">Deine Notiz: </span>
                    {t.note}
                  </span>
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
