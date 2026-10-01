/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
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

// Sonido de notificación suave generado mediante Web Audio API
function playChimeSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch {
    // Restricciones de autoplay del navegador antes de la primera interacción
  }
}

// Disparar notificación nativa al sistema operativo
function triggerNativePushNotification(title: string, message: string, id: string) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body: message,
            icon: '/favicon.png',
            badge: '/favicon.png',
            tag: id,
          });
        });
      } else {
        new Notification(title, {
          body: message,
          icon: '/favicon.png',
        });
      }
    } catch (err) {
      console.error('Error enviando notificación push:', err);
    }
  }
}

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

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Persistir en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.error('Error guardando notificaciones:', e);
    }
  }, [notifications]);

  // Cargar usuario y couple_id
  useEffect(() => {
    let isMounted = true;

    async function loadUserAndCouple() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isMounted) return;

        setCurrentUserId(user.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('couple_id')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.couple_id && isMounted) {
          setCoupleId(profile.couple_id);
        }
      } catch (err) {
        console.error('Error obteniendo perfil para notificaciones:', err);
      }
    }

    loadUserAndCouple();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUserAndCouple();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Suscripción al Canal Broadcast de la Pareja en Tiempo Real
  useEffect(() => {
    if (!coupleId || !navigator.onLine) return;

    const channelName = `couple_broadcast_${coupleId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false }, // No recibir los propios mensajes emitidos
      },
    });

    channel
      .on(
        'broadcast',
        { event: 'partner_notification' },
        ({ payload }: { payload: Notification & { senderId: string } }) => {
          if (payload && payload.senderId !== currentUserId) {
            const incoming: Notification = {
              id: payload.id,
              title: payload.title,
              message: payload.message,
              timestamp: 'Ahora mismo',
              read: false,
              type: payload.type,
            };

            // Inyectar en el estado local de la pareja
            setNotifications((prev) => [incoming, ...prev]);

            // Feedback sonoro y háptico
            playChimeSound();
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate([100, 50, 100]);
            }

            // Notificación nativa del SO
            triggerNativePushNotification(incoming.title, incoming.message, incoming.id);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channelRef.current = channel;
        }
      });

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [coupleId, currentUserId]);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Agregar notificación local y transmitirla al instante a la pareja
  const addNotification = useCallback((newNotif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const item: Notification = {
      ...newNotif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: 'Ahora mismo',
      read: false,
    };

    // 1. Añadir localmente en la app de quien realiza la acción
    setNotifications((prev) => [item, ...prev]);
    triggerNativePushNotification(item.title, item.message, item.id);

    // 2. Transmitir en tiempo real al teléfono / navegador de la pareja
    if (channelRef.current && currentUserId) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'partner_notification',
        payload: {
          ...item,
          senderId: currentUserId,
        },
      });
    }
  }, [currentUserId]);

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