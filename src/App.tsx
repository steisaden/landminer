/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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

export default function App() {
  const { isAuthenticated, hasCompletedOnboarding } = useAppStore();

  return (
    <FirebaseProvider>
      <Router>
        <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading…</div>}>
          <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={hasCompletedOnboarding ? "/" : "/onboarding"} />} />
            <Route path="/onboarding" element={isAuthenticated && !hasCompletedOnboarding ? <Onboarding /> : <Navigate to={isAuthenticated ? "/" : "/login"} />} />

            {/* Protected Routes */}
            <Route path="/" element={isAuthenticated && hasCompletedOnboarding ? <Layout /> : <Navigate to={!isAuthenticated ? "/login" : "/onboarding"} />}>
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
