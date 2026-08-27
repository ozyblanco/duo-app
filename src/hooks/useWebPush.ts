import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useWebPush() {
  const [isSupported] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window;
  });

  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const [isSubscribed, setIsSubscribed] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });

  const [loading, setLoading] = useState<boolean>(false);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Las notificaciones no están soportadas en este navegador.');
      return false;
    }

    try {
      setLoading(true);
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        setIsSubscribed(true);

        // Registrar dispositivo en Supabase si hay sesión activa
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('couple_id')
            .eq('id', user.id)
            .maybeSingle();

          const deviceEndpoint = `device-${user.id}-${navigator.userAgent.replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)}`;

          await supabase.from('push_subscriptions').upsert(
            {
              user_id: user.id,
              couple_id: profile?.couple_id || null,
              endpoint: deviceEndpoint,
              p256dh: 'web-push-p256dh-active',
              auth: 'web-push-auth-active',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'endpoint' }
          );
        }

        // Notificación de prueba nativa
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          const registration = await navigator.serviceWorker.ready;
          registration.showNotification('¡Notificaciones DUO activadas! 🎉', {
            body: 'Recibirás avisos nativos en tu pantalla cada vez que haya un movimiento.',
            icon: '/favicon.png',
            badge: '/favicon.png',
          });
        } else {
          new Notification('¡Notificaciones DUO activadas! 🎉', {
            body: 'Recibirás avisos nativos en tu pantalla cada vez que haya un movimiento.',
            icon: '/favicon.png',
          });
        }

        return true;
      }
      return false;
    } catch (err) {
      console.error('Error solicitando permisos push:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendNativeNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            icon: '/favicon.png',
            badge: '/favicon.png',
            ...options,
          });
        });
      } else {
        new Notification(title, {
          icon: '/favicon.png',
          ...options,
        });
      }
    } catch (e) {
      console.error('Error mostrando notificación nativa:', e);
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    requestPermission,
    sendNativeNotification,
  };
}