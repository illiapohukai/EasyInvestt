import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

/** Friendly "page not found" screen, used for unknown URLs and unknown lessons. */
export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-md py-12 text-center">
      <p className="text-sm font-semibold text-primary">Fehler 404</p>
      <h1 className="mt-2 text-2xl font-bold">Diese Seite gibt es nicht</h1>
      <p className="mt-2 text-muted-foreground">
        Vielleicht hat sich die Adresse geändert. Über die Startseite findest du alle Themen.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Zur Startseite</Link>
      </Button>
    </section>
  );
}
