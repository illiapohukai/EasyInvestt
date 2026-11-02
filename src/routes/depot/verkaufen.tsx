import { createFileRoute } from "@tanstack/react-router";
import { SellFlow } from "@/components/depot/SellFlow";
import { SITE } from "@/config/site";
import { validateInstrumentSearch } from "@/lib/depot/search-params";

export const Route = createFileRoute("/depot/verkaufen")({
  validateSearch: validateInstrumentSearch,
  head: () => ({
    meta: [
      { title: `Virtuell verkaufen – Übungsdepot – ${SITE.name}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SellPage,
});

function SellPage() {
  const { id } = Route.useSearch();
  return <SellFlow instrumentId={id} />;
}
