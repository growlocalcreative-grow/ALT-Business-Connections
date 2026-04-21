/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider, useUser } from "./contexts/UserContext";
import LandingPage from "./pages/index";
import AdminVerify from "./pages/admin/verify";
import Onboarding from "./pages/auth/Onboarding";
import Dashboard from "./pages/Dashboard";
import BusinessDashboard from "./pages/BusinessDashboard";
import BusinessProfile from "./pages/BusinessProfile";
import AdminPortal from "./pages/AdminPortal";
import { Loader2 } from "lucide-react";
import OneSignalInit from "./components/OneSignalInit";

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode, requiredRole?: string | string[] }) {
  const { user, profile, loading, isAuthReady } = useUser();

  if (!isAuthReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand">
        <Loader2 className="animate-spin text-forest" size={48} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/onboarding" />;
  }

  if (!profile && window.location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" />;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const isMasterAdmin = user?.email === "growlocalcreative@gmail.com";
    if (profile && !roles.includes(profile.role) && !isMasterAdmin) {
      return <Navigate to="/dashboard" />;
    }
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <UserProvider>
      <OneSignalInit />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/onboarding" element={<Onboarding />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/business/manage" 
            element={
              <ProtectedRoute requiredRole="business">
                <BusinessDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/business/:businessId" 
            element={
              <ProtectedRoute>
                <BusinessProfile />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/portal" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPortal />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/verify" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminVerify />
              </ProtectedRoute>
            } 
          />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}
