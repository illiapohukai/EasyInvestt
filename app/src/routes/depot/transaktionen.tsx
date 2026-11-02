import { createFileRoute } from "@tanstack/react-router";
import { TransactionsPage } from "@/components/depot/TransactionsPage";
import { SITE } from "@/config/site";

export const Route = createFileRoute("/depot/transaktionen")({
  head: () => ({
    meta: [
      { title: `Transaktionen – Übungsdepot – ${SITE.name}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TransactionsPage,
});
