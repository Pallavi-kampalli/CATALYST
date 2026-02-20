import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export function useNotifications() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  // Notifications schema: 
  // { id, targetUserRole (or targetUserId), type, message, sender, timestamp, read }
  const [notifications, setNotifications] = useState([]);

  // Mock initial notifications
  useEffect(() => {
    setNotifications([
      {
        id: 'n1',
        targetUserRole: 'doctor', // also valid: 'patient-1', 'nurse-t1', etc.
        type: 'AI Alert',
        message: 'Patient Maria Rodriguez has elevated temperature.',
        sender: 'AI System',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false
      }
    ]);
  }, []);

  const addNotification = (notif) => {
    const newNotif = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  
  const markAllAsRead = (targetIdOrRole) => {
     setNotifications(prev => prev.map(n => n.targetUserRole === targetIdOrRole ? { ...n, read: true } : n));
  };

  const getUnreadCount = (targetIdOrRole) => {
    return notifications.filter(n => n.targetUserRole === targetIdOrRole && !n.read).length;
  };

  const getNotifications = (targetIdOrRole) => {
    return notifications.filter(n => n.targetUserRole === targetIdOrRole);
  };

  const value = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    getNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
