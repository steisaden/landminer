import { useMemo, useState } from "react";
import { AlertTriangle, Filter, MapPin, Sparkles } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { PropertySnapshotCard } from "./PropertySnapshotCard";
import {
  buildHiddenSignalFeed,
  DEFAULT_HIDDEN_SIGNAL_FEED_FILTERS,
  filterHiddenSignalFeedGroups,
  type HiddenSignalFeedFilters,
  type HiddenSignalFeedItem,
  type HiddenSignalFeedGroup,
  type HiddenSignalFeedKind,
} from "../../lib/hidden-signals";
import type { HiddenSignal, Opportunity } from "../../types";
import { cn } from "../../lib/utils";

interface HiddenSignalFeedProps {
  hiddenSignals: HiddenSignal[];
  opportunities: Opportunity[];
  compact?: boolean;
  className?: string;
  title?: string;
  description?: string;
  filters?: HiddenSignalFeedFilters;
  onFiltersChange?: (filters: HiddenSignalFeedFilters) => void;
  onSaveOpportunity?: (item: HiddenSignalFeedItem) => void;
  onConvertToLead?: (item: HiddenSignalFeedItem) => void;
  onInspect?: (item: HiddenSignalFeedItem) => void;
  onViewAll?: () => void;
}

const KIND_LABELS: Record<HiddenSignalFeedKind, string> = {
  signal: "Hidden signals",
  opportunity: "Opportunities",
};


function HiddenSignalFeedBody({
  groups,
  compact = false,
  filters,
  onFiltersChange,
  onSaveOpportunity,
  onConvertToLead,
  onInspect,
}: {
  groups: HiddenSignalFeedGroup[];
  compact?: boolean;
  filters?: HiddenSignalFeedFilters;
  onFiltersChange?: (filters: HiddenSignalFeedFilters) => void;
  onSaveOpportunity?: (item: HiddenSignalFeedItem) => void;
  onConvertToLead?: (item: HiddenSignalFeedItem) => void;
  onInspect?: (item: HiddenSignalFeedItem) => void;
}) {
  const [selectedKinds, setSelectedKinds] = useState<HiddenSignalFeedKind[]>(DEFAULT_HIDDEN_SIGNAL_FEED_FILTERS.kinds);
  const [selectedCategories, setSelectedCategories] = useState<HiddenSignalFeedGroup["key"][]>(DEFAULT_HIDDEN_SIGNAL_FEED_FILTERS.categories);

  const activeFilters = filters ?? {
    kinds: selectedKinds,
    categories: selectedCategories,
  };

  const updateFilters = (updater: (current: HiddenSignalFeedFilters) => HiddenSignalFeedFilters) => {
    const nextFilters = updater(activeFilters);

    if (onFiltersChange) {
      onFiltersChange(nextFilters);
      return;
    }

    setSelectedKinds(nextFilters.kinds);
    setSelectedCategories(nextFilters.categories);
  };

  const filteredGroups = useMemo(() => filterHiddenSignalFeedGroups(groups, activeFilters), [groups, activeFilters]);

  const activeFilterCount =
    (activeFilters.kinds.length === DEFAULT_HIDDEN_SIGNAL_FEED_FILTERS.kinds.length ? 0 : activeFilters.kinds.length) +
    (activeFilters.categories.length === DEFAULT_HIDDEN_SIGNAL_FEED_FILTERS.categories.length ? 0 : activeFilters.categories.length);
  const isDefaultFilters =
    activeFilters.kinds.length === DEFAULT_HIDDEN_SIGNAL_FEED_FILTERS.kinds.length &&
    activeFilters.categories.length === DEFAULT_HIDDEN_SIGNAL_FEED_FILTERS.categories.length;

  if (groups.length === 0) return null;

  const toggleKind = (kind: HiddenSignalFeedKind, checked: boolean) => {
    updateFilters((current) => ({
      ...current,
      kinds: checked
        ? current.kinds.includes(kind)
          ? current.kinds
          : [...current.kinds, kind]
        : current.kinds.filter((value) => value !== kind),
    }));
  };

  const toggleCategory = (category: HiddenSignalFeedGroup["key"], checked: boolean) => {
    updateFilters((current) => ({
      ...current,
      categories: checked
        ? current.categories.includes(category)
          ? current.categories
          : [...current.categories, category]
        : current.categories.filter((value) => value !== category),
    }));
  };

  const resetFilters = () => {
    updateFilters(() => DEFAULT_HIDDEN_SIGNAL_FEED_FILTERS);
  };

  const hasVisibleItems = filteredGroups.length > 0;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
            <Filter className="h-3.5 w-3.5" />
            Filters
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {isDefaultFilters ? "All" : activeFilterCount}
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Record type</DropdownMenuLabel>
              {DEFAULT_HIDDEN_SIGNAL_FEED_FILTERS.kinds.map((kind) => (
                <DropdownMenuCheckboxItem
                  key={kind}
                  checked={activeFilters.kinds.includes(kind)}
                  closeOnClick={false}
                  onCheckedChange={(checked) => toggleKind(kind, checked)}
                >
                  <span>{KIND_LABELS[kind]}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuLabel>Signal category</DropdownMenuLabel>
              {groups.map((group) => (
                <DropdownMenuCheckboxItem
                  key={group.key}
                  checked={activeFilters.categories.includes(group.key)}
                  closeOnClick={false}
                  onCheckedChange={(checked) => toggleCategory(group.key, checked)}
                >
                  <span>{group.label}</span>
                  <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[10px]">
                    {group.items.length}
                  </Badge>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={resetFilters} closeOnClick>
              Reset filters
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {activeFilters.kinds.map((kind) => (
            <span key={kind} className="rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-200">
              {KIND_LABELS[kind]}
            </span>
          ))}
          {activeFilters.categories.map((category) => {
            const group = groups.find((entry) => entry.key === category);
            return group ? (
              <span key={category} className="rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-200">
                {group.label}
              </span>
            ) : null;
          })}
        </div>
      </div>

      {!hasVisibleItems ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
          No signals match the selected filters.
        </div>
      ) : null}

      <div className="space-y-5">
        {filteredGroups.map((group) => {
          const items = group.items.slice(0, compact ? 2 : 3);

          return (
            <section key={group.key} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{group.label}</h3>
                  <p className="text-xs text-slate-500">{group.description}</p>
                </div>
                <Badge variant="outline" className="h-6 border-slate-200 bg-slate-50 text-slate-700">
                  {group.items.length} signals
                </Badge>
              </div>

              <div className={cn("grid gap-4", compact ? "lg:grid-cols-2" : "xl:grid-cols-3")}>
                {items.map((item) => {
                  const primaryAction =
                    item.kind === "signal" && onSaveOpportunity
                      ? {
                          label: "Save as Opportunity",
                          onClick: () => onSaveOpportunity(item),
                          icon: <Sparkles className="h-4 w-4" />,
                        }
                      : onConvertToLead
                        ? {
                            label: "Convert to Lead",
                            onClick: () => onConvertToLead(item),
                            icon: <AlertTriangle className="h-4 w-4" />,
                          }
                        : {
                            label: "Inspect on Map",
                            onClick: () => onInspect?.(item),
                            icon: <MapPin className="h-4 w-4" />,
                          };

                  const secondaryAction =
                    item.kind === "signal" && onConvertToLead
                      ? {
                          label: "Convert to Lead",
                          variant: "outline" as const,
                          onClick: () => onConvertToLead(item),
                          icon: <AlertTriangle className="h-4 w-4" />,
                        }
                      : onInspect
                        ? {
                            label: "Inspect on Map",
                            variant: "outline" as const,
                            onClick: () => onInspect(item),
                            icon: <MapPin className="h-4 w-4" />,
                          }
                        : undefined;

                  return (
                    <PropertySnapshotCard
                      key={item.id}
                      tone={item.category === "distressed_owner" ? "lead" : item.category === "hot_zone" ? "opportunity" : "neutral"}
                      className="h-full"
                      address={item.propertyAddress}
                      sourceLabel={item.sourceLabel}
                      signalLabel={item.signalLabel}
                      summary={item.summary}
                      tags={item.tags}
                      metaLabel={item.metaLabel}
                      primaryAction={primaryAction}
                      secondaryAction={secondaryAction}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

export function HiddenSignalFeed({
  hiddenSignals,
  opportunities,
  compact = false,
  className,
  title = "Hidden Signal Feed",
  description = "Ranked civic and public-data signals, grouped by pattern instead of raw recency.",
  filters,
  onFiltersChange,
  onSaveOpportunity,
  onConvertToLead,
  onInspect,
  onViewAll,
}: HiddenSignalFeedProps) {
  const groups = useMemo(() => buildHiddenSignalFeed(hiddenSignals, opportunities), [hiddenSignals, opportunities]);
  const totalItems = groups.reduce((sum, group) => sum + group.items.length, 0);
  const hotZoneCount = groups.find((group) => group.key === "hot_zone")?.items.length || 0;

  return (
    <Card className={cn("overflow-hidden border-slate-200 shadow-sm", className)}>
      <CardContent className="p-0">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{title}</h2>
                  <p className="text-sm text-slate-500">{description}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                <span className="rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-200">{totalItems} ranked items</span>
                <span className="rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-200">{groups.length} pattern groups</span>
                <span className="rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-200">{hotZoneCount} hot-zone matches</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {onViewAll ? (
                <Button type="button" variant="outline" size="sm" onClick={onViewAll} className="h-8 gap-2">
                  View all
                  <MapPin className="h-3.5 w-3.5" />
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <CardContent className="space-y-5 p-5">
          {groups.length > 0 ? (
            <HiddenSignalFeedBody
              groups={groups}
              filters={filters}
              onFiltersChange={onFiltersChange}
              compact={compact}
              onSaveOpportunity={onSaveOpportunity}
              onConvertToLead={onConvertToLead}
              onInspect={onInspect}
            />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <p className="font-semibold text-slate-800">No hidden signals yet</p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Scan civic data or review public records to populate the ranked feed.
              </p>
            </div>
          )}
        </CardContent>
      </CardContent>
    </Card>
  );
}
