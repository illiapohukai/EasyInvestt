import { useId, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, CircleSlash, Search } from "lucide-react";
import { SUPPORTED_CURRENCIES, getMarketData } from "@/config/market-data";
import { useInstrumentSearch } from "@/hooks/use-market-data";
import { ASSET_TYPE_LABELS } from "@/lib/depot/analysis";
import type { AssetType, Instrument } from "@/lib/market-data/types";
import { LoadingLine, MarketDataErrorNotice } from "./MarketDataErrorNotice";

const GROUPS: { type: AssetType; title: string }[] = [
  { type: "etf", title: "Aktien-ETFs" },
  { type: "bond-etf", title: "Anleihen-ETFs" },
  { type: "stock", title: "Einzelaktien" },
];

function ResultRow({
  instrument,
  target,
}: {
  instrument: Instrument;
  target: "kaufen" | "wertpapier";
}) {
  const supported = SUPPORTED_CURRENCIES.includes(instrument.currency);
  const meta = [
    instrument.symbol,
    ASSET_TYPE_LABELS[instrument.type],
    instrument.sector ?? instrument.region,
    instrument.exchange,
    instrument.currency,
  ]
    .filter(Boolean)
    .join(" · ");

  if (!supported) {
    return (
      <div className="rounded-xl border border-dashed border-input px-4 py-3">
        <p className="font-semibold break-words">{instrument.name}</p>
        <p className="text-sm text-muted-foreground">{meta}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <CircleSlash aria-hidden="true" className="size-4" />
          Nicht unterstützt: notiert in {instrument.currency}, das Übungsdepot rechnet nur in Euro.
        </p>
      </div>
    );
  }
  return (
    <Link
      to={target === "kaufen" ? "/depot/kaufen" : "/depot/wertpapier"}
      search={{ id: instrument.id }}
      className="surface group flex min-h-14 items-center gap-3 px-4 py-3 transition-colors hover:border-primary/40"
    >
      <span className="min-w-0 flex-1">
        <span className="block font-semibold break-words">{instrument.name}</span>
        <span className="block text-sm text-muted-foreground">{meta}</span>
      </span>
      <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}

/** Search field with loading, empty, error and unsupported states. */
export function InstrumentSearch({ target = "kaufen" }: { target?: "kaufen" | "wertpapier" }) {
  const [query, setQuery] = useState("");
  const inputId = useId();
  const hintId = useId();
  const result = useInstrumentSearch(query);
  const demo = getMarketData().provider.mode === "demo";
  const trimmed = query.trim();

  let content: React.ReactNode = null;
  let announcement = "";
  if (result.status === "loading") {
    content = <LoadingLine>Suche läuft …</LoadingLine>;
  } else if (result.status === "error") {
    content = <MarketDataErrorNotice error={result.error} onRetry={result.reload} />;
  } else if (result.status === "success") {
    const items = result.data;
    announcement = items.length === 1 ? "1 Ergebnis" : `${items.length} Ergebnisse`;
    if (items.length === 0) {
      content = (
        <p className="rounded-xl border border-dashed border-input px-4 py-5 text-[0.9375rem]">
          Keine passenden Wertpapiere gefunden. Versuch es mit einem anderen Namen, Symbol oder
          einer Branche{demo ? " – z. B. „ETF“, „Energie“ oder „Technologie“" : ""}.
        </p>
      );
    } else if (trimmed === "") {
      content = (
        <div className="space-y-5">
          {GROUPS.map(({ type, title }) => {
            const group = items.filter((i) => i.type === type);
            if (group.length === 0) return null;
            return (
              <section key={type} aria-label={title} className="space-y-2">
                <h3 className="text-sm font-semibold tracking-wide text-muted-foreground">
                  {title}
                </h3>
                <ul className="space-y-2">
                  {group.map((instrument) => (
                    <li key={instrument.id}>
                      <ResultRow instrument={instrument} target={target} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      );
    } else {
      content = (
        <ul className="space-y-2">
          {items.map((instrument) => (
            <li key={instrument.id}>
              <ResultRow instrument={instrument} target={target} />
            </li>
          ))}
        </ul>
      );
    }
  } else if (!demo) {
    content = (
      <p className="text-[0.9375rem] text-muted-foreground">
        Gib mindestens zwei Zeichen ein, zum Beispiel einen Firmennamen oder ein Börsenkürzel.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="block font-semibold">
          Wertpapier suchen
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={demo ? "Name, Symbol, Branche oder „ETF“" : "Name oder Börsenkürzel"}
            aria-describedby={hintId}
            autoComplete="off"
            className="min-h-12 w-full rounded-lg border border-input bg-card pr-3 pl-10 text-base"
          />
        </div>
        <p id={hintId} className="text-sm text-muted-foreground">
          {demo
            ? "Alle Wertpapiere in dieser Version sind fiktive Beispiele."
            : "Unterstützt werden Aktien und ETFs, die in Euro gehandelt werden."}
        </p>
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      {content}
    </div>
  );
}
