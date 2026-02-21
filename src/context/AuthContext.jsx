import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { auth, db } from '../firebase';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// ─── Role → Default Route Mapping ────────────────────────────────────────────
export const ROLE_HOME = {
    doctor: '/doctor-dashboard',
    nurse: '/nurse-dashboard',
    intern: '/nurse-dashboard',
    patient: '/patient-dashboard',
    lab: '/lab',
};

// ─── Permission Matrix ────────────────────────────────────────────────────────
const ROUTE_PERMISSIONS = {
    '/patient-dashboard': ['patient'],
    '/doctor-dashboard': ['doctor'],
    '/nurse-dashboard': ['nurse', 'intern'],
    '/lab': ['lab'],
};

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

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    /** Auth state listener */
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Fetch extra user info from Firestore
                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        ...userData,
                        isAuthenticated: true
                    });
                } else {
                    // Fallback or handle missing Firestore doc
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        role: 'patient', // default
                        isAuthenticated: true
                    });
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    /** Firebase Login */
    const login = useCallback(async (email, password) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: result.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, []);

    /** Firebase Signup + Firestore User Creation */
    const signup = useCallback(async (email, password, name, role = 'patient') => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            // Create Firestore user document
            const userData = {
                uid: result.user.uid,
                name,
                email,
                role,
                assignedPatients: [],
                assignedUnder: null,
                createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', result.user.uid), userData);
            return { success: true, user: userData };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }, []);

    /** Firebase Logout */
    const logout = useCallback(async () => {
        await signOut(auth);
    }, []);

    const checkAuth = useCallback(() => !!user?.isAuthenticated, [user]);

    /** Route Access Check */
    const canAccessRoute = useCallback(
        (route) => {
            if (!user) return false;
            const allowed = ROUTE_PERMISSIONS[route];
            if (!allowed) return true;
            return allowed.includes(user.role);
        },
        [user]
    );

    /** Feature Access Check */
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
        () => ({ user, loading, login, signup, logout, checkAuth, canAccessRoute, hasPermission }),
        [user, loading, login, signup, logout, checkAuth, canAccessRoute, hasPermission]
    );

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}

export { ROUTE_PERMISSIONS, FEATURE_PERMISSIONS };
