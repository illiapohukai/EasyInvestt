import { Info } from "lucide-react";
import { SITE } from "@/config/site";
import { cn } from "@/lib/utils";

interface DisclaimerProps {
  className?: string;
  /** Additional sentence shown after the standard disclaimer. */
  extra?: string;
}

/** The standard educational disclaimer. */
export function Disclaimer({ className, extra }: DisclaimerProps) {
  return (
    <p
      className={cn(
        "flex gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground",
        className,
      )}
    >
      <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-foreground" />
      <span>
        <strong className="font-semibold text-foreground">{SITE.disclaimer}</strong>
        {extra ? ` ${extra}` : null}
      </span>
    </p>
  );
}
