/** Placeholder while browser-only portfolio data loads. */
export function DepotSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4">
      <p className="sr-only" role="status">
        Übungsdepot wird geladen …
      </p>
      <div aria-hidden="true" className="h-56 rounded-2xl bg-muted" />
      <div aria-hidden="true" className="h-12 rounded-lg bg-muted" />
      <div aria-hidden="true" className="h-32 rounded-xl bg-muted" />
    </div>
  );
}
