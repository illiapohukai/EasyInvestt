import { Link } from "@tanstack/react-router";
import { Callout } from "@/components/common/Callout";
import type { PortfolioRecord } from "@/lib/depot/types";
import { providerMatches } from "./helpers";

/** Shown when the depot was created with another data source (e.g. demo → real data). */
export function ProviderMismatchNotice({ portfolio }: { portfolio: PortfolioRecord }) {
  if (providerMatches(portfolio)) return null;
  return (
    <Callout tone="warning" title="Andere Datenquelle">
      <p>
        Dieses Depot wurde mit{" "}
        {portfolio.dataMode === "demo" ? "Beispieldaten" : "einer anderen Datenquelle"} angelegt.
        Mit der aktuellen Datenquelle lassen sich seine Kurse nicht aktualisieren und es sind keine
        neuen Käufe möglich. Angezeigt werden die zuletzt gespeicherten Werte.
      </p>
      <p className="mt-1">
        Unter{" "}
        <Link
          to="/mehr"
          hash="depot-zuruecksetzen"
          className="font-semibold text-primary underline underline-offset-4"
        >
          Mehr
        </Link>{" "}
        kannst du das Depot zurücksetzen und neu starten.
      </p>
    </Callout>
  );
}
