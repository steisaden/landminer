export type LeadStatus =
  | "New Lead"
  | "Contacted"
  | "Follow-Up"
  | "Appointment Set"
  | "Offer Made"
  | "Under Contract"
  | "Dead Lead";

export type DiscoverySource =
  | "manual"
  | "csv"
  | "public_data"
  | "lead"
  | "signal"
  | "map"
  | "opportunity";

export type DiscoveryOriginType = "lead" | "opportunity" | "signal" | "map";

export type HiddenSignalStatus = "new" | "reviewed" | "promoted" | "dismissed";
export type HiddenSignalSeverity = "low" | "medium" | "high" | "critical";
export type OutreachDraftChannel = "sms" | "email" | "call" | "letter";
export type OutreachDraftStatus = "draft" | "queued" | "sent" | "archived";
export type OutreachDraftOriginType = "lead" | "signal";

export interface DiscoveryLocation {
  lat?: number;
  lng?: number;
  geohash?: string;
}

export interface DiscoveryRecordBase extends DiscoveryLocation {
  id: string;
  userId: string;
  propertyAddress: string;
  tags: string[];
  notes: string;
  source: DiscoverySource;
  originType: DiscoveryOriginType;
  originId?: string;
}

export interface PropertySnapshot extends DiscoveryRecordBase {
  capturedAt: string;
  title?: string;
  opportunityScore?: number;
  leadId?: string;
  opportunityId?: string;
}

export interface HiddenSignal extends DiscoveryRecordBase {
  detectedAt: string;
  signalType: string;
  title: string;
  description: string;
  severity: HiddenSignalSeverity;
  status: HiddenSignalStatus;
  snapshotId?: string;
  relatedLeadId?: string;
  relatedOpportunityId?: string;
  promotedOpportunityId?: string;
}

export interface OutreachDraft extends DiscoveryRecordBase {
  createdAt: string;
  updatedAt: string;
  channel: OutreachDraftChannel;
  status: OutreachDraftStatus;
  subject: string;
  message: string;
  originType: OutreachDraftOriginType;
  originId: string;
  leadId?: string;
  signalId?: string;
  scheduledAt?: string;
  sentAt?: string;
}

export interface FollowUpReminder {
  id: string;
  dueDate: string; // ISO string
  notes?: string;
  completed: boolean;
}

export type ActivityType = "note" | "status_change" | "call" | "text" | "meeting";

export interface Activity {
  id: string;
  leadId: string;
  type: ActivityType;
  content: string;
  timestamp: string; // ISO string
}

export interface AppDocument {
  id: string;
  userId: string;
  entityId: string; // ID of the lead, or "account" for account-level
  entityType: "lead" | "account";
  fileName: string;
  fileUrl: string; // e.g., standard placeholder or blob url
  fileType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface Lead {
  id: string;
  userId: string;
  sellerName: string;
  phone: string;
  propertyAddress: string;
  askingPrice: number | null;
  motivation: string;
  leadSource: string;
  status: LeadStatus;
  notes: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  followUps: FollowUpReminder[];
  activities: Activity[];
  
  // New fields
  lat?: number;
  lng?: number;
  geohash?: string;
  tags?: string[];
  opportunityScore?: number;
  source?: DiscoverySource;
  snapshotId?: string;
  signalId?: string;
}

export interface Opportunity {
  id: string;
  userId: string;
  propertyAddress: string;
  lat?: number;
  lng?: number;
  geohash?: string;
  tags: string[];
  opportunityScore: number;
  source: DiscoverySource; // can match Lead source if they want
  notes: string;
  savedAt: string;
  snapshotId?: string;
  signalId?: string;
}

