import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Calculator,
  ChartPie,
  ChevronRight,
  Database,
  Info,
  Library,
  ShieldCheck,
  Trash2,
  Wrench,
} from "lucide-react";
import { Callout } from "@/components/common/Callout";
import { Disclaimer } from "@/components/common/Disclaimer";
import { ExternalLink } from "@/components/common/ExternalLink";
import { PageHeader } from "@/components/common/PageHeader";
import { ResetProgress } from "@/components/common/ResetProgress";
import { DepotReset } from "@/components/depot/DepotReset";
import { DepotDisclaimer, MarketDataSourceNote } from "@/components/depot/DepotNotices";
import { DEMO_LABEL, isDemoMode } from "@/components/depot/helpers";
import { SITE } from "@/config/site";
import { useDepot } from "@/hooks/use-depot";
import { infoSources } from "@/content/sources";
import { useHydrated } from "@/hooks/use-hydrated";
import { isStorageWritable } from "@/lib/progress/storage";

export const Route = createFileRoute("/mehr")({
  head: () => ({
    meta: [
      { title: `Mehr – ${SITE.name}` },
      {
        name: "description",
        content:
          "Werkzeuge, Hinweise zum Übungsdepot, Datenschutz, Quellen sowie Lernfortschritt und Depot zurücksetzen.",
      },
    ],
  }),
  component: MorePage,
});

function InfoSection({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  icon: typeof Info;
  children: ReactNode;
}) {
  const headingId = `${id}-titel`;
  return (
    <section id={id} aria-labelledby={headingId} className="surface scroll-mt-4 space-y-3 p-5">
      <h2 id={headingId} className="flex items-center gap-2 text-lg font-bold">
        <Icon aria-hidden="true" className="size-5 text-primary" />
        {title}
      </h2>
      <div className="space-y-3 text-[0.9375rem] text-foreground/90">{children}</div>
    </section>
  );
}

function ToolLink({
  to,
  icon: Icon,
  title,
  text,
}: {
  to: "/rechner" | "/depot";
  icon: typeof Info;
  title: string;
  text: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:border-primary/40"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-foreground">{title}</span>
        <span className="block text-muted-foreground">{text}</span>
      </span>
      <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function DepotDataInfo() {
  const hydrated = useHydrated();
  const { state } = useDepot();
  return (
    <>
      {isDemoMode() ? <p className="font-semibold">{DEMO_LABEL}</p> : null}
      <MarketDataSourceNote lastUpdate={hydrated ? state.lastRefreshAt : null} />
      <DepotDisclaimer />
    </>
  );
}

function DataRequestsNote() {
  if (isDemoMode()) {
    return (
      <p>
        Das Übungsdepot nutzt fiktive Beispielkurse, die direkt in der App berechnet werden. Dafür
        werden keine Daten aus dem Internet geladen.
      </p>
    );
  }
  return (
    <p>
      Für Kurse fragt das Übungsdepot einen Kursdaten-Dienst ab. Dabei werden nur Suchbegriffe und
      Kennungen von Wertpapieren übertragen – nie dein Depot, deine Notizen oder dein
      Lernfortschritt.
    </p>
  );
}

function StorageNotice() {
  const hydrated = useHydrated();
  if (!hydrated || isStorageWritable()) return null;
  return (
    <Callout tone="warning" title="Speichern ist gerade nicht möglich">
      Dein Browser blockiert den lokalen Speicher, zum Beispiel im privaten Modus. Du kannst alles
      nutzen, aber dein Fortschritt geht verloren, wenn du die Seite schließt.
    </Callout>
  );
}

function MorePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Mehr"
        title="Über Geldstart"
        description="Werkzeuge, Hinweise, Datenschutz, Quellen und deine gespeicherten Daten."
      />

      <InfoSection id="werkzeuge" title="Werkzeuge" icon={Wrench}>
        <ToolLink
          to="/rechner"
          icon={Calculator}
          title="Zinseszins-Rechner"
          text="Rechne mit eigenen Zahlen aus, wie Geld mit Zinseszins wachsen kann."
        />
        <ToolLink
          to="/depot"
          icon={ChartPie}
          title="Übungsdepot"
          text="Kaufen und verkaufen üben – mit virtuellem Geld."
        />
      </InfoSection>

      <InfoSection id="ueber" title="Was ist Geldstart?" icon={BookOpen}>
        <p>
          Geldstart erklärt Jugendlichen und jungen Erwachsenen zwischen 16 und 20 die Grundlagen
          von Geld und Geldanlage: Inflation, Zinseszins, Anlageklassen, Sparen mit kleinen
          Beträgen, Altersvorsorge und staatliche Förderung.
        </p>
        <p>
          Die Inhalte sind bewusst vereinfacht und neutral. Es werden keine Produkte, Banken oder
          Anbieter empfohlen. Zeitabhängige Angaben wie Beträge, Gesetze und Förderungen haben den
          Stand {SITE.contentReviewedAt}.
        </p>
      </InfoSection>

      <InfoSection id="hinweis" title="Wichtiger Hinweis" icon={Info}>
        <Disclaimer />
        <p>
          Geldstart gibt keine persönliche Beratung. Ob eine Geldanlage zu dir passt, hängt von
          deiner Situation ab. Unabhängige Beratung bieten zum Beispiel die Verbraucherzentralen.
        </p>
        <p>
          Unter 18 brauchst du für Konten, Depots und Verträge in der Regel die Zustimmung deiner
          Eltern.
        </p>
      </InfoSection>

      <InfoSection id="datenschutz" title="Datenschutz und Speicherung" icon={ShieldCheck}>
        <p>
          Geldstart funktioniert ohne Konto und ohne Anmeldung. Es gibt kein Tracking, keine
          Werbung, keine Cookies und keine Analyse-Dienste. Schriften und Grafiken werden nicht von
          fremden Servern geladen.
        </p>
        <p>
          Gespeichert wird nur auf deinem Gerät, im lokalen Speicher deines Browsers (localStorage):
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>welche Themen du begonnen und abgeschlossen hast,</li>
          <li>wie viele Quizfragen du beim ersten Versuch richtig hattest,</li>
          <li>welches Thema du zuletzt geöffnet hast,</li>
          <li>deine letzten Werte im Rechner,</li>
          <li>
            dein Übungsdepot: Startguthaben, Positionen, virtuelle Käufe und Verkäufe, deine
            Notizen, zuletzt geladene Kurse und die Depotwerte über die Zeit.
          </li>
        </ul>
        <p>
          Die Zahlen aus dem Budgetplaner werden nicht gespeichert. Nichts davon wird an einen
          Server übertragen. Wenn du die Browserdaten löschst, sind auch Fortschritt und Depot weg.
        </p>
        <DataRequestsNote />
        <StorageNotice />
      </InfoSection>

      <InfoSection id="depot" title="Übungsdepot: Kurse und Hinweise" icon={ChartPie}>
        <DepotDataInfo />
      </InfoSection>

      <InfoSection id="zuruecksetzen" title="Lernfortschritt zurücksetzen" icon={Trash2}>
        <ResetProgress />
      </InfoSection>

      <InfoSection id="depot-zuruecksetzen" title="Übungsdepot zurücksetzen" icon={Trash2}>
        <DepotReset />
      </InfoSection>

      <InfoSection id="quellen" title="Quellen zum Weiterlesen" icon={Library}>
        <p>
          Gesetze und Förderungen ändern sich. Prüfe aktuelle Beträge und Regeln immer bei
          offiziellen oder unabhängigen Stellen:
        </p>
        <ul className="space-y-3">
          {infoSources.map((source) => (
            <li key={source.url}>
              <ExternalLink href={source.url}>{source.label}</ExternalLink>
              <p className="text-muted-foreground">{source.description}</p>
            </li>
          ))}
        </ul>
      </InfoSection>

      <InfoSection id="grenzen" title="Grenzen der App" icon={Database}>
        <ul className="list-disc space-y-1 pl-5">
          <li>Alle Rechnungen sind Beispiele mit festen Annahmen und keine Prognosen.</li>
          <li>Steuern, Kosten, Gebühren und Inflation werden im Rechner nicht berücksichtigt.</li>
          <li>
            Gesetze, Förderungen und Beträge haben den Stand {SITE.contentReviewedAt} und können
            sich jederzeit ändern.
          </li>
          <li>Die Inhalte ersetzen keine persönliche Beratung.</li>
          <li>
            Das Übungsdepot ist eine Simulation: Gebühren, Steuern, Kursspannen (Spreads) und die
            echte Ausführung einer Order werden nicht abgebildet.
          </li>
          <li>
            {isDemoMode()
              ? "Das Übungsdepot zeigt fiktive Wertpapiere mit Beispielkursen, keine echten Börsenkurse."
              : "Kurse im Übungsdepot sind je nach Anbieter verzögert oder Schlusskurse und können von handelbaren Kursen abweichen."}
          </li>
          <li>Das Übungsdepot unterstützt nur Wertpapiere, die in Euro notieren.</li>
        </ul>
      </InfoSection>
    </div>
  );
}
