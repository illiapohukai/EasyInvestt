import type { ReactNode } from "react";
import { AlertTriangle, CircleCheck, Info, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "info" | "warning" | "success" | "neutral";

const TONES: Record<Tone, { icon: LucideIcon; className: string; iconClass: string }> = {
  info: { icon: Info, className: "bg-info-soft border-[#c9dbef]", iconClass: "text-info" },
  warning: {
    icon: AlertTriangle,
    className: "bg-warning-soft border-[#f0d9bb]",
    iconClass: "text-warning",
  },
  success: {
    icon: CircleCheck,
    className: "bg-primary-soft border-[#c6e0d6]",
    iconClass: "text-primary",
  },
  neutral: { icon: Info, className: "bg-card border-border", iconClass: "text-muted-foreground" },
};

interface CalloutProps {
  tone?: Tone;
  title?: string;
  children: ReactNode;
  className?: string;
  icon?: LucideIcon;
}

export function Callout({ tone = "info", title, children, className, icon }: CalloutProps) {
  const config = TONES[tone];
  const Icon = icon ?? config.icon;
  return (
    <div className={cn("flex gap-3 rounded-xl border p-4", config.className, className)}>
      <Icon aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0", config.iconClass)} />
      <div className="min-w-0 space-y-1 text-[0.9375rem] leading-relaxed">
        {title ? <p className="font-semibold text-foreground">{title}</p> : null}
        <div className="text-foreground/90">{children}</div>
      </div>
    </div>
  );
}
