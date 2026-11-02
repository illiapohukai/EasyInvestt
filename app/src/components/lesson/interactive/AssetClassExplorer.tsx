import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  assetClasses,
  RISK_LABELS,
  type AssetClass,
  type RiskLevel,
} from "@/content/asset-classes";
import { cn } from "@/lib/utils";

/** Five-step risk scale. The level is always written out, not only shown as colour. */
export function RiskMeter({ level, note }: { level: RiskLevel; note?: string | undefined }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <span aria-hidden="true" className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((step) => (
          <span
            key={step}
            className={cn(
              "h-2.5 w-4 rounded-sm",
              step <= level ? (level >= 4 ? "bg-warning" : "bg-primary") : "bg-muted",
            )}
          />
        ))}
      </span>
      <span>
        Risiko: <span className="font-semibold">{RISK_LABELS[level]}</span>
        {note ? <span className="text-muted-foreground"> ({note})</span> : null}
      </span>
    </span>
  );
}

function AssetClassCard({
  asset,
  open,
  onToggle,
}: {
  asset: AssetClass;
  open: boolean;
  onToggle: () => void;
}) {
  const id = useId();
  const panelId = `${id}-panel`;
  const facts = [
    { label: "Schwankung", text: asset.fluctuation },
    { label: "Zugang", text: asset.accessibility },
    { label: "Verfügbarkeit", text: asset.liquidity },
    { label: "Für Einsteiger", text: asset.beginnerNote },
  ];

  return (
    <li className="rounded-xl border border-border bg-card">
      <h3 className="text-base">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-start gap-3 rounded-xl p-4 text-left hover:bg-muted/60"
        >
          <span className="min-w-0 flex-1 space-y-1">
            <span className="block font-semibold">{asset.name}</span>
            <span className="block text-[0.9375rem] font-normal text-muted-foreground">
              {asset.summary}
            </span>
            <span className="block font-normal">
              <RiskMeter level={asset.risk} note={asset.riskNote} />
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "mt-0.5 size-5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </h3>
      <div id={panelId} hidden={!open} className="border-t border-border px-4 pt-3 pb-4">
        <dl className="space-y-2.5">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-sm font-semibold">{fact.label}</dt>
              <dd className="text-[0.9375rem] text-foreground/90">{fact.text}</dd>
            </div>
          ))}
        </dl>
        {asset.details.length > 0 ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-[0.9375rem] text-foreground/90">
            {asset.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}

/** Expandable comparison of asset classes. */
export function AssetClassExplorer() {
  const [openIds, setOpenIds] = useState<string[]>([]);

  function toggle(id: string) {
    setOpenIds((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2.5">
        {assetClasses.map((asset) => (
          <AssetClassCard
            key={asset.id}
            asset={asset}
            open={openIds.includes(asset.id)}
            onToggle={() => toggle(asset.id)}
          />
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        Die Risikostufen sind grobe Einordnungen zum Lernen, keine gemessenen Werte und keine
        Empfehlung.
      </p>
    </div>
  );
}
