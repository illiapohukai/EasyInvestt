import { createFileRoute } from "@tanstack/react-router";
import { NotFoundPage } from "@/components/layout/NotFoundPage";
import { SITE } from "@/config/site";

/**
 * Catch-all route for unknown URLs.
 * It is also used to render the static 404.html shell (see vite.config.ts), so
 * static hosts like GitHub Pages can show a friendly page for any unknown path.
 */
export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: `Seite nicht gefunden – ${SITE.name}` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotFoundPage,
});
