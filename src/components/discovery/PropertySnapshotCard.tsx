import type { MouseEvent, ReactNode } from "react";
import { Building, MapPin, Sparkles } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

export type PropertySnapshotTone = "lead" | "opportunity" | "neutral";

export interface PropertySnapshotAction {
  label: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  variant?: "default" | "outline" | "secondary";
  icon?: ReactNode;
}

export interface PropertySnapshotCardProps {
  address: string;
  sourceLabel: string;
  signalLabel: string;
  summary?: string;
  tags?: string[];
  metaLabel?: string;
  tone?: PropertySnapshotTone;
  primaryAction: PropertySnapshotAction;
  secondaryAction?: PropertySnapshotAction;
  className?: string;
}

const toneStyles: Record<
  PropertySnapshotTone,
  {
    header: string;
    sourceBadge: string;
    signal: string;
    tag: string;
    primary: string;
    secondary: string;
    icon: ReactNode;
  }
> = {
  lead: {
    header: "bg-gradient-to-r from-blue-600 to-indigo-600",
    sourceBadge: "bg-white/15 text-white border-white/20",
    signal: "text-white/85",
    tag: "border-blue-100 bg-blue-50 text-blue-700",
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "border-blue-200 bg-white text-blue-700 hover:bg-blue-50",
    icon: <MapPin className="h-4 w-4" />,
  },
  opportunity: {
    header: "bg-gradient-to-r from-emerald-600 to-teal-600",
    sourceBadge: "bg-white/15 text-white border-white/20",
    signal: "text-white/85",
    tag: "border-emerald-100 bg-emerald-50 text-emerald-700",
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white",
    secondary: "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50",
    icon: <Sparkles className="h-4 w-4" />,
  },
  neutral: {
    header: "bg-gradient-to-r from-slate-700 to-slate-900",
    sourceBadge: "bg-white/15 text-white border-white/20",
    signal: "text-white/85",
    tag: "border-slate-200 bg-slate-50 text-slate-700",
    primary: "bg-slate-700 hover:bg-slate-800 text-white",
    secondary: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    icon: <Building className="h-4 w-4" />,
  },
};

export function PropertySnapshotCard({
  address,
  sourceLabel,
  signalLabel,
  summary,
  tags = [],
  metaLabel,
  tone = "neutral",
  primaryAction,
  secondaryAction,
  className,
}: PropertySnapshotCardProps) {
  const styles = toneStyles[tone];
  const hasSecondaryAction = Boolean(secondaryAction);

  return (
    <Card className={cn("overflow-hidden border-slate-200 shadow-sm", className)}>
      <CardContent className="p-0">
        <div className={cn("px-4 py-3 text-white", styles.header)}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn("h-5 border px-2 text-[10px] font-semibold uppercase tracking-wide", styles.sourceBadge)}
                >
                  {sourceLabel}
                </Badge>
                <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide", styles.signal)}>
                  {styles.icon}
                  {signalLabel}
                </span>
              </div>
              <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">{address}</h3>
              {summary ? <p className="mt-1 line-clamp-2 text-xs text-white/85">{summary}</p> : null}
            </div>
            {metaLabel ? <span className="shrink-0 text-[11px] text-white/70">{metaLabel}</span> : null}
          </div>
        </div>

        <div className="space-y-3 bg-white p-4">
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className={cn("h-5 px-2 text-[10px] font-medium", styles.tag)}>
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className={cn("flex gap-2", hasSecondaryAction ? "flex-col sm:flex-row" : "") }>
            <Button
              type="button"
              variant={primaryAction.variant ?? "default"}
              onClick={(event) => {
                event.stopPropagation();
                primaryAction.onClick(event);
              }}
              disabled={primaryAction.disabled}
              className={cn("h-9 flex-1 text-xs font-medium shadow-sm", styles.primary)}
            >
              {primaryAction.icon}
              {primaryAction.label}
            </Button>

            {secondaryAction ? (
              <Button
                type="button"
                variant={secondaryAction.variant ?? "outline"}
                onClick={(event) => {
                  event.stopPropagation();
                  secondaryAction.onClick(event);
                }}
                disabled={secondaryAction.disabled}
                className={cn("h-9 flex-1 text-xs font-medium shadow-sm", styles.secondary)}
              >
                {secondaryAction.icon}
                {secondaryAction.label}
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
