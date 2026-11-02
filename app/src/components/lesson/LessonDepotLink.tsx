import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Calculator, ChartPie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDepot } from "@/hooks/use-depot";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatPercent } from "@/lib/format";
import { valuePortfolio } from "@/lib/depot/engine";

function SectionShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-labelledby="depot-bezug-titel" className="surface space-y-3 p-4 sm:p-5">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
        <ChartPie aria-hidden="true" className="size-4" />
        Übungsdepot
      </p>
      <h2 id="depot-bezug-titel" className="text-xl font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function AssetClassLink() {
  const hydrated = useHydrated();
  const { state } = useDepot();
  const portfolio = hydrated ? state.portfolio : null;
  const largest = portfolio
    ? [...valuePortfolio(portfolio, state.quotes).positions].sort(
        (a, b) => b.weightPercent - a.weightPercent,
      )[0]
    : undefined;

  return (
    <SectionShell title="ETF und Einzelaktie im Übungsdepot vergleichen">
      <p className="text-foreground/90">
        Kaufe mit virtuellem Geld einen breit gestreuten ETF und eine Einzelaktie. Beobachte dann,
        wie unterschiedlich stark beide schwanken – ohne echtes Risiko.
      </p>
      {largest ? (
        <p className="rounded-lg bg-muted px-3 py-2 text-[0.9375rem]">
          Deine größte Position ist gerade{" "}
          <strong className="font-semibold">{largest.position.instrument.name}</strong> mit{" "}
          {formatPercent(Math.round(largest.weightPercent))} deines Übungsdepots.
        </p>
      ) : null}
      <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
        {portfolio ? (
          <Link to="/depot/kaufen" search={{}}>
            Im Übungsdepot testen
            <ArrowRight aria-hidden="true" />
          </Link>
        ) : (
          <Link to="/depot">
            Übungsdepot starten
            <ArrowRight aria-hidden="true" />
          </Link>
        )}
      </Button>
    </SectionShell>
  );
}

function CompoundInterestLink() {
  return (
    <SectionShell title="Rechner und Depot zeigen Verschiedenes">
      <p className="text-foreground/90">
        Der Zinseszins-Rechner rechnet mit einer festen, angenommenen Rendite – deshalb ist seine
        Kurve so glatt. Im Übungsdepot schwanken die Kurse dagegen: mal hoch, mal runter. Echte
        Wertentwicklungen verlaufen nie so gleichmäßig wie eine Rechner-Kurve.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild size="lg" variant="secondary">
          <Link to="/rechner">
            <Calculator aria-hidden="true" />
            Zinseszins-Rechner
          </Link>
        </Button>
        <Button asChild size="lg" variant="ghost">
          <Link to="/depot">
            <ChartPie aria-hidden="true" />
            Zum Übungsdepot
          </Link>
        </Button>
      </div>
    </SectionShell>
  );
}

/** Links two lessons to the practice portfolio. Nothing is locked behind lessons. */
export function LessonDepotLink({ lessonId }: { lessonId: string }) {
  if (lessonId === "anlageklassen") return <AssetClassLink />;
  if (lessonId === "zinseszins") return <CompoundInterestLink />;
  return null;
}
