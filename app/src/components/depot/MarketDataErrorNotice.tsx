import { RefreshCw, WifiOff } from "lucide-react";
import { Callout } from "@/components/common/Callout";
import { Button } from "@/components/ui/button";
import { describeMarketDataError, type MarketDataError } from "@/lib/market-data/errors";

/** Loading, rate-limit, provider, offline and unsupported states in one place. */
export function MarketDataErrorNotice({
  error,
  onRetry,
  context,
}: {
  error: MarketDataError;
  onRetry?: () => void;
  /** Optional sentence about what is shown instead. */
  context?: string;
}) {
  const { title, text } = describeMarketDataError(error);
  const retryable = error.kind !== "unsupported" && error.kind !== "not-found";
  return (
    <Callout
      tone={error.kind === "unsupported" || error.kind === "not-found" ? "info" : "warning"}
      title={title}
      {...(error.kind === "offline" ? { icon: WifiOff } : {})}
    >
      <p>{text}</p>
      {context ? <p className="mt-1">{context}</p> : null}
      {retryable && onRetry ? (
        <Button variant="secondary" size="sm" className="mt-2" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          Erneut versuchen
        </Button>
      ) : null}
    </Callout>
  );
}

export function LoadingLine({ children }: { children: string }) {
  return (
    <p role="status" className="flex items-center gap-2 text-[0.9375rem] text-muted-foreground">
      <span
        aria-hidden="true"
        className="size-4 animate-spin rounded-full border-2 border-muted border-t-primary"
      />
      {children}
    </p>
  );
}
