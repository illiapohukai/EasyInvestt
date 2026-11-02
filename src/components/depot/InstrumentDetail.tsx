import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowDownToLine,
  BookOpen,
  FlaskConical,
  LineChart as LineChartIcon,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { SUPPORTED_CURRENCIES, getMarketData } from "@/config/market-data";
import { useDepot } from "@/hooks/use-depot";
import { useHydrated } from "@/hooks/use-hydrated";
import { useInstrumentDetails, usePriceHistory, useQuote } from "@/hooks/use-market-data";
import { useNow } from "@/hooks/use-now";
import {
  formatCents,
  formatDate,
  formatNumber,
  formatPercent,
  formatPrice,
  formatShares,
  formatSignedPercent,
} from "@/lib/format";
import { ASSET_TYPE_LABELS } from "@/lib/depot/analysis";
import { valuePortfolio } from "@/lib/depot/engine";
import { depotStore } from "@/lib/depot/store";
import type { DepotState } from "@/lib/depot/types";
import { MarketDataError } from "@/lib/market-data/errors";
import type { HistoryRange, InstrumentDetails } from "@/lib/market-data/types";
import { cn } from "@/lib/utils";
import { DepotDisclaimer, DemoDataNotice, MarketDataSourceNote } from "./DepotNotices";
import { DEMO_LABEL } from "./helpers";
import { DepotSkeleton } from "./DepotSkeleton";
import { GainLoss } from "./GainLoss";
import { InstrumentSearch } from "./InstrumentSearch";
import { LineChart } from "./LineChart";
import { LoadingLine, MarketDataErrorNotice } from "./MarketDataErrorNotice";
import { BackLink } from "./OrderCommon";
import { providerMatches } from "./helpers";
import { ProviderMismatchNotice } from "./ProviderMismatchNotice";
import { QuoteSummary } from "./QuoteSummary";

const RANGES: { key: HistoryRange; label: string }[] = [
  { key: "1M", label: "1 Monat" },
  { key: "6M", label: "6 Monate" },
  { key: "1J", label: "1 Jahr" },
];

const RISK_TEXT: Record<InstrumentDetails["type"], string> = {
  etf: "Ein Aktien-ETF bündelt viele Unternehmen in einem Wertpapier. Fällt eine einzelne Firma, wirkt sich das nur wenig aus – fällt der ganze Markt, verliert aber auch der ETF an Wert.",
  "bond-etf":
    "Ein Anleihen-ETF bündelt viele Anleihen. Er schwankt meist weniger als Aktien. Steigen die Zinsen, können die Kurse trotzdem fallen.",
  stock:
    "Eine Einzelaktie ist ein Anteil an einem einzigen Unternehmen. Ihr Kurs kann stark schwanken und hängt von Nachrichten über genau diese Firma ab – bis hin zum Totalverlust.",
};

function PriceHistorySection({
  instrument,
  isDemo,
}: {
  instrument: InstrumentDetails;
  isDemo: boolean;
}) {
  const [range, setRange] = useState<HistoryRange>("6M");
  const history = usePriceHistory(instrument.id, range);
  const points = history.status === "success" ? history.data.points : [];
  const first = points[0];
  const last = points.at(-1);
  const caption = isDemo
    ? "Beispielverlauf – keine echten Kurse"
    : `Schlusskurse · Quelle: ${getMarketData().provider.info.name}`;
  let summary = "";
  if (first && last && points.length >= 2) {
    const change = ((last.close - first.close) / first.close) * 100;
    summary = `${isDemo ? "Beispielverlauf: " : ""}Vom ${formatDate(first.date)} bis ${formatDate(last.date)} von ${formatPrice(first.close, instrument.currency)} auf ${formatPrice(last.close, instrument.currency)} (${formatSignedPercent(change)}).`;
  }

  return (
    <section aria-labelledby="kursverlauf-titel" className="surface space-y-4 p-4 sm:p-5">
      <div className="space-y-1">
        <h2 id="kursverlauf-titel" className="flex items-center gap-2 text-lg font-bold">
          <LineChartIcon aria-hidden="true" className="size-5 text-primary" />
          Kursverlauf
        </h2>
        <p
          className={cn(
            "flex items-center gap-1.5 text-sm",
            isDemo ? "font-semibold text-warning" : "text-muted-foreground",
          )}
        >
          {isDemo ? <FlaskConical aria-hidden="true" className="size-4 shrink-0" /> : null}
          {caption}
        </p>
      </div>
      <div role="group" aria-label="Zeitraum" className="flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            aria-pressed={r.key === range}
            onClick={() => setRange(r.key)}
            className={cn(
              "min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors",
              r.key === range
                ? "border-primary bg-primary-soft text-primary-strong"
                : "border-input bg-card hover:bg-muted",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
      {history.status === "loading" || history.status === "idle" ? (
        <LoadingLine>Verlauf wird geladen …</LoadingLine>
      ) : null}
      {history.status === "error" ? (
        <MarketDataErrorNotice error={history.error} onRetry={history.reload} />
      ) : null}
      {history.status === "success" ? (
        points.length >= 2 ? (
          <>
            <LineChart
              points={points.map((p) => ({ x: Date.parse(`${p.date}T12:00:00Z`), y: p.close }))}
              label={summary}
              formatY={(v) => formatPrice(v, instrument.currency)}
              formatX={(v) => formatDate(new Date(v).toISOString())}
            />
            <p className="text-[0.9375rem]">{summary}</p>
            <p className="text-sm text-muted-foreground">
              Vergangene Kursbewegungen sagen nichts darüber aus, wie sich ein Wertpapier künftig
              entwickelt.
            </p>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-input px-4 py-5 text-[0.9375rem]">
            <p className="font-semibold">Für diesen Zeitraum gibt es noch nicht genügend Daten.</p>
          </div>
        )
      ) : null}
    </section>
  );
}

function Detail({ instrumentId, state }: { instrumentId: string; state: DepotState }) {
  const now = useNow();
  const details = useInstrumentDetails(instrumentId);
  const quote = useQuote(instrumentId);
  const isDemo = getMarketData().provider.mode === "demo";
  const portfolio = state.portfolio;
  const held = portfolio?.positions.find((p) => p.instrument.id === instrumentId);
  const instrument: InstrumentDetails | undefined =
    details.status === "success" ? details.data : held?.instrument;

  if (details.status === "error" && !instrument) {
    return (
      <div className="space-y-4">
        <BackLink to="/depot">Zum Depot</BackLink>
        <MarketDataErrorNotice error={details.error} onRetry={details.reload} />
      </div>
    );
  }
  if (!instrument) return <LoadingLine>Wertpapier wird geladen …</LoadingLine>;

  const supported = SUPPORTED_CURRENCIES.includes(instrument.currency);
  const canTrade = portfolio !== null && !depotStore.isReadOnly() && providerMatches(portfolio);
  const valuation = portfolio ? valuePortfolio(portfolio, state.quotes) : null;
  const holding = valuation?.positions.find((p) => p.position.instrument.id === instrumentId);
  const liveQuote = quote.status === "success" ? quote.data : undefined;
  const cachedQuote = state.quotes[instrumentId];
  const facts = [
    ["Art", ASSET_TYPE_LABELS[instrument.type]],
    ["Kürzel", instrument.symbol],
    ...(instrument.region ? [["Region", instrument.region]] : []),
    ...(instrument.sector ? [["Branche", instrument.sector]] : []),
    ...(instrument.holdingsCount
      ? [["Enthaltene Wertpapiere", `ca. ${formatNumber(instrument.holdingsCount)}`]]
      : []),
    ...(instrument.exchange ? [["Handelsplatz", instrument.exchange]] : []),
    ["Währung", instrument.currency],
  ] as const;

  return (
    <div className="space-y-5">
      <BackLink to="/depot">Zum Depot</BackLink>
      <PageHeader
        eyebrow={`Wertpapier · ${ASSET_TYPE_LABELS[instrument.type]}`}
        title={instrument.name}
        description={[instrument.symbol, instrument.exchange, instrument.currency]
          .filter(Boolean)
          .join(" · ")}
      />
      {instrument.fictional ? (
        <p className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-3 py-1 text-sm font-semibold text-warning">
          <FlaskConical aria-hidden="true" className="size-4" />
          Fiktives Beispiel – dieses Wertpapier gibt es nicht
        </p>
      ) : null}
      <DemoDataNotice compact />
      {portfolio ? <ProviderMismatchNotice portfolio={portfolio} /> : null}

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0 space-y-5">
          <section aria-labelledby="kurs-titel" className="surface space-y-3 p-4 sm:p-5">
            <h2 id="kurs-titel" className="sr-only">
              Kurs
            </h2>
            {quote.status === "loading" ? <LoadingLine>Kurs wird geladen …</LoadingLine> : null}
            {quote.status === "error" ? (
              <MarketDataErrorNotice
                error={quote.error}
                onRetry={quote.refresh}
                {...(cachedQuote
                  ? { context: "Darunter siehst du den zuletzt geladenen Kurs mit seinem Stand." }
                  : {})}
              />
            ) : null}
            {liveQuote ? (
              <QuoteSummary quote={liveQuote} now={now} onRefresh={quote.refresh} />
            ) : null}
            {!liveQuote && quote.status === "error" && cachedQuote ? (
              <QuoteSummary quote={cachedQuote} now={now} label="Zuletzt geladener Kurs" />
            ) : null}
          </section>

          {!supported ? (
            <MarketDataErrorNotice
              error={
                new MarketDataError(
                  "unsupported",
                  `Dieses Wertpapier notiert in ${instrument.currency}. Das Übungsdepot rechnet bisher nur mit Euro-Wertpapieren, deshalb ist kein virtueller Kauf möglich.`,
                )
              }
            />
          ) : null}

          {holding ? (
            <section aria-labelledby="position-titel" className="surface space-y-3 p-4 sm:p-5">
              <h2 id="position-titel" className="text-lg font-bold">
                Deine Position
              </h2>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-[0.9375rem]">
                <div>
                  <dt className="text-sm text-muted-foreground">Stück</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatShares(holding.position.units)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Ø Kaufkurs</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatPrice(holding.averagePrice)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Kaufwert</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatCents(holding.position.costBasisCents)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    {holding.priceSource === "quote"
                      ? "Aktueller Wert"
                      : "Wert zum letzten Handelskurs"}
                  </dt>
                  <dd className="font-semibold tabular-nums">{formatCents(holding.valueCents)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Gewinn/Verlust (nicht realisiert)
                  </dt>
                  <dd>
                    <GainLoss
                      cents={holding.unrealizedCents}
                      percent={holding.unrealizedPercent}
                      size="sm"
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Anteil am Depot</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatPercent(Math.round(holding.weightPercent))}
                  </dd>
                </div>
              </dl>
            </section>
          ) : null}

          <div className="flex flex-col gap-2 min-[400px]:flex-row min-[400px]:flex-wrap">
            {portfolio === null ? (
              <Button asChild size="lg" className="flex-1">
                <Link to="/depot">
                  <Plus aria-hidden="true" />
                  Im Übungsdepot testen
                </Link>
              </Button>
            ) : canTrade && supported ? (
              <Button asChild size="lg" className="flex-1">
                <Link to="/depot/kaufen" search={{ id: instrument.id }}>
                  <Plus aria-hidden="true" />
                  {holding ? "Virtuell kaufen" : "Im Übungsdepot testen"}
                </Link>
              </Button>
            ) : null}
            {holding && canTrade ? (
              <Button asChild size="lg" variant="secondary" className="flex-1">
                <Link to="/depot/verkaufen" search={{ id: instrument.id }}>
                  <ArrowDownToLine aria-hidden="true" />
                  Virtuell verkaufen
                </Link>
              </Button>
            ) : null}
            <Button asChild size="lg" variant="ghost" className="flex-1">
              <Link to="/lernen/$lessonId" params={{ lessonId: "anlageklassen" }}>
                <BookOpen aria-hidden="true" />
                Risiko verstehen
              </Link>
            </Button>
          </div>
        </div>

        <div className="min-w-0 space-y-5">
          <section aria-labelledby="erklaert-titel" className="surface space-y-3 p-4 sm:p-5">
            <h2 id="erklaert-titel" className="text-lg font-bold">
              Kurz erklärt
            </h2>
            {instrument.description ? (
              <p className="text-[0.9375rem]">{instrument.description}</p>
            ) : null}
            <p className="text-[0.9375rem]">{RISK_TEXT[instrument.type]}</p>
            <dl className="divide-y divide-border border-t border-border text-[0.9375rem]">
              {facts.map(([label, value]) => (
                <div key={label} className="flex flex-wrap justify-between gap-x-4 py-2">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-muted-foreground">
              Diese Angaben beschreiben das Wertpapier. Sie sind keine Empfehlung, es zu kaufen oder
              zu verkaufen.
            </p>
          </section>

          <PriceHistorySection instrument={instrument} isDemo={isDemo} />

          <section aria-labelledby="quelle-titel" className="surface space-y-3 p-4 sm:p-5">
            <h2 id="quelle-titel" className="text-lg font-bold">
              Über die Kurse
            </h2>
            {isDemo ? <p className="text-sm font-semibold">{DEMO_LABEL}</p> : null}
            <MarketDataSourceNote
              lastUpdate={liveQuote?.fetchedAt ?? cachedQuote?.fetchedAt ?? null}
            />
          </section>
          <DepotDisclaimer />
        </div>
      </div>
    </div>
  );
}

export function InstrumentDetail({ instrumentId }: { instrumentId: string | undefined }) {
  const hydrated = useHydrated();
  const { state } = useDepot();
  if (!hydrated) return <DepotSkeleton />;
  if (!instrumentId) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <BackLink to="/depot">Zum Depot</BackLink>
        <PageHeader
          eyebrow="Übungsdepot"
          title="Wertpapiere ansehen"
          description="Suche ein Wertpapier, um Kurs, Verlauf und Risiko kennenzulernen."
        />
        <DemoDataNotice compact />
        <InstrumentSearch target="wertpapier" />
      </div>
    );
  }
  return <Detail key={instrumentId} instrumentId={instrumentId} state={state} />;
}
