# LandMiner CRM Next Features Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build the next product wave around a map-first discovery loop: property snapshot cards, hidden signal feed, nearby deal finder, and AI outreach generation.

**Architecture:** Keep Leads as the canonical inbox, Pipeline as the canonical status board, Follow-Ups as the canonical reminder queue, and move all new discovery and outreach features into the map/opportunity/lead-detail surface area. Shared data should flow through the store first, then be rendered in focused feature panels so the product stays cohesive instead of splitting the same workflow across multiple screens.

**Tech Stack:** React + TypeScript, Zustand store, React Router, Leaflet, Firebase-backed persistence, Gemini/AI helpers, Vite.

---

### Task 1: Define the shared discovery model

**Objective:** Add a single shared model for property snapshot, signal, and outreach data so the new features do not reintroduce overlap.

**Files:**
- Modify: `src/types.ts`
- Modify: `src/store/useAppStore.ts`
- Modify: `src/lib/firebase.ts` if new persistence helpers are needed

**Step 1: Write the shape first**

Add types for:
- property snapshot data
- hidden signal item data
- outreach draft data
- canonical actions for save/convert/generate

**Step 2: Wire store helpers**

Add small store methods for:
- saving a snapshot from map/opportunity data
- promoting a signal to an opportunity
- creating an outreach draft from a lead or signal

**Step 3: Verify the shape compiles**

Run:
- `npm run lint`
- `npm run build`

Expected: both pass.

---

### Task 2: Build the property snapshot card

**Objective:** Give every property a fast, premium snapshot view with the minimum data needed to decide whether it is worth pursuing.

**Files:**
- Create: `src/components/discovery/PropertySnapshotCard.tsx`
- Modify: `src/pages/Map.tsx`
- Modify: `src/pages/Opportunities.tsx`

**Step 1: Build the card component**

The card should show:
- address
- score or signal strength
- source badge
- tags / distress signals
- one primary action
- one secondary action only if it is truly useful

**Step 2: Use it on Map popups and Opportunity cards**

Replace local one-off layouts with the shared component so the same property feels consistent across surfaces.

**Step 3: Verify UI consistency**

Run:
- `npm run build`

Expected: build passes and the card renders in both places.

---

### Task 3: Add the hidden signal feed

**Objective:** Turn raw civic/public data into a ranked feed of useful property signals instead of a generic list.

**Files:**
- Modify: `src/pages/Opportunities.tsx`
- Modify: `src/pages/Map.tsx`
- Modify: `src/store/useAppStore.ts`
- Modify: `src/lib/geocoding.ts` or civic-data helpers if needed

**Step 1: Define ranking and filtering rules**

Classify incoming items into a few useful categories, such as:
- vacancy / abandonment
- code violation
- distressed owner activity
- nearby cluster / hot zone

**Step 2: Rank and group the feed**

Sort by usefulness first, not raw recency.
Group similar signals so the user sees patterns, not noise.

**Step 3: Make the feed actionable**

Every item should support one of these actions:
- save as opportunity
- convert to lead
- inspect on map

**Step 4: Verify with sample data**

Run:
- `npm run build`
- `npm run lint`

Expected: both pass and the feed stays readable.

---

### Task 4: Create the nearby deal finder

**Objective:** Make proximity-based deal discovery a first-class workflow instead of a side button.

**Files:**
- Modify: `src/pages/Map.tsx`
- Modify: `src/pages/LeadDetail.tsx`
- Modify: `src/pages/Opportunities.tsx`
- Modify: `src/lib/geo.ts`

**Step 1: Standardize the nearby query behavior**

Use one consistent radius/search model across the app.

**Step 2: Show nearby deals in one canonical panel**

The panel should:
- highlight the lead or property being inspected
- show the top nearby opportunities
- expose one clear path to the map

**Step 3: Remove duplicated nearby entry points**

If the same nearby logic is used in multiple places, keep the rendering different but the query logic shared.

**Step 4: Verify proximity behavior**

Run:
- `npm run build`

Expected: build passes and the same nearby set appears everywhere the panel is used.

---

### Task 5: Add AI outreach generation as a real workflow

**Objective:** Move outreach generation out of placeholder alerts and into a saved, reusable workflow tied to leads and signals.

**Files:**
- Modify: `src/lib/gemini.ts`
- Modify: `src/pages/LeadDetail.tsx`
- Modify: `src/components/lead/` or a new outreach component folder
- Modify: `src/store/useAppStore.ts`

**Step 1: Define outreach inputs and outputs**

Inputs should be conservative and explicit:
- seller name
- property address
- motivation / signal context
- lead status
- optional notes

Outputs should be:
- short first-touch text
- follow-up text
- optional subject/preview line if needed

**Step 2: Save drafts, don’t just render them**

Users should be able to:
- generate
- copy
- edit
- save
- regenerate

**Step 3: Link the workflow to the lead record**

Outreach generation should feel like a lead action, not a map gimmick.

**Step 4: Verify the flow**

Run:
- `npm run lint`
- `npm run build`

Expected: no type issues and no dead-action alerts remain.

---

### Task 6: Polish the navigation and empty states around the new core

**Objective:** Make the app feel like one product with one coherent workflow, not five adjacent tools.

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/pages/Leads.tsx`
- Modify: `src/pages/Pipeline.tsx`
- Modify: `src/pages/FollowUps.tsx`
- Modify: `src/pages/Map.tsx`
- Modify: `src/pages/Opportunities.tsx`

**Step 1: Keep the canonical surfaces obvious**

Reinforce:
- Leads = inbox
- Pipeline = status board
- Follow-Ups = reminder queue
- Map / Opportunities = discovery

**Step 2: Trim redundant secondary actions again**

If a control is not helping the core flow, remove it.

**Step 3: Re-check empty states**

Empty states should point to the next useful action, not list every possible action.

**Step 4: Final verification**

Run:
- `npm run build`
- `npm run lint`

Expected: clean pass.

---

## Suggested execution order

1. Shared discovery model
2. Property snapshot card
3. Hidden signal feed
4. Nearby deal finder
5. AI outreach workflow
6. Navigation and empty-state polish

## What to avoid
- Do not reintroduce a second follow-up system inside LeadDetail.
- Do not add placeholder buttons that only alert.
- Do not split discovery logic across unrelated screens.
- Do not make Pipeline and Leads show the same workflow in the same way.
