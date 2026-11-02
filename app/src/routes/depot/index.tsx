import { createFileRoute } from "@tanstack/react-router";
import { DepotOverview } from "@/components/depot/DepotOverview";
import { SITE } from "@/config/site";

export const Route = createFileRoute("/depot/")({
  head: () => ({
    meta: [
      { title: `Übungsdepot – ${SITE.name}` },
      {
        name: "description",
        content:
          "Virtuelles Übungsdepot: Wertpapiere mit Spielgeld kaufen und verkaufen, Gewinne, Verluste und Streuung verstehen. Nur zu Bildungszwecken.",
      },
    ],
  }),
  component: DepotOverview,
});
