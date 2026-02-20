import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, ROLE_HOME } from './context/AuthContext';
import { PatientProvider } from './context/PatientContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import PatientApp from './pages/PatientApp';
import Dashboard from './pages/Dashboard';
import NurseDashboard from './pages/NurseDashboard';
import LabDashboard from './pages/LabDashboard';

/**
 * Root redirect — sends authenticated users to their role home,
 * unauthenticated users to /login.
 */
function RootRedirect() {
  const { user, checkAuth } = useAuth();
  if (!checkAuth()) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Patient app — patients only */}
            <Route
              path="/patient-dashboard"
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientProvider>
                    <PatientApp />
                  </PatientProvider>
                </ProtectedRoute>
              }
            />

            {/* Doctor dashboard — doctor only */}
            <Route
              path="/doctor-dashboard"
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Nurse / Intern dashboard — nurse/intern only */}
            <Route
              path="/nurse-dashboard"
              element={
                <ProtectedRoute allowedRoles={['nurse', 'intern']}>
                  <NurseDashboard />
                </ProtectedRoute>
              }
            />

            {/* Lab dashboard — lab only */}
            <Route
              path="/lab"
              element={
                <ProtectedRoute allowedRoles={['lab']}>
                  <LabDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch-all — smart redirect */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
