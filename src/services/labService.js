import { db } from '../firebase';
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    updateDoc,
    doc,
    orderBy,
    limit
} from 'firebase/firestore';

export const labService = {
    // Create a new lab request
    async createLabRequest(requestData) {
        try {
            const labRef = collection(db, 'labRequests');
            const docRef = await addDoc(labRef, {
                ...requestData,
                status: 'pending',
                requestedAt: new Date().toISOString(),
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error creating lab request:', error);
            return { success: false, error: error.message };
        }
    },

    // Get all lab requests (for Lab Practitioner)
    async getAllLabRequests() {
        try {
            const labRef = collection(db, 'labRequests');
            const q = query(labRef, orderBy('requestedAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const requests = [];
            querySnapshot.forEach((doc) => {
                requests.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, data: requests };
        } catch (error) {
            console.error('Error fetching lab requests:', error);
            return { success: false, error: error.message };
        }
    },

    // Get requests for a specific patient
    async getPatientLabRequests(patientId) {
        try {
            const labRef = collection(db, 'labRequests');
            const q = query(labRef, where('patientId', '==', patientId), orderBy('requestedAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const requests = [];
            querySnapshot.forEach((doc) => {
                requests.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, data: requests };
        } catch (error) {
            console.error('Error fetching patient lab requests:', error);
            return { success: false, error: error.message };
        }
    },

    // Update request status
    async updateRequestStatus(requestId, status) {
        try {
            const reqRef = doc(db, 'labRequests', requestId);
            await updateDoc(reqRef, {
                status,
                updatedAt: new Date().toISOString()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating lab request status:', error);
            return { success: false, error: error.message };
        }
    }
};
