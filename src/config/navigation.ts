import { BookOpen, ChartPie, House, Menu, type LucideIcon } from "lucide-react";

export type PrimaryRoute = "/" | "/lernen" | "/depot" | "/mehr";

export interface NavItem {
  to: PrimaryRoute;
  label: string;
  icon: LucideIcon;
  /** Only mark as active on an exact URL match (used for the start page). */
  exact?: boolean;
  /** Further routes that belong to this destination (e.g. tools listed under "Mehr"). */
  alsoActiveFor?: readonly string[];
}

/**
 * Primary destinations, shown as bottom navigation on phones and as top
 * navigation on larger screens. Keep this list at four items.
 * The compound-interest calculator (/rechner) is a tool: it is linked from the
 * start page, the "Zinseszins" lesson and the tools section under "Mehr".
 */
export const primaryNavigation: readonly NavItem[] = [
  { to: "/", label: "Start", icon: House, exact: true },
  { to: "/lernen", label: "Lernen", icon: BookOpen },
  { to: "/depot", label: "Depot", icon: ChartPie },
  { to: "/mehr", label: "Mehr", icon: Menu, alsoActiveFor: ["/rechner"] },
];
