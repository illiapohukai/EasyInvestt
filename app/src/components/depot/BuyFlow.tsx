import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Info } from "lucide-react";
import { Callout } from "@/components/common/Callout";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { SUPPORTED_CURRENCIES } from "@/config/market-data";
import { useDepot } from "@/hooks/use-depot";
import { useHydrated } from "@/hooks/use-hydrated";
import { useInstrumentDetails, useQuote } from "@/hooks/use-market-data";
import { useFocusOnChange } from "@/hooks/use-focus-on-change";
import { useNow } from "@/hooks/use-now";
import {
  formatCents,
  formatPercent,
  formatPrice,
  formatPriceTime,
  formatShares,
} from "@/lib/format";
import { ASSET_TYPE_LABELS } from "@/lib/depot/analysis";
import {
  OrderError,
  prepareBuy,
  valuePortfolio,
  weightAfterBuy,
  type BuyOrder,
} from "@/lib/depot/engine";
import { parseAmountCents, parseUnits } from "@/lib/depot/money";
import { depotStore } from "@/lib/depot/store";
import type { PortfolioRecord, TransactionRecord } from "@/lib/depot/types";
import { MarketDataError } from "@/lib/market-data/errors";
import {
  STATUS_DESCRIPTIONS,
  getDisplayStatus,
  isQuoteUsableForOrder,
} from "@/lib/market-data/status";
import type { Instrument, Quote } from "@/lib/market-data/types";
import { cn } from "@/lib/utils";
import { DepotDisclaimer, DemoDataNotice } from "./DepotNotices";
import { DepotSkeleton } from "./DepotSkeleton";
import { InstrumentSearch } from "./InstrumentSearch";
import { LoadingLine, MarketDataErrorNotice } from "./MarketDataErrorNotice";
import { BackLink, NoPortfolioNotice, OrderSuccess, Row } from "./OrderCommon";
import { OrderField } from "./OrderField";
import { providerMatches } from "./helpers";
import { ProviderMismatchNotice } from "./ProviderMismatchNotice";
import { QuoteStatusBadge } from "./QuoteStatusBadge";
import { QuoteSummary } from "./QuoteSummary";
import { StepIndicator } from "./StepIndicator";

type Mode = "amount" | "units";
const QUICK_AMOUNTS_CENTS = [5_000, 10_000, 25_000];

function riskNote(
  instrument: Instrument,
  weight: number,
): { tone: "info" | "warning"; text: string } {
  if (instrument.type === "stock") {
    return weight >= 20
      ? {
          tone: "warning",
          text: `Diese eine Aktie hätte danach einen Anteil von ${formatPercent(Math.round(weight))} an deinem Depot. Entwickelt sich das Unternehmen schlecht, trifft das einen großen Teil deines Geldes.`,
        }
      : {
          tone: "info",
          text: "Eine Einzelaktie hängt von einem einzigen Unternehmen ab. Ihr Kurs kann stark schwanken – im schlimmsten Fall bis zum Totalverlust.",
        };
  }
  if (instrument.type === "bond-etf") {
    return {
      tone: "info",
      text: "Anleihen-ETFs schwanken meist weniger als Aktien. Steigen die Zinsen, können aber auch ihre Kurse fallen.",
    };
  }
  return {
    tone: "info",
    text: "Ein ETF verteilt das Geld auf viele Unternehmen. Das senkt das Risiko einzelner Firmen, aber der ganze Markt kann trotzdem fallen.",
  };
}

function Preview({
  order,
  portfolio,
  quotes,
  now,
  onBack,
  onConfirm,
  onRefresh,
  refreshing,
  error,
}: {
  order: BuyOrder;
  portfolio: PortfolioRecord;
  quotes: Record<string, Quote>;
  now: Date;
  onBack: () => void;
  onConfirm: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  error: string | null;
}) {
  const headingRef = useFocusOnChange<HTMLHeadingElement>(order);
  const valuation = valuePortfolio(portfolio, quotes);
  const weight = weightAfterBuy(valuation, order);
  const note = riskNote(order.instrument, weight);
  const status = getDisplayStatus(order.quote, now);
  const usable = isQuoteUsableForOrder(order.quote, now);

  return (
    <section aria-labelledby="vorschau-titel" className="space-y-4">
      <StepIndicator step={3} total={3} label="Prüfen" />
      <h2
        id="vorschau-titel"
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl font-bold outline-none"
      >
        Virtuellen Kauf prüfen
      </h2>
      <dl className="surface divide-y divide-border px-4 text-[0.9375rem] sm:px-5">
        <Row label="Wertpapier">
          <span className="font-semibold break-words">{order.instrument.name}</span>
          <span className="block text-sm font-normal text-muted-foreground">
            {order.instrument.symbol} · {ASSET_TYPE_LABELS[order.instrument.type]}
          </span>
        </Row>
        <Row label="Kurs für die Simulation">
          {formatPrice(order.price)}
          <span className="mt-0.5 flex flex-wrap items-center justify-end gap-1.5 text-sm font-normal text-muted-foreground">
            <QuoteStatusBadge status={status} />
            Stand {formatPriceTime(order.quote.asOf, order.quote.asOfPrecision)}
          </span>
        </Row>
        <Row label="Stückzahl">{formatShares(order.units)}</Row>
        <Row label="Geschätzter Orderwert" strong>
          {formatCents(order.amountCents)}
        </Row>
        <Row label="Währung">EUR – keine Umrechnung nötig</Row>
        <Row label="Verfügbar danach">{formatCents(order.cashAfterCents)}</Row>
        <Row label="Anteil am Depot danach">{formatPercent(Math.round(weight * 10) / 10)}</Row>
        <Row label="Gebühren">keine (Simulation)</Row>
      </dl>

      <Callout tone={note.tone} title="Risiko und Streuung">
        {note.text}
      </Callout>
      <p className="flex gap-2 text-sm text-muted-foreground">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>
          {STATUS_DESCRIPTIONS[status]} Es wird keine echte Order aufgegeben und kein echtes Geld
          bewegt.
        </span>
      </p>

      {!usable ? (
        <Callout tone="warning" title="Kurs nicht mehr aktuell">
          <p>Aktualisiere den Kurs, bevor du virtuell kaufst.</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={onRefresh}
            disabled={refreshing}
          >
            Kurs aktualisieren
          </Button>
        </Callout>
      ) : null}
      {error ? (
        <p role="alert" className="font-medium text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <Button variant="secondary" size="lg" onClick={onBack}>
          Ändern
        </Button>
        <Button size="lg" onClick={onConfirm} disabled={!usable}>
          Virtuell kaufen
        </Button>
      </div>
      <DepotDisclaimer />
    </section>
  );
}

function OrderSteps({
  instrumentId,
  portfolio,
  quotes,
}: {
  instrumentId: string;
  portfolio: PortfolioRecord;
  quotes: Record<string, Quote>;
}) {
  const now = useNow();
  const details = useInstrumentDetails(instrumentId);
  const quote = useQuote(instrumentId);
  const [mode, setMode] = useState<Mode>("amount");
  const [input, setInput] = useState("");
  const [touched, setTouched] = useState(false);
  const [order, setOrder] = useState<BuyOrder | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [done, setDone] = useState<TransactionRecord | null>(null);

  const held = portfolio.positions.find((p) => p.instrument.id === instrumentId);
  const instrument: Instrument | undefined =
    details.status === "success" ? details.data : held?.instrument;
  const liveQuote = quote.status === "success" ? quote.data : undefined;
  const cachedQuote = quotes[instrumentId];

  if (done) {
    const after = depotStore.getSnapshot().state.portfolio ?? portfolio;
    const weight =
      valuePortfolio(after, depotStore.getSnapshot().state.quotes).positions.find(
        (p) => p.position.instrument.id === done.instrumentId,
      )?.weightPercent ?? 0;
    return (
      <OrderSuccess
        title="Virtueller Kauf ausgeführt"
        transactionId={done.id}
        summary={
          <p>
            Du hast virtuell {formatShares(done.units)} Stück {done.name} zu je{" "}
            {formatPrice(done.price)} für {formatCents(done.amountCents)} gekauft. Verfügbares
            Guthaben jetzt: {formatCents(done.cashAfterCents)}. Die Position macht{" "}
            {formatPercent(Math.round(weight))} deines Depots aus.
          </p>
        }
        question="Welches Risiko entsteht, wenn diese Position einen großen Anteil deines Depots bildet?"
        actions={
          <>
            <Button asChild size="lg">
              <Link to="/depot">Zum Depot</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/depot/wertpapier" search={{ id: done.instrumentId }}>
                Position ansehen
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link to="/depot/kaufen" search={{}}>
                Weiteres Wertpapier
              </Link>
            </Button>
          </>
        }
      />
    );
  }

  if (details.status === "error" && !instrument) {
    return (
      <div className="space-y-4">
        <BackLink to="/depot/kaufen" search={{}}>
          Andere Auswahl
        </BackLink>
        <MarketDataErrorNotice error={details.error} onRetry={details.reload} />
      </div>
    );
  }
  if (!instrument) return <LoadingLine>Wertpapier wird geladen …</LoadingLine>;

  const unsupported = !SUPPORTED_CURRENCIES.includes(instrument.currency);
  const parsed = mode === "amount" ? parseAmountCents(input) : parseUnits(input);
  let draft: BuyOrder | null = null;
  let error: string | null = null;
  if (input.trim() !== "") {
    if (!parsed.ok) {
      error = parsed.error;
    } else if (liveQuote) {
      try {
        draft = prepareBuy(
          portfolio,
          instrument,
          liveQuote,
          mode === "amount"
            ? { kind: "amount", amountCents: parsed.value }
            : { kind: "units", units: parsed.value },
        );
      } catch (failure) {
        error = failure instanceof OrderError ? failure.message : "Die Eingabe ist ungültig.";
      }
    }
  } else if (touched) {
    error = mode === "amount" ? "Bitte gib einen Betrag ein." : "Bitte gib eine Stückzahl ein.";
  }

  if (order) {
    return (
      <Preview
        order={order}
        portfolio={portfolio}
        quotes={quotes}
        now={now}
        onBack={() => {
          setOrder(null);
          setConfirmError(null);
        }}
        refreshing={quote.status === "loading"}
        onRefresh={() => {
          setOrder(null);
          quote.refresh();
        }}
        onConfirm={() => {
          try {
            setDone(depotStore.buy(order));
          } catch (failure) {
            setConfirmError(
              failure instanceof OrderError
                ? failure.message
                : "Der virtuelle Kauf konnte nicht gespeichert werden.",
            );
          }
        }}
        error={confirmError}
      />
    );
  }

  return (
    <section aria-labelledby="order-titel" className="space-y-4">
      <StepIndicator step={2} total={3} label="Betrag oder Stückzahl" />
      <div className="surface space-y-4 p-4 sm:p-5">
        <div>
          <h2 id="order-titel" className="text-xl font-bold break-words">
            {instrument.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {[
              instrument.symbol,
              ASSET_TYPE_LABELS[instrument.type],
              instrument.exchange,
              instrument.currency,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <Link
            to="/depot/wertpapier"
            search={{ id: instrument.id }}
            className="mt-1 inline-flex min-h-11 items-center text-[0.9375rem] font-semibold text-primary underline underline-offset-4"
          >
            Mehr über dieses Wertpapier
          </Link>
        </div>

        {quote.status === "loading" ? <LoadingLine>Kurs wird geladen …</LoadingLine> : null}
        {quote.status === "error" ? (
          <MarketDataErrorNotice
            error={quote.error}
            onRetry={quote.refresh}
            {...(cachedQuote
              ? {
                  context: `Zuletzt geladen: ${formatPrice(cachedQuote.price)} (Stand ${formatPriceTime(cachedQuote.asOf, cachedQuote.asOfPrecision)}). Ohne aktuellen Kurs ist kein virtueller Kauf möglich.`,
                }
              : { context: "Ohne aktuellen Kurs ist kein virtueller Kauf möglich." })}
          />
        ) : null}
        {liveQuote ? (
          <QuoteSummary quote={liveQuote} now={now} onRefresh={quote.refresh} refreshing={false} />
        ) : null}
      </div>

      {unsupported ? (
        <MarketDataErrorNotice
          error={
            new MarketDataError(
              "unsupported",
              `Dieses Wertpapier notiert in ${instrument.currency}. Das Übungsdepot rechnet bisher nur mit Euro-Wertpapieren, weil ohne verlässliche Umrechnung keine exakten Werte möglich wären.`,
            )
          }
        />
      ) : (
        <form
          noValidate
          className="surface space-y-4 p-4 sm:p-5"
          onSubmit={(event) => {
            event.preventDefault();
            setTouched(true);
            if (draft) {
              setConfirmError(null);
              setOrder(draft);
            }
          }}
        >
          <fieldset className="min-w-0">
            <legend className="mb-2 font-semibold">Wie möchtest du kaufen?</legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["amount", "Betrag in €"],
                  ["units", "Stückzahl"],
                ] as const
              ).map(([key, text]) => (
                <label
                  key={key}
                  className={cn(
                    "flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-[0.9375rem] font-semibold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                    mode === key
                      ? "border-primary bg-primary-soft text-primary-strong"
                      : "border-input bg-card hover:bg-muted",
                  )}
                >
                  <input
                    type="radio"
                    name="kaufart"
                    value={key}
                    checked={mode === key}
                    onChange={() => {
                      setMode(key);
                      setInput("");
                      setTouched(false);
                    }}
                    className="sr-only"
                  />
                  {text}
                </label>
              ))}
            </div>
          </fieldset>

          <OrderField
            label={mode === "amount" ? "Betrag" : "Anzahl Stück"}
            suffix={mode === "amount" ? "€" : "Stück"}
            value={input}
            onChange={(value) => {
              setInput(value);
              setTouched(true);
            }}
            error={touched ? error : null}
            hint={
              mode === "amount"
                ? `Verfügbar: ${formatCents(portfolio.cashCents)}. Bruchstücke werden auf 0,0001 Stück abgerundet.`
                : `Verfügbar: ${formatCents(portfolio.cashCents)}. Bruchstücke bis 0,0001 Stück sind möglich.`
            }
          />

          {mode === "amount" ? (
            <div role="group" aria-label="Schnellauswahl Betrag" className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS_CENTS.filter((c) => c <= portfolio.cashCents).map((cents) => (
                <button
                  key={cents}
                  type="button"
                  onClick={() => {
                    setInput(String(cents / 100));
                    setTouched(true);
                  }}
                  className="min-h-11 rounded-full border border-input bg-card px-4 text-sm font-semibold tabular-nums hover:bg-muted"
                >
                  {formatCents(cents).replace(",00", "")}
                </button>
              ))}
            </div>
          ) : null}

          <p aria-live="polite" className="min-h-6 text-[0.9375rem] font-semibold tabular-nums">
            {draft
              ? `≈ ${formatShares(draft.units)} Stück für ${formatCents(draft.amountCents)}`
              : ""}
          </p>

          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={!liveQuote}>
            Weiter zur Vorschau
            <ArrowRight aria-hidden="true" />
          </Button>
        </form>
      )}
    </section>
  );
}

export function BuyFlow({ instrumentId }: { instrumentId: string | undefined }) {
  const hydrated = useHydrated();
  const { state } = useDepot();
  if (!hydrated) return <DepotSkeleton />;
  const portfolio = state.portfolio;
  if (!portfolio) return <NoPortfolioNotice />;
  const blocked = depotStore.isReadOnly() || !providerMatches(portfolio);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <BackLink
        to={instrumentId ? "/depot/kaufen" : "/depot"}
        {...(instrumentId ? { search: {} } : {})}
      >
        {instrumentId ? "Anderes Wertpapier wählen" : "Zum Depot"}
      </BackLink>
      <PageHeader
        eyebrow="Übungsdepot · Simulation"
        title="Virtuell investieren"
        description={`Verfügbares virtuelles Guthaben: ${formatCents(portfolio.cashCents)}`}
      />
      <DemoDataNotice compact />
      {blocked ? (
        <ProviderMismatchNotice portfolio={portfolio} />
      ) : instrumentId ? (
        <OrderSteps
          key={instrumentId}
          instrumentId={instrumentId}
          portfolio={portfolio}
          quotes={state.quotes}
        />
      ) : (
        <section aria-labelledby="auswahl-titel" className="space-y-4">
          <StepIndicator step={1} total={3} label="Wertpapier wählen" />
          <h2 id="auswahl-titel" className="sr-only">
            Wertpapier wählen
          </h2>
          <InstrumentSearch target="kaufen" />
        </section>
      )}
    </div>
  );
}
