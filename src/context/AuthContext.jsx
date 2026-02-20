/**
 * AuthContext — Role-based authentication and access control
 * Frontend-only demo using localStorage for session persistence.
 *
 * Roles: doctor | nurse | patient | lab
 */
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

// ─── Demo User Database ───────────────────────────────────────────────────────
const DEMO_USERS = [
    { email: 'doctor@test.com', password: '1234', role: 'doctor', name: 'Dr. Sarah Mitchell' },
    { email: 'nurse@test.com', password: '1234', role: 'nurse', name: 'Nurse James Carter' },
    { email: 'intern@test.com', password: '1234', role: 'intern', name: 'Intern Riya Mehta' },
    { email: 'patient@test.com', password: '1234', role: 'patient', name: 'Alex Johnson' },
    { email: 'lab@test.com', password: '1234', role: 'lab', name: 'Lab Tech Priya Sharma' },
];

// ─── Role → Default Route Mapping ────────────────────────────────────────────
export const ROLE_HOME = {
    doctor: '/dashboard',
    nurse: '/nurse-dashboard',
    intern: '/nurse-dashboard',
    patient: '/',
    lab: '/lab',
};

// ─── Permission Matrix ────────────────────────────────────────────────────────
// route access: which roles can visit which route
const ROUTE_PERMISSIONS = {
    '/': ['patient'],
    '/dashboard': ['doctor'],
    '/nurse-dashboard': ['nurse', 'intern'],
    '/lab': ['lab'],
};

// feature-level permissions
const FEATURE_PERMISSIONS = {
    viewAllPatients: ['doctor'],
    viewAssignedPatients: ['nurse', 'intern'],
    viewRiskDrivers: ['doctor', 'nurse', 'intern'],
    markAlertsResolved: ['doctor'],
    accessAnalytics: ['doctor'],
    accessSettings: ['doctor'],
    editMedications: ['doctor'],
    addNotes: ['nurse', 'intern'],
    scheduleAppointments: ['nurse', 'intern'],
    messagePatient: ['nurse', 'intern'],
    viewLabRequests: ['lab'],
    uploadLabResults: ['lab'],
    logOwnSymptoms: ['patient'],
};

// ─── Storage Helpers ──────────────────────────────────────────────────────────
const SESSION_KEY = 'rc_session';

function saveSession(user) {
    const session = { email: user.email, role: user.role, name: user.name, isAuthenticated: true };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
}

function loadSession() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const session = JSON.parse(raw);
        return session?.isAuthenticated ? session : null;
    } catch {
        return null;
    }
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => loadSession());

    /**
     * Attempt login with email + password.
     * @returns {{ success: boolean, error?: string, user?: object }}
     */
    const login = useCallback((email, password) => {
        if (!email || !password) {
            return { success: false, error: 'Email and password are required.' };
        }
        const found = DEMO_USERS.find(
            (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        if (!found) {
            return { success: false, error: 'Invalid email or password. Try the demo credentials.' };
        }
        const session = saveSession(found);
        setUser(session);
        return { success: true, user: session };
    }, []);

    /** Clear session and sign out */
    const logout = useCallback(() => {
        clearSession();
        setUser(null);
    }, []);

    /** Returns current user object or null */
    const getCurrentUser = useCallback(() => user, [user]);

    /** Returns true if a valid session exists */
    const checkAuth = useCallback(() => !!user?.isAuthenticated, [user]);

    /**
     * Check if current user can access a route.
     * @param {string} route — e.g. '/dashboard'
     */
    const canAccessRoute = useCallback(
        (route) => {
            if (!user) return false;
            const allowed = ROUTE_PERMISSIONS[route];
            if (!allowed) return true; // unregistered routes are open
            return allowed.includes(user.role);
        },
        [user]
    );

    /**
     * Check if current user has a feature-level permission.
     * @param {string} feature — key from FEATURE_PERMISSIONS
     */
    const hasPermission = useCallback(
        (feature) => {
            if (!user) return false;
            const allowed = FEATURE_PERMISSIONS[feature];
            if (!allowed) return false;
            return allowed.includes(user.role);
        },
        [user]
    );

    const value = useMemo(
        () => ({ user, login, logout, checkAuth, getCurrentUser, canAccessRoute, hasPermission }),
        [user, login, logout, checkAuth, getCurrentUser, canAccessRoute, hasPermission]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}

// Named exports for use without hook
export { DEMO_USERS, ROUTE_PERMISSIONS, FEATURE_PERMISSIONS };
