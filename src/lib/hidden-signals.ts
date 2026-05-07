import { formatDistanceToNow, parseISO } from "date-fns";
import type { DiscoveryOriginType, DiscoverySource, HiddenSignal, HiddenSignalSeverity, Opportunity } from "../types";
import { haversineDistance } from "./geo";

export type HiddenSignalFeedKind = "signal" | "opportunity";
export type HiddenSignalFeedCategory = "vacancy" | "code_violation" | "distressed_owner" | "hot_zone" | "other";

export interface HiddenSignalFeedItem {
  id: string;
  kind: HiddenSignalFeedKind;
  category: HiddenSignalFeedCategory;
  categoryLabel: string;
  propertyAddress: string;
  sourceLabel: string;
  signalLabel: string;
  summary?: string;
  tags: string[];
  metaLabel?: string;
  score: number;
  lat?: number;
  lng?: number;
  signal?: HiddenSignal;
  opportunity?: Opportunity;
}

export interface HiddenSignalFeedGroup {
  key: HiddenSignalFeedCategory;
  label: string;
  description: string;
  items: HiddenSignalFeedItem[];
  score: number;
}

export interface HiddenSignalFeedFilters {
  kinds: HiddenSignalFeedKind[];
  categories: HiddenSignalFeedCategory[];
}

export const DEFAULT_HIDDEN_SIGNAL_FEED_FILTERS: HiddenSignalFeedFilters = {
  kinds: ["signal", "opportunity"],
  categories: ["vacancy", "code_violation", "distressed_owner", "hot_zone", "other"],
};

export function filterHiddenSignalFeedGroups(
  groups: HiddenSignalFeedGroup[],
  filters: HiddenSignalFeedFilters,
) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => filters.kinds.includes(item.kind) && filters.categories.includes(group.key)),
    }))
    .filter((group) => group.items.length > 0);
}

export interface HiddenSignalDraft {
  propertyAddress: string;
  tags?: string[];
  notes?: string;
  source?: DiscoverySource;
  originType: DiscoveryOriginType;
  originId?: string;
  signalType: string;
  title: string;
  description: string;
  severity: HiddenSignalSeverity;
  lat?: number;
  lng?: number;
  geohash?: string;
}

const CATEGORY_LABELS: Record<HiddenSignalFeedCategory, { label: string; description: string }> = {
  vacancy: {
    label: "Vacancy / abandonment",
    description: "Likely vacant, boarded up, or neglected properties.",
  },
  code_violation: {
    label: "Code violations / maintenance",
    description: "Complaints, citations, and visible upkeep issues.",
  },
  distressed_owner: {
    label: "Distressed owner activity",
    description: "Probate, tax, foreclosure, or absentee-owner pressure.",
  },
  hot_zone: {
    label: "Nearby cluster / hot zone",
    description: "Multiple nearby signals that warrant a map-first pass.",
  },
  other: {
    label: "Other useful signals",
    description: "Interesting records that do not fit a stronger pattern.",
  },
};

const VACANCY_TERMS = ["vacant", "vacancy", "abandoned", "abandon", "boarded", "board up", "overgrown", "empty", "unoccupied"];
const CODE_TERMS = ["code violation", "311", "complaint", "citation", "enforcement", "repair", "broken", "unsafe", "trash", "litter", "tall weeds", "maintenance"];
const DISTRESS_TERMS = ["probate", "estate", "inherit", "inherited", "tax delinquent", "foreclosure", "absentee", "absent owner", "owner occupied", "landlord"];

function normalizeText(value?: string | string[] | null) {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(" ").toLowerCase();
  return value.toLowerCase();
}

function severityScore(severity?: HiddenSignalSeverity) {
  switch (severity) {
    case "critical":
      return 95;
    case "high":
      return 78;
    case "medium":
      return 58;
    case "low":
    default:
      return 38;
  }
}

function categoryScore(category: HiddenSignalFeedCategory) {
  switch (category) {
    case "hot_zone":
      return 24;
    case "distressed_owner":
      return 18;
    case "code_violation":
      return 14;
    case "vacancy":
      return 16;
    case "other":
    default:
      return 8;
  }
}

function classifyTextCategory(text: string): HiddenSignalFeedCategory {
  if (VACANCY_TERMS.some((term) => text.includes(term))) return "vacancy";
  if (CODE_TERMS.some((term) => text.includes(term))) return "code_violation";
  if (DISTRESS_TERMS.some((term) => text.includes(term))) return "distressed_owner";
  return "other";
}

function severityFromOpportunityScore(score?: number): HiddenSignalSeverity {
  if ((score ?? 0) >= 90) return "critical";
  if ((score ?? 0) >= 75) return "high";
  if ((score ?? 0) >= 55) return "medium";
  return "low";
}

function formatSourceLabel(source?: DiscoverySource, signalType?: string) {
  if (signalType) {
    return signalType
      .split(/[_\-\s]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  switch (source) {
    case "public_data":
      return "Public Data";
    case "csv":
      return "CSV Import";
    case "map":
      return "Map Discovery";
    case "signal":
      return "Hidden Signal";
    case "lead":
      return "Lead Record";
    case "opportunity":
      return "Opportunity";
    default:
      return "Manual";
  }
}

function makeCategoryLabel(category: HiddenSignalFeedCategory) {
  return CATEGORY_LABELS[category].label;
}

function makeSummaryFromText(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" · ");
}

function makeSignalLabel(category: HiddenSignalFeedCategory, severity: HiddenSignalSeverity, nearbyCount: number) {
  if (category === "hot_zone") {
    return `${nearbyCount + 1} nearby matches`;
  }

  const severityLabel = severity.charAt(0).toUpperCase() + severity.slice(1);
  return `${severityLabel} signal`;
}

function countNearbyMatches(items: Array<Pick<HiddenSignalFeedItem, "lat" | "lng">>, index: number) {
  const current = items[index];
  if (current.lat === undefined || current.lng === undefined) return 0;

  return items.filter((candidate, candidateIndex) => {
    if (candidateIndex === index) return false;
    if (candidate.lat === undefined || candidate.lng === undefined) return false;
    return haversineDistance([current.lat!, current.lng!], [candidate.lat!, candidate.lng!]) <= 0.75;
  }).length;
}

function toSignalCategory(signal: HiddenSignal, nearbyCount: number): HiddenSignalFeedCategory {
  if (nearbyCount >= 2) return "hot_zone";

  const text = normalizeText([signal.title, signal.description, signal.notes, signal.tags.join(" "), signal.signalType]);
  return classifyTextCategory(text);
}

function toOpportunityCategory(opportunity: Opportunity, nearbyCount: number): HiddenSignalFeedCategory {
  if (nearbyCount >= 2) return "hot_zone";

  const text = normalizeText([opportunity.propertyAddress, opportunity.notes, opportunity.tags.join(" "), opportunity.source]);
  return classifyTextCategory(text);
}

export function classifyHiddenSignalDraft(opportunity: Opportunity): HiddenSignalDraft {
  const text = normalizeText([opportunity.propertyAddress, opportunity.notes, opportunity.tags.join(" "), opportunity.source]);
  const category = classifyTextCategory(text);
  const score = severityFromOpportunityScore(opportunity.opportunityScore);
  const source = opportunity.source || "public_data";

  return {
    propertyAddress: opportunity.propertyAddress,
    tags: opportunity.tags || [],
    notes: opportunity.notes || "",
    source,
    originType: "opportunity",
    originId: opportunity.id,
    signalType: category,
    title: CATEGORY_LABELS[category].label,
    description: opportunity.notes || `Captured from ${formatSourceLabel(source)}`,
    severity: score,
    lat: opportunity.lat,
    lng: opportunity.lng,
    geohash: opportunity.geohash,
  };
}

export function buildHiddenSignalFeed(hiddenSignals: HiddenSignal[], opportunities: Opportunity[]) {
  const rawItems: HiddenSignalFeedItem[] = hiddenSignals.length > 0
    ? hiddenSignals.map((signal) => ({
        id: signal.id,
        kind: "signal" as const,
        category: "other" as HiddenSignalFeedCategory,
        categoryLabel: "",
        propertyAddress: signal.propertyAddress,
        sourceLabel: formatSourceLabel(signal.source, signal.signalType),
        signalLabel: makeSignalLabel("other", signal.severity, 0),
        summary: makeSummaryFromText(signal.description, signal.notes),
        tags: signal.tags || [],
        metaLabel: `Detected ${formatDistanceToNow(parseISO(signal.detectedAt), { addSuffix: true })}`,
        score: severityScore(signal.severity) + (signal.tags?.length ? 5 : 0),
        lat: signal.lat,
        lng: signal.lng,
        signal,
      }))
    : opportunities.map((opportunity) => ({
        id: opportunity.id,
        kind: "opportunity" as const,
        category: "other" as HiddenSignalFeedCategory,
        categoryLabel: "",
        propertyAddress: opportunity.propertyAddress,
        sourceLabel: formatSourceLabel(opportunity.source),
        signalLabel: `Score: ${opportunity.opportunityScore}`,
        summary: opportunity.notes || undefined,
        tags: opportunity.tags || [],
        metaLabel: `Saved ${formatDistanceToNow(parseISO(opportunity.savedAt), { addSuffix: true })}`,
        score: opportunity.opportunityScore,
        lat: opportunity.lat,
        lng: opportunity.lng,
        opportunity,
      }));

  const withNearbyCounts = rawItems.map((item, index, allItems) => {
    const nearbyCount = countNearbyMatches(allItems, index);
    const sourceRecord = item.kind === "signal" ? item.signal : item.opportunity;
    const category = item.kind === "signal"
      ? toSignalCategory(item.signal!, nearbyCount)
      : toOpportunityCategory(item.opportunity!, nearbyCount);
    const severity = item.kind === "signal" ? item.signal!.severity : severityFromOpportunityScore(item.opportunity!.opportunityScore);
    const finalScore = item.score + categoryScore(category) + nearbyCount * 4 + (sourceRecord?.tags?.length ? 4 : 0);

    return {
      ...item,
      category,
      categoryLabel: makeCategoryLabel(category),
      signalLabel: makeSignalLabel(category, severity, nearbyCount),
      summary: item.summary || (item.kind === "signal" ? item.signal?.notes || item.signal?.description : item.opportunity?.notes),
      score: finalScore,
      metaLabel:
        category === "hot_zone" && nearbyCount > 0
          ? `${nearbyCount + 1} nearby matches within 0.75 mi`
          : item.metaLabel,
    } satisfies HiddenSignalFeedItem;
  });

  const groups = withNearbyCounts.reduce<Map<HiddenSignalFeedCategory, HiddenSignalFeedItem[]>>((acc, item) => {
    const bucket = acc.get(item.category) || [];
    bucket.push(item);
    acc.set(item.category, bucket);
    return acc;
  }, new Map());

  return Array.from(groups.entries())
    .map(([key, items]) => {
      const sortedItems = items.sort((a, b) => b.score - a.score || (b.metaLabel || "").localeCompare(a.metaLabel || ""));
      const meta = CATEGORY_LABELS[key];
      return {
        key,
        label: meta.label,
        description: meta.description,
        items: sortedItems,
        score: sortedItems[0]?.score || 0,
      } satisfies HiddenSignalFeedGroup;
    })
    .sort((a, b) => b.score - a.score || b.items.length - a.items.length);
}
