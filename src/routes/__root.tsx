import type { ReactNode } from "react";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { SITE } from "@/config/site";
import { AppShell } from "@/components/layout/AppShell";
import { NotFoundPage } from "@/components/layout/NotFoundPage";
import { Button } from "@/components/ui/button";

const base = import.meta.env.BASE_URL;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: `${SITE.name} – ${SITE.tagline}` },
      { name: "description", content: SITE.description },
      { name: "theme-color", content: "#f6f6f3" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE.name },
      { property: "og:locale", content: "de_DE" },
      { property: "og:title", content: `${SITE.name} – ${SITE.tagline}` },
      { property: "og:description", content: SITE.description },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: `${base}favicon.svg`, type: "image/svg+xml" },
      { rel: "icon", href: `${base}favicon.ico`, sizes: "32x32" },
      { rel: "apple-touch-icon", href: `${base}apple-touch-icon.png` },
      { rel: "manifest", href: `${base}manifest.webmanifest` },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
  notFoundComponent: NotFoundPage,
  errorComponent: RootError,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function RootError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  if (import.meta.env.DEV) console.error(error);
  return (
    <AppShell>
      <section className="mx-auto max-w-md py-12 text-center">
        <h1 className="text-2xl font-bold">Die Seite konnte nicht geladen werden</h1>
        <p className="mt-2 text-muted-foreground">
          Bitte versuche es noch einmal. Dein gespeicherter Fortschritt bleibt erhalten.
        </p>
        <Button
          className="mt-6"
          onClick={() => {
            reset();
            void router.invalidate();
          }}
        >
          Nochmal versuchen
        </Button>
      </section>
    </AppShell>
  );
}
