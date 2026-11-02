import { Link, useMatchRoute } from "@tanstack/react-router";
import { primaryNavigation, type NavItem } from "@/config/navigation";

/** Marks a destination as active for its additional routes (e.g. /rechner under "Mehr"). */
function useExtraActive() {
  const matchRoute = useMatchRoute();
  return (item: NavItem) =>
    (item.alsoActiveFor ?? []).some((to) => Boolean(matchRoute({ to, fuzzy: true })));
}

function extraActiveProps(active: boolean) {
  return active ? { "data-status": "active", "aria-current": "page" as const } : {};
}

/** Bottom tab bar for phones and small tablets. */
export function BottomNav() {
  const isExtraActive = useExtraActive();
  return (
    <nav
      aria-label="Hauptnavigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[var(--safe-bottom)] backdrop-blur supports-[backdrop-filter]:bg-card/85 md:hidden"
    >
      <ul className="mx-auto grid h-[var(--bottom-nav-height)] max-w-lg grid-cols-4 px-[var(--safe-left)]">
        {primaryNavigation.map((item) => {
          const { to, label, icon: Icon, exact } = item;
          return (
            <li key={to} className="flex">
              <Link
                to={to}
                activeOptions={{ exact: exact ?? false }}
                {...extraActiveProps(isExtraActive(item))}
                className="group flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:font-bold data-[status=active]:text-primary-strong"
              >
                <span className="flex h-7 w-14 items-center justify-center rounded-full transition-colors group-data-[status=active]:bg-primary-soft">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Horizontal navigation in the header on tablets and desktops. */
export function TopNav() {
  const isExtraActive = useExtraActive();
  return (
    <nav aria-label="Hauptnavigation" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {primaryNavigation.map((item) => {
          const { to, label, icon: Icon, exact } = item;
          return (
            <li key={to}>
              <Link
                to={to}
                activeOptions={{ exact: exact ?? false }}
                {...extraActiveProps(isExtraActive(item))}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3.5 text-[0.9375rem] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[status=active]:bg-primary-soft data-[status=active]:font-semibold data-[status=active]:text-primary-strong"
              >
                <Icon aria-hidden="true" className="size-[1.125rem]" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
