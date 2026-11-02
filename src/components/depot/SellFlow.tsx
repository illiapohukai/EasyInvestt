import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Callout } from "@/components/common/Callout";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { useDepot } from "@/hooks/use-depot";
import { useHydrated } from "@/hooks/use-hydrated";
import { useQuote } from "@/hooks/use-market-data";
import { useFocusOnChange } from "@/hooks/use-focus-on-change";
import { useNow } from "@/hooks/use-now";
import { formatCents, formatPrice, formatPriceTime, formatShares } from "@/lib/format";
import { ASSET_TYPE_LABELS } from "@/lib/depot/analysis";
import { OrderError, prepareSell, valuePortfolio, type SellOrder } from "@/lib/depot/engine";
import { averagePrice, parseUnits } from "@/lib/depot/money";
import { depotStore } from "@/lib/depot/store";
import { UNITS_PER_SHARE, type PortfolioRecord, type TransactionRecord } from "@/lib/depot/types";
import {
  STATUS_DESCRIPTIONS,
  getDisplayStatus,
  isQuoteUsableForOrder,
} from "@/lib/market-data/status";
import type { Quote } from "@/lib/market-data/types";
import { DepotDisclaimer, DemoDataNotice } from "./DepotNotices";
import { DepotSkeleton } from "./DepotSkeleton";
import { GainLoss } from "./GainLoss";
import { LoadingLine, MarketDataErrorNotice } from "./MarketDataErrorNotice";
import { BackLink, NoPortfolioNotice, OrderSuccess, Row } from "./OrderCommon";
import { OrderField } from "./OrderField";
import { providerMatches } from "./helpers";
import { ProviderMismatchNotice } from "./ProviderMismatchNotice";
import { QuoteStatusBadge } from "./QuoteStatusBadge";
import { QuoteSummary } from "./QuoteSummary";
import { StepIndicator } from "./StepIndicator";

/** Quantity as an editable German number without grouping, e.g. "2,5". */
function unitsToInput(units: number): string {
  return (units / UNITS_PER_SHARE).toLocaleString("de-DE", {
    maximumFractionDigits: 4,
    useGrouping: false,
  });
}

function PositionPicker({
  portfolio,
  quotes,
}: {
  portfolio: PortfolioRecord;
  quotes: Record<string, Quote>;
}) {
  const valuation = valuePortfolio(portfolio, quotes);
  if (valuation.positions.length === 0) {
    return (
      <div className="surface space-y-3 p-5">
        <h2 className="text-xl font-bold">Nichts zu verkaufen</h2>
        <p className="text-muted-foreground">
          In deinem Übungsdepot sind noch keine Wertpapiere. Verkaufen kannst du nur, was du vorher
          virtuell gekauft hast.
        </p>
        <Button asChild size="lg">
          <Link to="/depot/kaufen" search={{}}>
            Virtuell investieren
          </Link>
        </Button>
      </div>
    );
  }
  return (
    <section aria-labelledby="position-waehlen-titel" className="space-y-3">
      <StepIndicator step={1} total={3} label="Position wählen" />
      <h2 id="position-waehlen-titel" className="text-xl font-bold">
        Welche Position möchtest du verkaufen?
      </h2>
      <ul className="space-y-2">
        {valuation.positions.map((item) => (
          <li key={item.position.instrument.id}>
            <Link
              to="/depot/verkaufen"
              search={{ id: item.position.instrument.id }}
              className="surface group flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:border-primary/40"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-semibold break-words">
                  {item.position.instrument.name}
                </span>
                <span className="block text-sm text-muted-foreground tabular-nums">
                  {formatShares(item.position.units)} Stück · Wert {formatCents(item.valueCents)}
                </span>
              </span>
              <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SellPreview({
  order,
  now,
  onBack,
  onConfirm,
  onRefresh,
  error,
}: {
  order: SellOrder;
  now: Date;
  onBack: () => void;
  onConfirm: () => void;
  onRefresh: () => void;
  error: string | null;
}) {
  const headingRef = useFocusOnChange<HTMLHeadingElement>(order);
  const status = getDisplayStatus(order.quote, now);
  const usable = isQuoteUsableForOrder(order.quote, now);
  return (
    <section aria-labelledby="verkauf-vorschau-titel" className="space-y-4">
      <StepIndicator step={3} total={3} label="Prüfen" />
      <h2
        id="verkauf-vorschau-titel"
        ref={headingRef}
        tabIndex={-1}
        className="text-2xl font-bold outline-none"
      >
        Virtuellen Verkauf prüfen
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
        <Row label="Geschätzter Erlös" strong>
          {formatCents(order.proceedsCents)}
        </Row>
        <Row label="Anteiliger Kaufwert">{formatCents(order.costBasisCents)}</Row>
        <Row label="Realisierter Gewinn/Verlust">
          <GainLoss cents={order.realizedCents} size="sm" />
        </Row>
        <Row label="Verbleibende Stück">
          {order.remainingUnits === 0
            ? "0 – Position wird geschlossen"
            : formatShares(order.remainingUnits)}
        </Row>
        <Row label="Verfügbar danach">{formatCents(order.cashAfterCents)}</Row>
        <Row label="Gebühren und Steuern">keine (Simulation)</Row>
      </dl>
      <p className="text-sm text-muted-foreground">
        {STATUS_DESCRIPTIONS[status]} Beim echten Verkauf können Kurs, Gebühren und Steuern
        abweichen. Es wird keine echte Order aufgegeben.
      </p>

      {!usable ? (
        <Callout tone="warning" title="Kurs nicht mehr aktuell">
          <p>Aktualisiere den Kurs, bevor du virtuell verkaufst.</p>
          <Button variant="secondary" size="sm" className="mt-2" onClick={onRefresh}>
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
          Virtuell verkaufen
        </Button>
      </div>
      <DepotDisclaimer />
    </section>
  );
}

function SellSteps({
  instrumentId,
  portfolio,
}: {
  instrumentId: string;
  portfolio: PortfolioRecord;
}) {
  const now = useNow();
  const quote = useQuote(instrumentId);
  const [input, setInput] = useState("");
  const [touched, setTouched] = useState(false);
  const [order, setOrder] = useState<SellOrder | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [done, setDone] = useState<TransactionRecord | null>(null);

  if (done) {
    return (
      <OrderSuccess
        title="Virtueller Verkauf ausgeführt"
        transactionId={done.id}
        summary={
          <div className="space-y-1">
            <p>
              Du hast virtuell {formatShares(done.units)} Stück {done.name} zu je{" "}
              {formatPrice(done.price)} verkauft. Erlös: {formatCents(done.amountCents)}.
            </p>
            <p className="flex flex-wrap items-center gap-x-1.5">
              Realisierter Gewinn/Verlust: <GainLoss cents={done.realizedCents} size="sm" />
            </p>
            <p>Verfügbares Guthaben jetzt: {formatCents(done.cashAfterCents)}.</p>
          </div>
        }
        question="Was war der Grund für deinen Verkauf – ein Plan, den du vorher hattest, oder eine Reaktion auf die letzte Kursbewegung?"
        actions={
          <>
            <Button asChild size="lg">
              <Link to="/depot">Zum Depot</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/depot/transaktionen">Transaktionen ansehen</Link>
            </Button>
          </>
        }
      />
    );
  }

  const position = portfolio.positions.find((p) => p.instrument.id === instrumentId);
  if (!position) {
    return (
      <Callout tone="info" title="Nicht in deinem Depot">
        <p>
          Dieses Wertpapier ist nicht (mehr) in deinem Übungsdepot. Leerverkäufe sind nicht möglich.
        </p>
        <Link
          to="/depot/verkaufen"
          search={{}}
          className="mt-1 inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
        >
          Andere Position wählen
        </Link>
      </Callout>
    );
  }

  const { instrument } = position;
  const liveQuote = quote.status === "success" ? quote.data : undefined;
  const parsed = parseUnits(input);
  let draft: SellOrder | null = null;
  let error: string | null = null;
  if (input.trim() !== "") {
    if (!parsed.ok) {
      error = parsed.error;
    } else if (liveQuote) {
      try {
        draft = prepareSell(portfolio, instrumentId, liveQuote, parsed.value);
      } catch (failure) {
        error = failure instanceof OrderError ? failure.message : "Die Eingabe ist ungültig.";
      }
    } else if (parsed.value > position.units) {
      error =
        "Du kannst nicht mehr verkaufen, als du besitzt. Leerverkäufe sind im Übungsdepot nicht möglich.";
    }
  } else if (touched) {
    error = "Bitte gib eine Stückzahl ein.";
  }

  if (order) {
    return (
      <SellPreview
        order={order}
        now={now}
        onBack={() => {
          setOrder(null);
          setConfirmError(null);
        }}
        onRefresh={() => {
          setOrder(null);
          quote.refresh();
        }}
        onConfirm={() => {
          try {
            setDone(depotStore.sell(order));
          } catch (failure) {
            setConfirmError(
              failure instanceof OrderError
                ? failure.message
                : "Der virtuelle Verkauf konnte nicht gespeichert werden.",
            );
          }
        }}
        error={confirmError}
      />
    );
  }

  const half = Math.floor(position.units / 2);
  const chips: { label: string; units: number }[] = [
    ...(half > 0 ? [{ label: "Hälfte", units: half }] : []),
    { label: "Alles", units: position.units },
  ];

  return (
    <section aria-labelledby="verkauf-titel" className="space-y-4">
      <StepIndicator step={2} total={3} label="Stückzahl" />
      <div className="surface space-y-4 p-4 sm:p-5">
        <div>
          <h2 id="verkauf-titel" className="text-xl font-bold break-words">
            {instrument.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {instrument.symbol} · {ASSET_TYPE_LABELS[instrument.type]}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm min-[380px]:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Im Depot</dt>
            <dd className="font-semibold tabular-nums">{formatShares(position.units)} Stück</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Ø Kaufkurs</dt>
            <dd className="font-semibold tabular-nums">
              {formatPrice(averagePrice(position.costBasisCents, position.units))}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Kaufwert</dt>
            <dd className="font-semibold tabular-nums">{formatCents(position.costBasisCents)}</dd>
          </div>
        </dl>
        {quote.status === "loading" ? <LoadingLine>Kurs wird geladen …</LoadingLine> : null}
        {quote.status === "error" ? (
          <MarketDataErrorNotice
            error={quote.error}
            onRetry={quote.refresh}
            context="Ohne aktuellen Kurs ist kein virtueller Verkauf möglich. Deine Position bleibt unverändert."
          />
        ) : null}
        {liveQuote ? <QuoteSummary quote={liveQuote} now={now} onRefresh={quote.refresh} /> : null}
      </div>

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
        <OrderField
          label="Anzahl Stück zum Verkaufen"
          suffix="Stück"
          value={input}
          onChange={(value) => {
            setInput(value);
            setTouched(true);
          }}
          error={touched ? error : null}
          hint={`Du besitzt ${formatShares(position.units)} Stück. Mehr kannst du nicht verkaufen.`}
        />
        <div role="group" aria-label="Schnellauswahl Stückzahl" className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => {
                setInput(unitsToInput(chip.units));
                setTouched(true);
              }}
              className="min-h-11 rounded-full border border-input bg-card px-4 text-sm font-semibold tabular-nums hover:bg-muted"
            >
              {chip.label} ({formatShares(chip.units)})
            </button>
          ))}
        </div>
        <p aria-live="polite" className="min-h-6 text-[0.9375rem] font-semibold tabular-nums">
          {draft ? `≈ ${formatCents(draft.proceedsCents)} Erlös` : ""}
        </p>
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={!liveQuote}>
          Weiter zur Vorschau
          <ArrowRight aria-hidden="true" />
        </Button>
      </form>
    </section>
  );
}

export function SellFlow({ instrumentId }: { instrumentId: string | undefined }) {
  const hydrated = useHydrated();
  const { state } = useDepot();
  if (!hydrated) return <DepotSkeleton />;
  const portfolio = state.portfolio;
  if (!portfolio) return <NoPortfolioNotice />;
  const blocked = depotStore.isReadOnly() || !providerMatches(portfolio);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <BackLink
        to={instrumentId ? "/depot/verkaufen" : "/depot"}
        {...(instrumentId ? { search: {} } : {})}
      >
        {instrumentId ? "Andere Position wählen" : "Zum Depot"}
      </BackLink>
      <PageHeader
        eyebrow="Übungsdepot · Simulation"
        title="Virtuell verkaufen"
        description="Du kannst nur verkaufen, was in deinem Übungsdepot liegt – ohne Leerverkauf und ohne Hebel."
      />
      <DemoDataNotice compact />
      {blocked ? (
        <ProviderMismatchNotice portfolio={portfolio} />
      ) : instrumentId ? (
        <SellSteps key={instrumentId} instrumentId={instrumentId} portfolio={portfolio} />
      ) : (
        <PositionPicker portfolio={portfolio} quotes={state.quotes} />
      )}
    </div>
  );
}
