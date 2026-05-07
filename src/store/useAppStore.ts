import { create } from "zustand";
import {
  AppDocument,
  DiscoverySource,
  FollowUpReminder,
  HiddenSignal,
  HiddenSignalStatus,
  Lead,
  Opportunity,
  OutreachDraft,
  OutreachDraftChannel,
  OutreachDraftStatus,
  PropertySnapshot,
} from "../types";
import { v4 as uuidv4 } from "uuid";
import { doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db, userCollectionPath } from "../lib/firebase";
import { geocodeAddress } from "../lib/geocoding";
import { handleFirestoreError, OperationType } from "../lib/firestore-errors";

function stripUndefinedFields<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined)) as T;
}

type SavePropertySnapshotInput = Omit<
  PropertySnapshot,
  "id" | "userId" | "capturedAt" | "tags" | "notes" | "source"
> & {
  tags?: string[];
  notes?: string;
  source?: DiscoverySource;
};

type CreateHiddenSignalInput = Omit<
  HiddenSignal,
  "id" | "userId" | "detectedAt" | "status" | "promotedOpportunityId" | "tags" | "notes" | "source"
> & {
  tags?: string[];
  notes?: string;
  source?: DiscoverySource;
  status?: HiddenSignalStatus;
};

type CreateOutreachDraftInput =
  | {
      originType: "lead";
      lead: Lead;
      channel?: OutreachDraftChannel;
      subject?: string;
      message?: string;
      status?: OutreachDraftStatus;
      source?: DiscoverySource;
    }
  | {
      originType: "signal";
      signal: HiddenSignal;
      channel?: OutreachDraftChannel;
      subject?: string;
      message?: string;
      status?: OutreachDraftStatus;
      source?: DiscoverySource;
    };

export interface ApiKeys {
  gemini?: string;
  openai?: string;
  claude?: string;
  ollama?: string;
  qwen?: string;
  opencode?: string;
  openrouter?: string;
}

interface AppState {
  userId: string | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  isPro: boolean;
  businessName: string;
  focus: string;
  followUpStyle: string;
  cadence: string;
  apiKeys: ApiKeys;
  activeAiProvider: string;
  selectedModels: Record<string, string>;
  gettingStartedDismissed: boolean;
  setAuth: (auth: boolean, userId: string | null) => void;
  setProStatus: (status: boolean) => Promise<void>;
  setOnboardingData: (data: { businessName: string; focus: string; followUpStyle: string; cadence: string; activeAiProvider?: string; selectedModels?: Record<string, string> }, completed: boolean) => void;
  loadOnboardingData: (data: { businessName: string; focus: string; followUpStyle: string; cadence: string; isPro?: boolean; apiKeys?: ApiKeys; activeAiProvider?: string; selectedModels?: Record<string, string>; gettingStartedDismissed?: boolean }, completed: boolean) => void;
  setApiKeys: (keys: ApiKeys) => Promise<void>;
  setSelectedModel: (provider: string, model: string) => Promise<void>;
  setGettingStartedDismissed: (dismissed: boolean) => Promise<void>;
  setLeads: (leads: Lead[]) => void;
  propertySnapshots: PropertySnapshot[];
  hiddenSignals: HiddenSignal[];
  outreachDrafts: OutreachDraft[];
  setPropertySnapshots: (snapshots: PropertySnapshot[]) => void;
  setHiddenSignals: (signals: HiddenSignal[]) => void;
  setOutreachDrafts: (drafts: OutreachDraft[]) => void;
  clearStore: () => void;
  leads: Lead[];
  opportunities: Opportunity[];
  documents: AppDocument[];
  addLead: (lead: Omit<Lead, "id" | "createdAt" | "updatedAt" | "followUps" | "activities" | "userId">) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  setOpportunities: (opportunities: Opportunity[]) => void;
  addOpportunity: (opportunity: Omit<Opportunity, "id" | "savedAt" | "userId" | "lat" | "lng" | "geohash">) => Promise<void>;
  savePropertySnapshot: (snapshot: SavePropertySnapshotInput) => Promise<void>;
  addHiddenSignal: (signal: CreateHiddenSignalInput) => Promise<void>;
  promoteSignalToOpportunity: (signalId: string) => Promise<void>;
  createLeadFromSignal: (signalId: string) => Promise<void>;
  createOutreachDraft: (input: CreateOutreachDraftInput) => Promise<void>;
  setDocuments: (documents: AppDocument[]) => void;
  addDocument: (doc: Omit<AppDocument, "id" | "uploadedAt" | "userId">) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  addFollowUp: (leadId: string, dueDate: string, notes?: string) => Promise<void>;
  completeFollowUp: (leadId: string, followUpId: string) => Promise<void>;
  addActivity: (leadId: string, type: import("../types").ActivityType, content: string) => Promise<void>;
}

export const useAppStore = create<AppState>()((set, get) => ({
  userId: null,
  isAuthenticated: false,
  hasCompletedOnboarding: false,
  isPro: false,
  businessName: "",
  focus: "",
  followUpStyle: "casual",
  cadence: "2",
  activeAiProvider: "gemini",
  selectedModels: {},
  gettingStartedDismissed: false,
  apiKeys: {},
  leads: [],
  opportunities: [],
  propertySnapshots: [],
  hiddenSignals: [],
  outreachDrafts: [],
  documents: [],

  setAuth: (authStatus, userId) => set({ isAuthenticated: authStatus, userId }),
  
  setProStatus: async (status: boolean) => {
    const { userId } = get();
    set({ isPro: status });
    if (userId) {
      try {
        await updateDoc(doc(db, "users", userId), { isPro: status });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      }
    }
  },

  setApiKeys: async (keys) => {
    const { userId } = get();
    set({ apiKeys: keys });
    if (userId) {
      try {
        await updateDoc(doc(db, "users", userId), { apiKeys: keys });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      }
    }
  },

  setSelectedModel: async (provider: string, model: string) => {
    const { userId, selectedModels } = get();
    const newSelectedModels = { ...selectedModels, [provider]: model };
    set({ selectedModels: newSelectedModels });
    if (userId) {
      try {
        await updateDoc(doc(db, "users", userId), { selectedModels: newSelectedModels });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      }
    }
  },

  setGettingStartedDismissed: async (dismissed: boolean) => {
    const { userId } = get();
    set({ gettingStartedDismissed: dismissed });
    if (userId) {
      try {
        await setDoc(doc(db, "users", userId), { gettingStartedDismissed: dismissed }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      }
    }
  },

  setOnboardingData: async (data, completed) => {
    const { userId, hasCompletedOnboarding } = get();
    set({
      ...data,
      hasCompletedOnboarding: completed,
    });

    if (userId) {
       try {
         if (hasCompletedOnboarding || completed === false) {
           // Either already onboarding, or updating via settings. Use updateDoc to avoid sending redundant fields.
           await updateDoc(doc(db, "users", userId), {
             ...data,
             hasCompletedOnboarding: completed,
           });
         } else {
           // First time completing onboarding
           await setDoc(doc(db, "users", userId), {
             uid: userId,
             email: auth.currentUser?.email || "",
             ...data,
             hasCompletedOnboarding: completed,
             createdAt: new Date().toISOString()
           });
         }
       } catch (error) {
         handleFirestoreError(error, OperationType.CREATE, `users/${userId}`);
       }
    }
  },

  loadOnboardingData: (data, completed) => {
    set({
      ...data,
      hasCompletedOnboarding: completed,
      isPro: data.isPro || false,
      apiKeys: data.apiKeys || {},
      activeAiProvider: data.activeAiProvider || "gemini",
      selectedModels: data.selectedModels || {},
      gettingStartedDismissed: data.gettingStartedDismissed || false,
    });
  },

  setLeads: (leads) => set({ leads }),
  setOpportunities: (opportunities) => set({ opportunities }),
  setPropertySnapshots: (propertySnapshots) => set({ propertySnapshots }),
  setHiddenSignals: (hiddenSignals) => set({ hiddenSignals }),
  setOutreachDrafts: (outreachDrafts) => set({ outreachDrafts }),
  
  clearStore: () => set({
    userId: null,
    isAuthenticated: false,
    hasCompletedOnboarding: false,
    leads: [],
    opportunities: [],
    propertySnapshots: [],
    hiddenSignals: [],
    outreachDrafts: [],
    gettingStartedDismissed: false,
    businessName: "",
    focus: "",
    followUpStyle: "casual",
    cadence: "2",
    activeAiProvider: "gemini",
    selectedModels: {},
    apiKeys: {},
  }),

  addOpportunity: async (opportunityData) => {
    const { userId } = get();
    if (!userId) return;
    const id = uuidv4();
    
    // Geocode to get lat/lng/hash
    const geocode = await geocodeAddress(opportunityData.propertyAddress);
    
    const newOpportunity: Opportunity = {
      ...opportunityData,
      id,
      userId,
      savedAt: new Date().toISOString(),
      ...(geocode ? { lat: geocode.lat, lng: geocode.lng, geohash: geocode.hash } : {})
    };
    set((state) => ({ opportunities: [newOpportunity, ...state.opportunities] }));
    try {
      await setDoc(doc(db, `${userCollectionPath(userId, "opportunities")}/${id}`), newOpportunity);
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, `${userCollectionPath(userId, "opportunities")}/${id}`);
    }
  },

  savePropertySnapshot: async (snapshotData) => {
    const { userId, propertySnapshots } = get();
    if (!userId) return;

    const id = uuidv4();
    const geocode = await geocodeAddress(snapshotData.propertyAddress);
    const capturedAt = new Date().toISOString();
    const snapshot: PropertySnapshot = {
      ...snapshotData,
      id,
      userId,
      capturedAt,
      tags: snapshotData.tags || [],
      notes: snapshotData.notes || "",
      source: snapshotData.source || snapshotData.originType,
      ...(geocode ? { lat: geocode.lat, lng: geocode.lng, geohash: geocode.hash } : {}),
    };

    set({ propertySnapshots: [snapshot, ...propertySnapshots] });

    try {
      await setDoc(doc(db, `${userCollectionPath(userId, "propertySnapshots")}/${id}`), snapshot);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${userCollectionPath(userId, "propertySnapshots")}/${id}`);
    }
  },

  addHiddenSignal: async (signalData) => {
    const { userId, hiddenSignals } = get();
    if (!userId) return;

    const id = uuidv4();
    const geocode = signalData.lat && signalData.lng && signalData.geohash ? null : await geocodeAddress(signalData.propertyAddress);
    const detectedAt = new Date().toISOString();
    const signal: HiddenSignal = stripUndefinedFields({
      ...signalData,
      id,
      userId,
      detectedAt,
      status: signalData.status || "new",
      tags: signalData.tags || [],
      notes: signalData.notes || "",
      source: signalData.source || signalData.originType,
      ...(signalData.lat !== undefined ? { lat: signalData.lat } : geocode ? { lat: geocode.lat } : {}),
      ...(signalData.lng !== undefined ? { lng: signalData.lng } : geocode ? { lng: geocode.lng } : {}),
      ...(signalData.geohash ? { geohash: signalData.geohash } : geocode ? { geohash: geocode.hash } : {}),
    });

    set({ hiddenSignals: [signal, ...hiddenSignals] });

    try {
      await setDoc(doc(db, `${userCollectionPath(userId, "hiddenSignals")}/${id}`), signal);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${userCollectionPath(userId, "hiddenSignals")}/${id}`);
    }
  },

  promoteSignalToOpportunity: async (signalId) => {
    const { userId, hiddenSignals, opportunities } = get();
    if (!userId) return;

    const signal = hiddenSignals.find((entry) => entry.id === signalId);
    if (!signal) return;

    const id = uuidv4();
    const geocode = signal.lat && signal.lng && signal.geohash ? null : await geocodeAddress(signal.propertyAddress);
    const savedAt = new Date().toISOString();
    const opportunity: Opportunity = {
      id,
      userId,
      propertyAddress: signal.propertyAddress,
      tags: signal.tags || [],
      opportunityScore: Math.max(0, Math.min(100, signal.severity === "critical" ? 95 : signal.severity === "high" ? 80 : signal.severity === "medium" ? 65 : 50)),
      source: signal.source === "lead" ? "lead" : "signal",
      notes: [signal.title, signal.description, signal.notes].filter(Boolean).join("\n\n"),
      savedAt,
      signalId: signal.id,
      ...(signal.snapshotId ? { snapshotId: signal.snapshotId } : {}),
      ...(signal.lat !== undefined ? { lat: signal.lat } : geocode ? { lat: geocode.lat } : {}),
      ...(signal.lng !== undefined ? { lng: signal.lng } : geocode ? { lng: geocode.lng } : {}),
      ...(signal.geohash ? { geohash: signal.geohash } : geocode ? { geohash: geocode.hash } : {}),
    };

    const updatedSignal: HiddenSignal = {
      ...signal,
      status: "promoted",
      promotedOpportunityId: id,
    };

    set({
      opportunities: [opportunity, ...opportunities],
      hiddenSignals: hiddenSignals.map((entry) => (entry.id === signalId ? updatedSignal : entry)),
    });

    try {
      await setDoc(doc(db, `${userCollectionPath(userId, "opportunities")}/${id}`), opportunity);
      await updateDoc(doc(db, `${userCollectionPath(userId, "hiddenSignals")}/${signalId}`), {
        status: "promoted",
        promotedOpportunityId: id,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${userCollectionPath(userId, "hiddenSignals")}/${signalId}`);
    }
  },

  createLeadFromSignal: async (signalId) => {
    const { userId, hiddenSignals, leads } = get();
    if (!userId) return;

    const signal = hiddenSignals.find((entry) => entry.id === signalId);
    if (!signal) return;

    const id = uuidv4();
    const geocode = signal.lat && signal.lng && signal.geohash ? null : await geocodeAddress(signal.propertyAddress);
    const now = new Date().toISOString();

    const lead: Lead = {
      id,
      userId,
      sellerName: "PUBLIC RECORD OWNER",
      phone: "",
      propertyAddress: signal.propertyAddress,
      askingPrice: null,
      motivation: signal.description || signal.title,
      leadSource: signal.source,
      status: "New Lead",
      notes: [signal.title, signal.description, signal.notes].filter(Boolean).join("\n\n"),
      createdAt: now,
      updatedAt: now,
      followUps: [],
      activities: [
        {
          id: uuidv4(),
          leadId: id,
          type: "note",
          content: `Lead created from ${signal.title}`,
          timestamp: now,
        },
      ],
      tags: [...(signal.tags || []), signal.signalType].filter((tag, index, array) => array.indexOf(tag) === index),
      source: signal.source,
      snapshotId: signal.snapshotId,
      signalId: signal.id,
      ...(signal.lat !== undefined ? { lat: signal.lat } : geocode ? { lat: geocode.lat } : {}),
      ...(signal.lng !== undefined ? { lng: signal.lng } : geocode ? { lng: geocode.lng } : {}),
      ...(signal.geohash ? { geohash: signal.geohash } : geocode ? { geohash: geocode.hash } : {}),
    };

    const updatedSignal: HiddenSignal = {
      ...signal,
      status: "reviewed",
      relatedLeadId: id,
    };

    set({
      leads: [lead, ...leads],
      hiddenSignals: hiddenSignals.map((entry) => (entry.id === signalId ? updatedSignal : entry)),
    });

    try {
      await setDoc(doc(db, `${userCollectionPath(userId, "leads")}/${id}`), lead);
      await updateDoc(doc(db, `${userCollectionPath(userId, "hiddenSignals")}/${signalId}`), {
        status: "reviewed",
        relatedLeadId: id,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${userCollectionPath(userId, "hiddenSignals")}/${signalId}`);
    }
  },

  createOutreachDraft: async (input) => {
    const { userId, outreachDrafts } = get();
    if (!userId) return;

    const id = uuidv4();
    const now = new Date().toISOString();

    const baseDraft = input.originType === "lead"
      ? {
          propertyAddress: input.lead.propertyAddress,
          tags: input.lead.tags || [],
          notes: input.lead.notes || "",
          source: input.source || input.lead.source || "lead",
          originId: input.lead.id,
          leadId: input.lead.id,
          signalId: undefined,
          subject: input.subject || `Follow up on ${input.lead.propertyAddress}`,
          message:
            input.message ||
            `Hi ${input.lead.sellerName || "there"}, I wanted to reach out about ${input.lead.propertyAddress}.`,
        }
      : {
          propertyAddress: input.signal.propertyAddress,
          tags: input.signal.tags || [],
          notes: input.signal.notes || input.signal.description || "",
          source: input.source || input.signal.source || "signal",
          originId: input.signal.id,
          leadId: input.signal.relatedLeadId,
          signalId: input.signal.id,
          subject: input.subject || `Outreach for ${input.signal.propertyAddress}`,
          message:
            input.message ||
            `Hi, I noticed ${input.signal.propertyAddress} and wanted to see if you'd be open to a quick conversation.`,
        };

    const draft: OutreachDraft = {
      id,
      userId,
      propertyAddress: baseDraft.propertyAddress,
      tags: baseDraft.tags,
      notes: baseDraft.notes,
      source: baseDraft.source as DiscoverySource,
      originType: input.originType,
      originId: baseDraft.originId,
      channel: input.channel || "sms",
      status: input.status || "draft",
      subject: baseDraft.subject,
      message: baseDraft.message,
      createdAt: now,
      updatedAt: now,
      ...(baseDraft.leadId ? { leadId: baseDraft.leadId } : {}),
      ...(baseDraft.signalId ? { signalId: baseDraft.signalId } : {}),
    };

    set({ outreachDrafts: [draft, ...outreachDrafts] });

    try {
      await setDoc(doc(db, `${userCollectionPath(userId, "outreachDrafts")}/${id}`), draft);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${userCollectionPath(userId, "outreachDrafts")}/${id}`);
    }
  },

  addLead: async (leadData) => {
    const { userId } = get();
    if (!userId) return;
    const id = uuidv4();

    // Geocode to get lat/lng/hash
    const geocode = await geocodeAddress(leadData.propertyAddress);

    const newLead: Lead = {
      ...leadData,
      id,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(geocode ? { lat: geocode.lat, lng: geocode.lng, geohash: geocode.hash } : {}),
      followUps: [],
      activities: [{
        id: uuidv4(),
        leadId: id,
        type: "note",
        content: "Lead created",
        timestamp: new Date().toISOString()
      }],
    };
    
    // Optimistic update
    set((state) => ({ leads: [newLead, ...state.leads] }));
    
    try {
      await setDoc(doc(db, `${userCollectionPath(userId, "leads")}/${id}`), newLead);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${userCollectionPath(userId, "leads")}/${id}`);
    }
  },

  updateLead: async (id, updates) => {
    const { userId, leads } = get();
    if (!userId) return;
    
    const lead = leads.find(l => l.id === id);
    if (!lead) return;

    let newActivities = lead.activities || [];
    if (updates.status && updates.status !== lead.status) {
      newActivities = [{
        id: uuidv4(),
        leadId: id,
        type: "status_change",
        content: `Status changed from ${lead.status} to ${updates.status}`,
        timestamp: new Date().toISOString()
      }, ...newActivities];
      updates.activities = newActivities;
    }

    const newLead = { ...lead, ...updates, activities: newActivities, updatedAt: new Date().toISOString() };
    
    // Optimistic
    set((state) => ({
      leads: state.leads.map((l) => (l.id === id ? newLead : l)),
    }));

    try {
      await updateDoc(doc(db, `${userCollectionPath(userId, "leads")}/${id}`), {
        ...updates,
        updatedAt: newLead.updatedAt,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${userCollectionPath(userId, "leads")}/${id}`);
    }
  },

  deleteLead: async (id) => {
    const { userId } = get();
    if (!userId) return;
    
    set((state) => ({ leads: state.leads.filter((l) => l.id !== id) }));
    
    try {
      await deleteDoc(doc(db, `${userCollectionPath(userId, "leads")}/${id}`));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${userCollectionPath(userId, "leads")}/${id}`);
    }
  },

  addFollowUp: async (leadId, dueDate, notes) => {
    const { userId, leads } = get();
    if (!userId) return;
    
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const newFollowUp: FollowUpReminder = { id: uuidv4(), dueDate, notes, completed: false };
    const newFollowUps = [...lead.followUps, newFollowUp];
    const newUpdatedAt = new Date().toISOString();

    const newActivity = {
      id: uuidv4(),
      leadId,
      type: "note" as const,
      content: `Follow-up scheduled for ${new Date(dueDate).toLocaleDateString()}${notes ? ` - ${notes}` : ""}`,
      timestamp: newUpdatedAt
    };
    const newActivities = [newActivity, ...(lead.activities || [])];

    set((state) => ({
      leads: state.leads.map((l) => l.id === leadId ? { ...l, followUps: newFollowUps, activities: newActivities, updatedAt: newUpdatedAt } : l),
    }));

    try {
      await updateDoc(doc(db, `${userCollectionPath(userId, "leads")}/${leadId}`), {
        followUps: newFollowUps,
        activities: newActivities,
        updatedAt: newUpdatedAt,
      });
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `${userCollectionPath(userId, "leads")}/${leadId}`);
    }
  },

  completeFollowUp: async (leadId, followUpId) => {
    const { userId, leads } = get();
    if (!userId) return;
    
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const followUpToComplete = lead.followUps.find(f => f.id === followUpId);
    const newFollowUps = lead.followUps.map(fu => fu.id === followUpId ? { ...fu, completed: true } : fu);
    const newUpdatedAt = new Date().toISOString();

    const newActivity = {
      id: uuidv4(),
      leadId,
      type: "note" as const,
      content: `Follow-up completed${followUpToComplete?.notes ? ` - ${followUpToComplete.notes}` : ""}`,
      timestamp: newUpdatedAt
    };
    const newActivities = [newActivity, ...(lead.activities || [])];

    set((state) => ({
      leads: state.leads.map((l) => l.id === leadId ? { ...l, followUps: newFollowUps, activities: newActivities, updatedAt: newUpdatedAt } : l),
    }));

    try {
      await updateDoc(doc(db, `${userCollectionPath(userId, "leads")}/${leadId}`), {
        followUps: newFollowUps,
        activities: newActivities,
        updatedAt: newUpdatedAt,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${userCollectionPath(userId, "leads")}/${leadId}`);
    }
  },

  addActivity: async (leadId, type, content) => {
    const { userId, leads } = get();
    if (!userId) return;
    
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const newActivity = {
      id: uuidv4(),
      leadId,
      type,
      content,
      timestamp: new Date().toISOString()
    };

    const newActivities = [newActivity, ...(lead.activities || [])];
    const newUpdatedAt = new Date().toISOString();

    set((state) => ({
      leads: state.leads.map((l) => l.id === leadId ? { ...l, activities: newActivities, updatedAt: newUpdatedAt } : l),
    }));

    try {
      await updateDoc(doc(db, `${userCollectionPath(userId, "leads")}/${leadId}`), {
        activities: newActivities,
        updatedAt: newUpdatedAt,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${userCollectionPath(userId, "leads")}/${leadId}`);
    }
  },
  
  setDocuments: (documents) => set({ documents }),

  addDocument: async (docData) => {
    const { userId, documents } = get();
    if (!userId) return;
    const id = uuidv4();
    const newDoc: AppDocument = {
      ...docData,
      id,
      userId,
      uploadedAt: new Date().toISOString(),
    };
    
    set({ documents: [newDoc, ...documents] });
    
    try {
      await setDoc(doc(db, `${userCollectionPath(userId, "documents")}/${id}`), newDoc);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${userCollectionPath(userId, "documents")}/${id}`);
    }
  },

  deleteDocument: async (id) => {
    const { userId, documents } = get();
    if (!userId) return;
    
    set({ documents: documents.filter(d => d.id !== id) });
    
    try {
      await deleteDoc(doc(db, `${userCollectionPath(userId, "documents")}/${id}`));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${userCollectionPath(userId, "documents")}/${id}`);
    }
  },
}));
