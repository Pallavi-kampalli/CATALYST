import { db } from '../firebase';
import {
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    query,
    collection,
    where,
    getDocs
} from 'firebase/firestore';
import { notificationService } from './notificationService';

/**
 * assignmentService.js
 * Handles linking between different user roles and role-based querying.
 */

export const assignmentService = {
    /**
     * Doctor assigns a nurse/intern.
     * @param {string} doctorId - UID of the doctor.
     * @param {string} targetId - UID of the nurse or intern.
     * @param {string} targetRole - 'nurse' or 'intern'.
     */
    async assignToDoctor(doctorId, targetId, targetRole) {
        try {
            const doctorRef = doc(db, 'users', doctorId);
            const targetRef = doc(db, 'users', targetId);

            const field = targetRole === 'nurse' ? 'assignedNurses' : 'assignedInterns';

            // Update Doctor document
            await updateDoc(doctorRef, {
                [field]: arrayUnion(targetId)
            });

            // Update Target document
            await updateDoc(targetRef, {
                assignedDoctorId: doctorId
            });

            // Notify Target
            await notificationService.sendNotification(doctorId, targetId, {
                roleFrom: 'doctor',
                roleTo: targetRole,
                type: 'assignment',
                message: `You have been assigned to Dr. ${doctorId.substring(0, 5)}...`
            });

            return { success: true };
        } catch (error) {
            console.error('Error in assignToDoctor:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Doctor assigns a patient to a nurse.
     * @param {string} doctorId - UID of the doctor.
     * @param {string} patientId - UID of the patient.
     * @param {string} nurseId - UID of the nurse.
     */
    async doctorAssignPatientToNurse(doctorId, patientId, nurseId) {
        try {
            const nurseRef = doc(db, 'users', nurseId);
            const patientRef = doc(db, 'users', patientId); // Patient doc in users collection
            const patientDataRef = doc(db, 'patients', patientId); // Patient data in patients collection

            // 1. Update Nurse document with assignedPatients array
            await updateDoc(nurseRef, {
                assignedPatients: arrayUnion(patientId)
            });

            // 2. Update Patient documents with assignedNurseId and doctorId
            await updateDoc(patientRef, {
                assignedNurseId: nurseId,
                assignedDoctorId: doctorId
            });
            await updateDoc(patientDataRef, {
                nurseId: nurseId,
                doctorId: doctorId
            });

            // 3. Create notification for nurse
            await notificationService.sendNotification(doctorId, nurseId, {
                roleFrom: 'doctor',
                roleTo: 'nurse',
                type: 'assignment',
                message: `Dr. Mitchell assigned you a new patient: ${patientId}`
            });

            return { success: true };
        } catch (error) {
            console.error('Error in doctorAssignPatientToNurse:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Doctor assigns an intern to a nurse.
     */
    async assignInternToNurse(doctorId, internId, nurseId) {
        try {
            const nurseRef = doc(db, 'users', nurseId);
            const internRef = doc(db, 'users', internId);

            await updateDoc(nurseRef, {
                assignedInterns: arrayUnion(internId)
            });
            await updateDoc(internRef, {
                assignedNurseId: nurseId,
                assignedDoctorId: doctorId
            });

            await notificationService.sendNotification(doctorId, internId, {
                roleFrom: 'doctor',
                roleTo: 'intern',
                type: 'assignment',
                message: 'You have been assigned to assist a nurse.'
            });

            return { success: true };
        } catch (error) {
            console.error('Error in assignInternToNurse:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Generic query to get assigned users based on role specific logic.
     * @param {string} uid - Current user's UID.
     * @param {string} role - Current user's role.
     */
    async getMyAssignedUsers(uid, role) {
        try {
            let q;
            const usersRef = collection(db, 'users');

            if (role === 'doctor' || role === 'lab') {
                // Doctor and Lab see ALL patients (Requirement 8)
                q = query(usersRef, where('role', '==', 'patient'));
            } else if (role === 'nurse') {
                // Nurse sees ONLY assigned patients (Requirement 4 & 8)
                q = query(usersRef, where('assignedNurseId', '==', uid));
            } else if (role === 'intern') {
                q = query(usersRef, where('assignedNurseId', '==', uid)); // Simplified for demo
            } else if (role === 'patient') {
                // Patients usually see their own data, but might want to know their doctor/nurse
                const patientDoc = await getDoc(doc(db, 'users', uid));
                return { success: true, associations: patientDoc.data() };
            } else {
                return { success: false, error: 'Unsupported role for assignment query.' };
            }

            const querySnapshot = await getDocs(q);
            const users = [];
            querySnapshot.forEach((doc) => {
                users.push({ uid: doc.id, ...doc.data() });
            });
            return { success: true, data: users };
        } catch (error) {
            console.error('Error fetching assigned users:', error);
            return { success: false, error: error.message };
        }
    }
};
