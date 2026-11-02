import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, formatPriceTime, formatSignedPercent } from "@/lib/format";
import { STATUS_DESCRIPTIONS, getDisplayStatus } from "@/lib/market-data/status";
import type { Quote } from "@/lib/market-data/types";
import { QuoteStatusBadge } from "./QuoteStatusBadge";

/** Price with data status, timestamp and an optional manual refresh. */
export function QuoteSummary({
  quote,
  now,
  onRefresh,
  refreshing = false,
  label = "Kurs",
}: {
  quote: Quote;
  now: Date;
  onRefresh?: () => void;
  refreshing?: boolean;
  label?: string;
}) {
  const status = getDisplayStatus(quote, now);
  return (
    <div className="space-y-1.5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{formatPrice(quote.price, quote.currency)}</p>
      {quote.changePercent !== undefined ? (
        <p className="text-sm tabular-nums">
          {formatSignedPercent(quote.changePercent)} zum Vortag
          {quote.previousClose !== undefined ? (
            <span className="text-muted-foreground">
              {" "}
              (Vortag {formatPrice(quote.previousClose, quote.currency)})
            </span>
          ) : null}
        </p>
      ) : null}
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        <QuoteStatusBadge status={status} />
        <span>
          Stand {formatPriceTime(quote.asOf, quote.asOfPrecision)}
          {quote.exchange ? ` · ${quote.exchange}` : ""}
        </span>
      </p>
      <p className="text-sm text-muted-foreground">{STATUS_DESCRIPTIONS[status]}</p>
      {onRefresh ? (
        <Button variant="secondary" size="sm" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw aria-hidden="true" className={refreshing ? "animate-spin" : undefined} />
          Kurs aktualisieren
        </Button>
      ) : null}
    </div>
  );
}
