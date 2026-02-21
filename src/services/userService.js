import { db } from '../firebase';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs
} from 'firebase/firestore';

/**
 * userService.js
 * Handles core user profile operations in Firestore.
 */

export const userService = {
    /**
     * Initializes a user profile in the 'users' collection.
     * @param {string} uid - User's Firebase Auth UID.
     * @param {object} data - Profile fields (email, name, role, etc.).
     */
    async createUserProfile(uid, data) {
        try {
            const userRef = doc(db, 'users', uid);
            const profileData = {
                uid,
                name: data.name || '',
                email: data.email || '',
                role: data.role || 'patient',
                assignedDoctorId: data.assignedDoctorId || null,
                assignedNurseId: data.assignedNurseId || null,
                assignedPatients: data.assignedPatients || [],
                assignedInterns: data.assignedInterns || [],
                createdAt: new Date().toISOString(),
                ...data
            };
            await setDoc(userRef, profileData);
            return { success: true };
        } catch (error) {
            console.error('Error creating user profile:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Fetches a user profile from Firestore.
     * @param {string} uid - User's Firebase Auth UID.
     */
    async getUserProfile(uid) {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                return { success: true, data: userDoc.data() };
            }
            return { success: false, error: 'User profile not found.' };
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Fetches all users of a specific role.
     * @param {string} role - The role to filter by.
     */
    async getUsersByRole(role) {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('role', '==', role));
            const querySnapshot = await getDocs(q);
            const users = [];
            querySnapshot.forEach((doc) => {
                users.push({ uid: doc.id, ...doc.data() });
            });
            return { success: true, data: users };
        } catch (error) {
            console.error('Error fetching users by role:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Updates specific fields in a user profile.
     * @param {string} uid - User's Firebase Auth UID.
     * @param {object} data - Fields to update.
     */
    async updateUserProfile(uid, data) {
        try {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, {
                ...data,
                updatedAt: new Date().toISOString()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating user profile:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Updates patient metrics and notifies doctor (Requirement 6)
     */
    async updatePatientVitals(nurseId, patientId, metrics) {
        try {
            const patientDataRef = doc(db, 'patients', patientId);
            const patientDoc = await getDoc(patientDataRef);
            const doctorId = patientDoc.data()?.doctorId;

            await updateDoc(patientDataRef, {
                ...metrics,
                metricsTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                updatedAt: new Date().toISOString()
            });

            if (doctorId) {
                await notificationService.sendNotification(nurseId, doctorId, {
                    roleFrom: 'nurse',
                    roleTo: 'doctor',
                    type: 'vitals_update',
                    message: `Nurse logged new vitals for Patient ${patientId}: BP ${metrics.bp}, Sugar ${metrics.sugarLevel}`
                });
            }
            return { success: true };
        } catch (error) {
            console.error('Error updating patient vitals:', error);
            return { success: false, error: error.message };
        }
    }
};
