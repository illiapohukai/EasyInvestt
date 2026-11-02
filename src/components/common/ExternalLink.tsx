import type { ReactNode } from "react";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "font-semibold text-primary underline underline-offset-4 hover:text-primary-strong",
        className,
      )}
    >
      {children}
      <ExternalLinkIcon
        aria-hidden="true"
        className="ml-1 inline-block size-3.5 align-[-0.125em]"
      />
      <span className="sr-only"> (öffnet in neuem Tab)</span>
    </a>
  );
}
