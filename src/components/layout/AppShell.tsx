import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SITE } from "@/config/site";
import { Brand } from "./Brand";
import { BottomNav, TopNav } from "./Navigation";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col pb-[calc(var(--bottom-nav-height)+var(--safe-bottom))] md:pb-0">
      <a
        href="#inhalt"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-3 focus:font-semibold focus:shadow-lg"
      >
        Zum Inhalt springen
      </a>

      <header className="z-30 border-b border-border bg-background/95 backdrop-blur md:sticky md:top-0">
        <div className="page-gutter mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 md:h-16">
          <Brand />
          <TopNav />
        </div>
      </header>

      <main
        id="inhalt"
        tabIndex={-1}
        className="page-gutter mx-auto w-full max-w-5xl flex-1 pt-5 pb-10 outline-none md:pt-10"
      >
        {children}
      </main>

      <footer className="border-t border-border">
        <div className="page-gutter mx-auto max-w-5xl space-y-1.5 py-6 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">{SITE.disclaimer}</p>
          <p>
            Inhaltlicher Stand: {SITE.contentReviewedAt}. Gesetze, Beträge und Förderungen können
            sich ändern.{" "}
            <Link to="/mehr" className="font-semibold text-primary underline underline-offset-4">
              Über Geldstart und Datenschutz
            </Link>
          </p>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
}
