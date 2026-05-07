/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useAppStore } from "./store/useAppStore";
import { FirebaseProvider } from "./components/FirebaseProvider";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Leads = lazy(() => import("./pages/Leads"));
const LeadDetail = lazy(() => import("./pages/LeadDetail"));
const Pipeline = lazy(() => import("./pages/Pipeline"));
const Settings = lazy(() => import("./pages/Settings"));
const FollowUps = lazy(() => import("./pages/FollowUps"));
const ImportLeads = lazy(() => import("./pages/ImportLeads"));
const Login = lazy(() => import("./pages/Login"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const MapPage = lazy(() => import("./pages/Map"));
const Opportunities = lazy(() => import("./pages/Opportunities"));
const DriveForDollars = lazy(() => import("./pages/DriveForDollars"));
const Contracts = lazy(() => import("./pages/Contracts"));
const ChatWithPipeline = lazy(() => import("./pages/ChatWithPipeline"));

const LAST_ROUTE_KEY = "landminer:last-route";

function RouteMemory({ isAuthenticated, hasCompletedOnboarding }: { isAuthenticated: boolean; hasCompletedOnboarding: boolean }) {
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated || !hasCompletedOnboarding) return;
    const path = `${location.pathname}${location.search}${location.hash}`;
    if (path !== "/login" && path !== "/onboarding") {
      sessionStorage.setItem(LAST_ROUTE_KEY, path);
    }
  }, [hasCompletedOnboarding, isAuthenticated, location.hash, location.pathname, location.search]);

  return null;
}

function RootGate({
  isAuthenticated,
  hasCompletedOnboarding,
  restorePath,
}: {
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  restorePath: string | null;
}) {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  if (location.pathname === "/" && restorePath && restorePath !== "/") {
    return <Navigate to={restorePath} replace />;
  }

  return <Layout />;
}

export default function App() {
  const { isAuthenticated, hasCompletedOnboarding } = useAppStore();
  const [restorePath, setRestorePath] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const navigationEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const legacyNavigation = (performance as Performance & { navigation?: { type?: number } }).navigation;
    const isReload = navigationEntry?.type === "reload" || legacyNavigation?.type === 1;

    if (!isReload) return;

    const resumePath = sessionStorage.getItem(LAST_ROUTE_KEY);
    if (resumePath && resumePath !== "/login" && resumePath !== "/onboarding") {
      setRestorePath(resumePath);
    }
  }, []);

  return (
    <FirebaseProvider>
      <Router>
        <RouteMemory isAuthenticated={isAuthenticated} hasCompletedOnboarding={hasCompletedOnboarding} />
        <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading…</div>}>
          <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={hasCompletedOnboarding ? "/" : "/onboarding"} />} />
            <Route path="/onboarding" element={isAuthenticated && !hasCompletedOnboarding ? <Onboarding /> : <Navigate to={isAuthenticated ? "/" : "/login"} />} />

            {/* Protected Routes */}
            <Route path="/" element={<RootGate isAuthenticated={isAuthenticated} hasCompletedOnboarding={hasCompletedOnboarding} restorePath={restorePath} />}>
              <Route index element={<Dashboard />} />
              <Route path="leads" element={<Leads />} />
              <Route path="leads/:id" element={<LeadDetail />} />
              <Route path="opportunities" element={<Opportunities />} />
              <Route path="map" element={<MapPage />} />
              <Route path="pipeline" element={<Pipeline />} />
              <Route path="follow-ups" element={<FollowUps />} />
              <Route path="import" element={<ImportLeads />} />
              <Route path="drive-for-dollars" element={<DriveForDollars />} />
              <Route path="contracts" element={<Contracts />} />
              <Route path="ask" element={<ChatWithPipeline />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </FirebaseProvider>
  );
}
