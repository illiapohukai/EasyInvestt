import { Link } from "@tanstack/react-router";
import { SITE } from "@/config/site";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="8" fill="var(--primary)" />
      <rect x="7" y="18" width="4.5" height="7" rx="1.5" fill="#fff" />
      <rect x="13.75" y="13" width="4.5" height="12" rx="1.5" fill="#fff" />
      <rect x="20.5" y="7" width="4.5" height="18" rx="1.5" fill="#fff" />
    </svg>
  );
}

export function Brand() {
  return (
    <Link
      to="/"
      className="inline-flex min-h-11 items-center gap-2.5 rounded-lg text-lg font-bold tracking-tight"
    >
      <BrandMark className="size-8" />
      <span>{SITE.name}</span>
    </Link>
  );
}
