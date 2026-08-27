import React, { useState } from 'react';
import { 
  X, 
  Tag, 
  DollarSign, 
  Palette, 
  Loader2, 
  ShoppingBag, 
  Utensils, 
  Home, 
  Tv, 
  Car, 
  HeartPulse, 
  Gift, 
  Plane,
  Sparkles
} from 'lucide-react';
import type { Category } from '@/types';

interface CategoryModalProps {
  isOpen: boolean;
  category?: Category | null;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    color: string;
    icon: string;
    budgetLimit: number;
  }) => Promise<boolean>;
}

const PRESET_COLORS = [
  '#3B82F6', // Azul
  '#10B981', // Esmeralda
  '#F59E0B', // Ámbar
  '#EC4899', // Rosa
  '#8B5CF6', // Púrpura
  '#EF4444', // Rojo
  '#06B6D4', // Cian
  '#64748B', // Pizarra
];

const PRESET_ICONS = [
  { name: 'ShoppingBag', Icon: ShoppingBag },
  { name: 'Utensils', Icon: Utensils },
  { name: 'Home', Icon: Home },
  { name: 'Tv', Icon: Tv },
  { name: 'Car', Icon: Car },
  { name: 'HeartPulse', Icon: HeartPulse },
  { name: 'Gift', Icon: Gift },
  { name: 'Plane', Icon: Plane },
];

export function CategoryModal({ isOpen, category, onClose, onSubmit }: CategoryModalProps) {
  const [name, setName] = useState(category?.name || '');
  const [color, setColor] = useState(category?.color || PRESET_COLORS[0]);
  const [icon, setIcon] = useState(category?.icon || PRESET_ICONS[0].name);
  const [budgetLimit, setBudgetLimit] = useState(category?.budgetLimit ? String(category.budgetLimit) : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      const success = await onSubmit({
        name: name.trim(),
        color,
        icon,
        budgetLimit: parseFloat(budgetLimit) || 0,
      });

      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity">
      <div
        className="w-full max-w-md bg-white dark:bg-[#161B22] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl p-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            {category ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Nombre de la Categoría
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Tag className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Ej. Salidas, Mascotas, Ropa..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Presupuesto Límite Mensual (USD - Opcional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="number"
                step="0.01"
                placeholder="0.00 (Dejar en 0 si no tiene límite)"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-bold font-numeric text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
              />
            </div>
          </div>

          {/* Selector de Icono */}
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Icono Representativo
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_ICONS.map(({ name: iconName, Icon }) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    icon === iconName
                      ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400 shadow-xs scale-105'
                      : 'bg-slate-50 dark:bg-[#0B0F17] border-slate-200/80 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Selector de Color */}
          <div>
            <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              <Palette className="w-3.5 h-3.5 text-purple-500" /> Color Identificador
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                    color === c ? 'scale-125 ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-[#161B22]' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{category ? 'Guardar Cambios' : 'Crear Categoría'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}