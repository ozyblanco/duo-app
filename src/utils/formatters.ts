/**
 * Utilidades de formateo para DUO
 * Transforma fechas técnicas en lenguaje humano y estandariza montos.
 */

export function formatFriendlyDate(dateInput?: string | Date | null): string {
  if (!dateInput) return 'Hoy';

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return 'Reciente';

  const now = new Date();
  
  // Normalizar a inicio del día para comparación exacta
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffTime = today.getTime() - targetDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Hoy con hora corta
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `Hoy, ${hours}:${minutes}`;
  }

  if (diffDays === 1) {
    return 'Ayer';
  }

  if (diffDays === 2) {
    return 'Hace 2 días';
  }

  // Mismo año: "18 ago"
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  }

  // Años diferentes: "18 ago 2025"
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatCurrencyValue(amount: number, currency: string = 'USD'): string {
  const symbol = currency === 'VES' ? 'Bs. ' : '$';
  return `${symbol}${amount.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}