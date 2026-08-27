/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Notification } from '@/types';

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  addNotification: (newNotif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  clearAll: () => void;
}

const STORAGE_KEY = 'duo_notifications';

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'welcome-1',
    title: '¡Bienvenido a DUO!',
    message: 'Tu espacio compartido para finanzas en pareja está activo.',
    timestamp: 'Hoy',
    read: false,
    type: 'system',
  },
];

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (typeof window === 'undefined') return INITIAL_NOTIFICATIONS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.error('Error guardando notificaciones:', e);
    }
  }, [notifications]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Agregar notificación interna + disparar notificación nativa al sistema operativo
  const addNotification = useCallback((newNotif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const item: Notification = {
      ...newNotif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: 'Ahora mismo',
      read: false,
    };

    setNotifications((prev) => [item, ...prev]);

    // Disparo nativo Web Push / OS Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(newNotif.title, {
              body: newNotif.message,
              icon: '/favicon.png',
              badge: '/favicon.png',
              tag: item.id,
            });
          });
        } else {
          new Notification(newNotif.title, {
            body: newNotif.message,
            icon: '/favicon.png',
          });
        }
      } catch (err) {
        console.error('Error enviando notificación nativa:', err);
      }
    }
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAllAsRead,
      markAsRead,
      deleteNotification,
      addNotification,
      clearAll,
    }),
    [notifications, unreadCount, markAllAsRead, markAsRead, deleteNotification, addNotification, clearAll]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}