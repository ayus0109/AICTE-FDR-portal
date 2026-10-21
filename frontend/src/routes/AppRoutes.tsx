import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';

import { LoginPage } from '../pages/LoginPage';
import { CollegeDashboardPage } from '../pages/CollegeDashboardPage';
import { OfficerDashboardPage } from '../pages/OfficerDashboardPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { FDRListPage } from '../pages/FDRListPage';
import { FDRDetailsPage } from '../pages/FDRDetailsPage';
import { NewFDRPage } from '../pages/NewFDRPage';
import { FDRReviewPage } from '../pages/FDRReviewPage';
import { RenewalsPage } from '../pages/RenewalsPage';
import { ReleasesPage } from '../pages/ReleasesPage';
import { InstitutionProfilePage } from '../pages/InstitutionProfilePage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { UsersPage } from '../pages/UsersPage';
import { AuditLogsPage } from '../pages/AuditLogsPage';
import { SettingsPage } from '../pages/SettingsPage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 border-4 border-aicte-navy-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // If not allowed, redirect to user's appropriate default dashboard
    if (role === 'COLLEGE_USER') return <Navigate to="/college/dashboard" replace />;
    if (role === 'AICTE_OFFICER') return <Navigate to="/officer/dashboard" replace />;
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

// Root index redirect based on role
const RootRedirect: React.FC = () => {
  const { user, role, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'COLLEGE_USER') return <Navigate to="/college/dashboard" replace />;
  if (role === 'AICTE_OFFICER') return <Navigate to="/officer/dashboard" replace />;
  return <Navigate to="/admin/dashboard" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated Dashboard Routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<RootRedirect />} />
        
        {/* Dashboards */}
        <Route path="/college/dashboard" element={<CollegeDashboardPage />} />
        <Route path="/officer/dashboard" element={<OfficerDashboardPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

        {/* FDR Management */}
        <Route path="/fdrs" element={<FDRListPage />} />
        <Route path="/fdrs/new" element={<NewFDRPage />} />
        <Route path="/fdrs/:id" element={<FDRDetailsPage />} />
        <Route path="/officer/queue" element={<FDRListPage />} />
        <Route path="/officer/review/:id" element={<FDRReviewPage />} />

        {/* Workflows */}
        <Route path="/renewals" element={<RenewalsPage />} />
        <Route path="/releases" element={<ReleasesPage />} />
        <Route path="/institution/profile" element={<InstitutionProfilePage />} />
        <Route path="/institutions/:id" element={<InstitutionProfilePage />} />

        {/* Common Modules */}
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Admin Modules */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'AICTE_OFFICER']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
