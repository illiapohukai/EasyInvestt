import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import {
  formatCents,
  formatPercent,
  formatPrice,
  formatPriceTime,
  formatShares,
} from "@/lib/format";
import { ASSET_TYPE_LABELS } from "@/lib/depot/analysis";
import type { PositionValuation } from "@/lib/depot/engine";
import { getDisplayStatus } from "@/lib/market-data/status";
import { GainLoss } from "./GainLoss";
import { QuoteStatusBadge } from "./QuoteStatusBadge";

/** One holding as a mobile card. The whole card opens the detail screen. */
export function PositionCard({ item, now }: { item: PositionValuation; now: Date }) {
  const { position, quote } = item;
  const { instrument } = position;
  const status = item.priceSource === "quote" ? getDisplayStatus(quote, now) : "unavailable";
  const priceTime = quote
    ? formatPriceTime(quote.asOf, quote.asOfPrecision)
    : formatPriceTime(position.lastTradeAt, "minute");

  return (
    <Link
      to="/depot/wertpapier"
      search={{ id: instrument.id }}
      className="surface group block p-4 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold leading-snug break-words">{instrument.name}</p>
          <p className="text-sm text-muted-foreground">
            {instrument.symbol} · {ASSET_TYPE_LABELS[instrument.type]}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-bold tabular-nums">{formatCents(item.valueCents)}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {formatPercent(Math.round(item.weightPercent))} vom Depot
          </p>
        </div>
      </div>

      <div className="mt-2">
        <GainLoss cents={item.unrealizedCents} percent={item.unrealizedPercent} size="sm" />
        <span className="sr-only"> seit Kauf, noch nicht realisiert</span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-border pt-3 text-sm min-[380px]:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Stück</dt>
          <dd className="font-semibold tabular-nums">{formatShares(position.units)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Ø Kaufkurs</dt>
          <dd className="font-semibold tabular-nums">{formatPrice(item.averagePrice)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {item.priceSource === "quote" ? "Kurs" : "Letzter Handelskurs"}
          </dt>
          <dd className="font-semibold tabular-nums">{formatPrice(item.price)}</dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <QuoteStatusBadge status={status} />
          <span>Stand {priceTime}</span>
        </span>
        <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-primary">
          Position ansehen
          <ChevronRight
            aria-hidden="true"
            className="size-4 transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
}
