import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, className, children }: PageHeaderProps) {
  return (
    <header className={cn("space-y-2", className)}>
      {eyebrow ? (
        <p className="text-sm font-semibold tracking-wide text-primary">{eyebrow}</p>
      ) : null}
      <h1 className="text-[1.75rem] font-bold sm:text-4xl">{title}</h1>
      {description ? (
        <div className="prose-width text-[1.0625rem] text-muted-foreground">{description}</div>
      ) : null}
      {children}
    </header>
  );
}
