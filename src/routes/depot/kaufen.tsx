import { createFileRoute } from "@tanstack/react-router";
import { BuyFlow } from "@/components/depot/BuyFlow";
import { SITE } from "@/config/site";
import { validateInstrumentSearch } from "@/lib/depot/search-params";

export const Route = createFileRoute("/depot/kaufen")({
  validateSearch: validateInstrumentSearch,
  head: () => ({
    meta: [
      { title: `Virtuell investieren – Übungsdepot – ${SITE.name}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BuyPage,
});

function BuyPage() {
  const { id } = Route.useSearch();
  return <BuyFlow instrumentId={id} />;
}
