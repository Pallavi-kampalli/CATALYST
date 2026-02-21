import { db } from '../firebase';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    updateDoc
} from 'firebase/firestore';

/**
 * notificationService.js
 * Handles the creation, retrieval, and management of system notifications.
 */

export const notificationService = {
    /**
     * Sends a notification to a specific receiver.
     * @param {string} senderId - UID of the sender.
     * @param {string} receiverId - UID of the receiver.
     * @param {object} data - Notification content (message, type, roleFrom, roleTo).
     */
    async sendNotification(senderId, receiverId, data) {
        try {
            const notifRef = collection(db, 'notifications');
            const notification = {
                senderId,
                receiverId,
                message: data.message || '',
                type: data.type || 'assignment', // 'assignment' | 'vitals_update' | 'alert'
                roleFrom: data.roleFrom || 'system',
                roleTo: data.roleTo || 'user',
                timestamp: new Date().toISOString(),
                read: false
            };
            await addDoc(notifRef, notification);
            return { success: true };
        } catch (error) {
            console.error('Error sending notification:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Listens for real-time notifications for a specific user.
     * @param {string} userId - UID of the current user.
     * @param {function} callback - Callback function with notifications array.
     */
    subscribeToNotifications(userId, callback) {
        try {
            const notifRef = collection(db, 'notifications');
            const q = query(
                notifRef,
                where('receiverId', '==', userId),
                orderBy('timestamp', 'desc')
            );

            return onSnapshot(q, (snapshot) => {
                const notifs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(notifs);
            });
        } catch (error) {
            console.error('Error subscribing to notifications:', error);
            return () => { }; // No-op cleanup
        }
    },

    /**
     * Marks a specific notification as read.
     * @param {string} notifId - Document ID of the notification.
     */
    async markAsRead(notifId) {
        try {
            const notifRef = doc(db, 'notifications', notifId);
            await updateDoc(notifRef, { read: true });
            return { success: true };
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return { success: false, error: error.message };
        }
    }
};
