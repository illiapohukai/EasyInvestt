import { Hourglass, Landmark, Layers, Lightbulb, PiggyBank, TrendingUp } from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { LessonIconName } from "@/content/types";

const ICONS = {
  lightbulb: Lightbulb,
  "trending-up": TrendingUp,
  layers: Layers,
  "piggy-bank": PiggyBank,
  hourglass: Hourglass,
  landmark: Landmark,
} as const satisfies Record<LessonIconName, unknown>;

export function LessonIcon({ name, ...props }: { name: LessonIconName } & LucideProps) {
  const Icon = ICONS[name];
  return <Icon aria-hidden="true" {...props} />;
}
