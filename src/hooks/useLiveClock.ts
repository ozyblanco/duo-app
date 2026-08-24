import { useState, useEffect } from 'react';

export function useLiveClock() {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Formatos útiles
  const timeString = now.toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const dateString = now.toLocaleDateString('es-VE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedIso = now.toISOString();

  // Clave del mes actual (Ej. "2026-08") para agrupaciones
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Nombre del mes actual (Ej. "Agosto 2026")
  const monthName = now.toLocaleDateString('es-VE', {
    month: 'long',
    year: 'numeric',
  });

  return {
    now,
    timeString,
    dateString,
    formattedIso,
    monthKey,
    monthName,
  };
}