import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

interface OfflineBannerProps {
  onSyncRequest?: () => void;
}

export function OfflineBanner({ onSyncRequest }: OfflineBannerProps) {
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const handleOnline = () => {
      setIsOffline(false);
      setShowRestored(true);
      if (onSyncRequest) {
        onSyncRequest();
      }
      timer = setTimeout(() => {
        setShowRestored(false);
      }, 3500);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timer) clearTimeout(timer);
    };
  }, [onSyncRequest]);

  if (isOffline) {
    return (
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-amber-500/95 text-slate-950 font-bold text-xs px-4 py-2 rounded-full shadow-lg backdrop-blur-xs border border-amber-400/40 animate-pulse">
        <WifiOff className="w-4 h-4 shrink-0" />
        <span>Modo sin conexión • Los cambios se guardarán localmente</span>
      </div>
    );
  }

  if (showRestored) {
    return (
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-full shadow-lg backdrop-blur-xs border border-emerald-400/40 transition-all">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>Conexión restablecida • Sincronizando datos...</span>
        <RefreshCw className="w-3.5 h-3.5 animate-spin ml-1" />
      </div>
    );
  }

  return null;
}