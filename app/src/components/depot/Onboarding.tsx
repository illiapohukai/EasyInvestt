import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeEuro,
  ChartNoAxesCombined,
  CircleCheck,
  Clock,
  Layers,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMarketData } from "@/config/market-data";
import { formatCents } from "@/lib/format";
import { depotStore } from "@/lib/depot/store";
import { DEFAULT_PORTFOLIO_NAME, STARTING_CASH_PRESETS_CENTS } from "@/lib/depot/types";
import { cn } from "@/lib/utils";
import { DepotDisclaimer, DemoDataNotice } from "./DepotNotices";
import { StepIndicator } from "./StepIndicator";

const STEPS = ["Simulation", "Startguthaben", "Wichtig zu wissen", "Depot anlegen"] as const;

function Point({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Clock;
  title: string;
  children: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold">{title}</span>
        <span className="block text-[0.9375rem] text-muted-foreground">{children}</span>
      </span>
    </li>
  );
}

/** Four short steps before the first practice portfolio is created. */
export function Onboarding({ readOnly }: { readOnly: boolean }) {
  const [step, setStep] = useState(0);
  const [cash, setCash] = useState<number>(STARTING_CASH_PRESETS_CENTS[0]);
  const [name, setName] = useState(DEFAULT_PORTFOLIO_NAME);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const nameId = useId();
  const demo = getMarketData().provider.mode === "demo";

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  function create() {
    const { provider } = getMarketData();
    depotStore.createPortfolio({
      name,
      startingCashCents: cash,
      providerId: provider.info.id,
      dataMode: provider.mode,
    });
  }

  const back =
    step > 0 ? (
      <Button variant="ghost" onClick={() => setStep(step - 1)}>
        <ArrowLeft aria-hidden="true" />
        Zurück
      </Button>
    ) : null;

  return (
    <section
      aria-labelledby="onboarding-titel"
      className="surface mx-auto max-w-2xl space-y-5 p-5 sm:p-6"
    >
      <StepIndicator step={step + 1} total={STEPS.length} label={STEPS[step] ?? ""} />

      {step === 0 ? (
        <>
          <h2
            id="onboarding-titel"
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-bold outline-none"
          >
            Starte dein Übungsdepot
          </h2>
          <p className="text-[1.0625rem] text-muted-foreground">
            Hier probierst du aus, wie Kaufen und Verkaufen von Wertpapieren funktioniert – mit
            virtuellem Geld.
          </p>
          <ul className="space-y-4">
            <Point icon={ShieldCheck} title="Nur eine Simulation">
              Du zahlst kein echtes Geld ein. Es werden keine echten Orders ausgeführt und kein
              Konto eröffnet.
            </Point>
            <Point icon={BadgeEuro} title="Virtuelles Startguthaben">
              Du bekommst einmalig Spielgeld. Gewinne und Verluste sind nur Zahlen auf deinem Gerät.
            </Point>
            <Point icon={Sparkles} title="Ohne Anmeldung">
              Das Depot wird nur im Browser auf diesem Gerät gespeichert.
            </Point>
          </ul>
          <Button size="lg" className="w-full sm:w-auto" onClick={() => setStep(1)}>
            Weiter
            <ArrowRight aria-hidden="true" />
          </Button>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <h2
            id="onboarding-titel"
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-bold outline-none"
          >
            Wähle dein virtuelles Startguthaben
          </h2>
          <fieldset className="min-w-0 space-y-2">
            <legend className="mb-2 text-[0.9375rem] text-muted-foreground">
              Mit diesem Betrag startest du. Später kommt kein Geld dazu – so bleibt deine
              Entwicklung vergleichbar.
            </legend>
            {STARTING_CASH_PRESETS_CENTS.map((cents) => (
              <label
                key={cents}
                className={cn(
                  "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                  cash === cents
                    ? "border-primary bg-primary-soft"
                    : "border-input bg-card hover:bg-muted",
                )}
              >
                <input
                  type="radio"
                  name="startguthaben"
                  value={cents}
                  checked={cash === cents}
                  onChange={() => setCash(cents)}
                  className="size-5 accent-[var(--primary)]"
                />
                <span className="text-lg font-bold tabular-nums">
                  {formatCents(cents).replace(",00", "")}
                </span>
                {cents === STARTING_CASH_PRESETS_CENTS[0] ? (
                  <span className="text-sm text-muted-foreground">gut für den Anfang</span>
                ) : null}
              </label>
            ))}
          </fieldset>
          <div className="flex flex-wrap gap-2">
            {back}
            <Button size="lg" onClick={() => setStep(2)}>
              Weiter
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <h2
            id="onboarding-titel"
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-bold outline-none"
          >
            Bevor du startest
          </h2>
          <ul className="space-y-4">
            <Point icon={ChartNoAxesCombined} title="Kurse steigen und fallen">
              Der Wert deiner Wertpapiere schwankt. Auch Verluste gehören zum Üben dazu.
            </Point>
            <Point icon={Layers} title="Streuung ist wichtig">
              Wer sein Geld auf viele Unternehmen verteilt, ist weniger von einem einzelnen
              abhängig.
            </Point>
            <Point
              icon={Clock}
              title={demo ? "Beispieldaten statt Marktdaten" : "Kurse können verzögert sein"}
            >
              {demo
                ? "In dieser Version sind alle Wertpapiere und Kurse erfunden. Sie zeigen, wie ein Depot funktioniert – nicht, was echte Wertpapiere kosten."
                : "Je nach Börse und Datenanbieter sind Kurse verzögert oder Schlusskurse. Jeder Kurs zeigt Status und Uhrzeit."}
            </Point>
            <Point icon={ShieldCheck} title="Keine Anlageberatung">
              Ergebnisse der Simulation sind keine Empfehlung und keine Vorhersage für echte
              Geldanlagen.
            </Point>
          </ul>
          <div className="flex flex-wrap gap-2">
            {back}
            <Button size="lg" onClick={() => setStep(3)}>
              Verstanden
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <h2
            id="onboarding-titel"
            ref={headingRef}
            tabIndex={-1}
            className="text-2xl font-bold outline-none"
          >
            Depot anlegen
          </h2>
          <div className="space-y-1.5">
            <label htmlFor={nameId} className="block font-semibold">
              Name deines Depots
            </label>
            <input
              id={nameId}
              type="text"
              value={name}
              maxLength={40}
              onChange={(event) => setName(event.target.value)}
              className="min-h-12 w-full rounded-lg border border-input bg-card px-3 text-base"
            />
          </div>
          <dl className="space-y-1 rounded-xl bg-muted p-4 text-[0.9375rem]">
            <div className="flex flex-wrap justify-between gap-x-3">
              <dt>Virtuelles Startguthaben</dt>
              <dd className="font-semibold tabular-nums">{formatCents(cash)}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-x-3">
              <dt>Kurse</dt>
              <dd className="font-semibold">
                {demo ? "Beispieldaten" : getMarketData().provider.info.name}
              </dd>
            </div>
            <div className="flex flex-wrap justify-between gap-x-3">
              <dt>Gespeichert</dt>
              <dd className="font-semibold">nur auf diesem Gerät</dd>
            </div>
          </dl>
          <DemoDataNotice compact />
          <div className="flex flex-wrap gap-2">
            {back}
            <Button size="lg" onClick={create} disabled={readOnly}>
              <CircleCheck aria-hidden="true" />
              Übungsdepot anlegen
            </Button>
          </div>
          <DepotDisclaimer />
        </>
      ) : null}
    </section>
  );
}
