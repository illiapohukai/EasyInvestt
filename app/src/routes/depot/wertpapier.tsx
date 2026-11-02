import { createFileRoute } from "@tanstack/react-router";
import { InstrumentDetail } from "@/components/depot/InstrumentDetail";
import { SITE } from "@/config/site";
import { validateInstrumentSearch } from "@/lib/depot/search-params";

export const Route = createFileRoute("/depot/wertpapier")({
  validateSearch: validateInstrumentSearch,
  head: () => ({
    meta: [
      { title: `Wertpapier – Übungsdepot – ${SITE.name}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InstrumentPage,
});

function InstrumentPage() {
  const { id } = Route.useSearch();
  return <InstrumentDetail instrumentId={id} />;
}
