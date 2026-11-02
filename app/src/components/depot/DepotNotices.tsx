import { FlaskConical, ShieldAlert } from "lucide-react";
import { Callout } from "@/components/common/Callout";
import { ExternalLink } from "@/components/common/ExternalLink";
import { Button } from "@/components/ui/button";
import { SITE } from "@/config/site";
import { getMarketData } from "@/config/market-data";
import { formatDateTime } from "@/lib/format";
import type { DepotIssue } from "@/lib/depot/schema";
import { depotStore } from "@/lib/depot/store";
import { cn } from "@/lib/utils";
import { DEMO_LABEL, isDemoMode } from "./helpers";

/** Impossible-to-miss notice that all prices are sample data. */
export function DemoDataNotice({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  if (!isDemoMode()) return null;
  return (
    <div
      role="note"
      className={cn(
        "flex gap-3 rounded-xl border-2 border-dashed border-[#e2b97f] bg-warning-soft p-4",
        className,
      )}
    >
      <FlaskConical aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
      <div className="min-w-0 space-y-1 text-[0.9375rem] leading-relaxed">
        <p className="font-bold text-foreground">{DEMO_LABEL}</p>
        {compact ? null : (
          <p className="text-foreground/90">
            Alle Wertpapiere und Kurse im Übungsdepot sind erfunden. Sie ändern sich einmal pro
            Werktag nach einer festen Beispielreihe und haben nichts mit echten Börsenkursen zu tun.
          </p>
        )}
      </div>
    </div>
  );
}

export function DepotDisclaimer({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground",
        className,
      )}
    >
      <ShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-foreground" />
      <strong className="font-semibold text-foreground">{SITE.depotDisclaimer}</strong>
    </p>
  );
}

/** Data provider, last update, delay status and the price-difference note. */
export function MarketDataSourceNote({
  lastUpdate,
  className,
}: {
  lastUpdate: string | null;
  className?: string;
}) {
  const { provider } = getMarketData();
  const demo = provider.mode === "demo";
  return (
    <div className={cn("space-y-1.5 text-sm text-muted-foreground", className)}>
      <p>
        <span className="font-semibold text-foreground">Datenquelle:</span>{" "}
        {provider.info.url ? (
          <ExternalLink href={provider.info.url}>{provider.info.name}</ExternalLink>
        ) : (
          provider.info.name
        )}
        {demo ? " (fiktive Beispielkurse)" : null}
      </p>
      <p>
        <span className="font-semibold text-foreground">Letzte Aktualisierung:</span>{" "}
        {lastUpdate ? formatDateTime(lastUpdate) : "noch keine"}
      </p>
      <p>
        <span className="font-semibold text-foreground">Verzögerung:</span>{" "}
        {demo
          ? "Keine Marktdaten – Beispielkurse ändern sich einmal pro Werktag."
          : "Je nach Börse und Tarif des Anbieters verzögert oder als Schlusskurs. Der Status steht an jedem Kurs."}
      </p>
      <p>
        Angezeigte Kurse können von Kursen abweichen, zu denen man wirklich handeln könnte. Es
        werden keine echten Orders ausgeführt.
      </p>
    </div>
  );
}

const ISSUE_TEXT: Record<Exclude<DepotIssue, null>, { title: string; text: string }> = {
  malformed: {
    title: "Gespeichertes Depot war beschädigt",
    text: "Die Depotdaten auf diesem Gerät konnten nicht gelesen werden und wurden verworfen, damit keine falschen Zahlen angezeigt werden. Du kannst ein neues Übungsdepot anlegen. Dein Lernfortschritt ist davon nicht betroffen.",
  },
  "unsupported-version": {
    title: "Altes Depot-Format",
    text: "Das gespeicherte Depot stammt aus einer Version, die nicht mehr gelesen werden kann. Du kannst ein neues Übungsdepot anlegen.",
  },
  "newer-version": {
    title: "Depot aus einer neueren Version",
    text: "Dieses Depot wurde mit einer neueren Version von Geldstart gespeichert. Damit nichts verloren geht, wird es hier nicht verändert. Lade die Seite neu oder setze das Depot unter „Mehr“ zurück.",
  },
};

export function StoredDataIssueNotice({ issue }: { issue: DepotIssue }) {
  if (!issue) return null;
  const { title, text } = ISSUE_TEXT[issue];
  return (
    <Callout tone="warning" title={title}>
      <p>{text}</p>
      {issue !== "newer-version" ? (
        <Button variant="link" className="mt-1" onClick={() => depotStore.dismissIssue()}>
          Hinweis ausblenden
        </Button>
      ) : null}
    </Callout>
  );
}
