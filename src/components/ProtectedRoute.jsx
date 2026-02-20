/**
 * ProtectedRoute — guards routes based on authentication and role permissions.
 * Redirects unauthenticated users to /login.
 * Redirects role-mismatched users to their correct home route.
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, ROLE_HOME } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, checkAuth } = useAuth();
    const location = useLocation();

    // Not authenticated → go to login
    if (!checkAuth()) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role mismatch → send to their designated home
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        const home = ROLE_HOME[user.role] || '/login';
        return <Navigate to={home} replace />;
    }

    return children;
}
