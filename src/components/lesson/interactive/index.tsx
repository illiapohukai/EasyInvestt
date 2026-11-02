import type { InteractiveKind } from "@/content/types";
import { AssetClassExplorer } from "./AssetClassExplorer";
import { BudgetPlanner } from "./BudgetPlanner";
import { InflationExplorer } from "./InflationExplorer";
import { InterestComparison } from "./InterestComparison";
import { RetirementTimeline } from "./RetirementTimeline";
import { StateProgramList } from "./StateProgramList";

const COMPONENTS: Record<InteractiveKind, () => React.JSX.Element> = {
  inflation: InflationExplorer,
  "interest-steps": InterestComparison,
  "asset-classes": AssetClassExplorer,
  budget: BudgetPlanner,
  "retirement-timeline": RetirementTimeline,
  "state-programs": StateProgramList,
};

/** Renders the interactive element that belongs to a lesson. */
export function LessonInteractive({ kind }: { kind: InteractiveKind }) {
  const Component = COMPONENTS[kind];
  return <Component />;
}
