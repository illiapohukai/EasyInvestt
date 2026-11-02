import { createFileRoute } from "@tanstack/react-router";
import { CompoundCalculator } from "@/components/calculator/CompoundCalculator";
import { PageHeader } from "@/components/common/PageHeader";
import { SITE } from "@/config/site";
import { useHydrated } from "@/hooks/use-hydrated";
import { useProgress } from "@/hooks/use-progress";
import { DEFAULT_COMPOUND_INPUT } from "@/lib/finance/compound-interest";

export const Route = createFileRoute("/rechner")({
  head: () => ({
    meta: [
      { title: `Zinseszins-Rechner – ${SITE.name}` },
      {
        name: "description",
        content:
          "Rechne aus, wie Startbetrag, monatliche Sparrate, Rendite und Zeit zusammenwirken.",
      },
    ],
  }),
  component: CalculatorPage,
});

function CalculatorPage() {
  const hydrated = useHydrated();
  const progress = useProgress();
  const initial = hydrated
    ? (progress.calculator ?? DEFAULT_COMPOUND_INPUT)
    : DEFAULT_COMPOUND_INPUT;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Werkzeug"
        title="Zinseszins-Rechner"
        description="Probier aus, wie Startbetrag, Sparrate, Rendite und Zeit zusammenspielen. Deine letzten Werte bleiben auf diesem Gerät gespeichert."
      />
      {/* Remount once stored values are available in the browser. */}
      <CompoundCalculator key={hydrated ? "client" : "server"} initial={initial} />
    </div>
  );
}
