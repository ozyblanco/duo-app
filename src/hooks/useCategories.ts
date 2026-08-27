import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { mockCategories } from '@/data/mockData';
import type { Category } from '@/types';

const CACHE_KEY = 'duo_categories_cache';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(() => {
    if (typeof window === 'undefined') return mockCategories;
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : mockCategories;
    } catch {
      return mockCategories;
    }
  });

  const [loading, setLoading] = useState(true);
  const [coupleId, setCoupleId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      if (!navigator.onLine) {
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('couple_id')
        .eq('id', user.id)
        .maybeSingle();

      const currentCoupleId = profile?.couple_id || null;
      setCoupleId(currentCoupleId);

      // Traer categorías globales por defecto o asociadas al espacio de la pareja
      let query = supabase.from('categories').select('*');
      if (currentCoupleId) {
        query = query.or(`couple_id.is.null,couple_id.eq.${currentCoupleId}`);
      } else {
        query = query.is('couple_id', null);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: Category[] = data.map((cat) => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          iconName: cat.icon,
          color: cat.color || '#3B82F6',
          budgetLimit: Number(cat.budget_limit) || 0,
          coupleId: cat.couple_id,
          isDefault: cat.is_default ?? false,
        }));
        setCategories(mapped);
        localStorage.setItem(CACHE_KEY, JSON.stringify(mapped));
      } else {
        setCategories(mockCategories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const execute = async () => {
      if (isMounted) await fetchCategories();
    };
    execute();
    return () => {
      isMounted = false;
    };
  }, [fetchCategories]);

  // Añadir categoría
  const addCategory = async (newCat: {
    name: string;
    icon?: string;
    color?: string;
    budgetLimit?: number;
  }): Promise<boolean> => {
    try {
      const payload = {
        couple_id: coupleId,
        name: newCat.name.trim(),
        icon: newCat.icon || 'ShoppingBag',
        color: newCat.color || '#3B82F6',
        budget_limit: newCat.budgetLimit || 0,
        is_default: false,
      };

      const { data, error } = await supabase
        .from('categories')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      const created: Category = {
        id: data.id,
        name: data.name,
        icon: data.icon,
        iconName: data.icon,
        color: data.color,
        budgetLimit: Number(data.budget_limit) || 0,
        coupleId: data.couple_id,
        isDefault: false,
      };

      setCategories((prev) => {
        const updated = [...prev, created];
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        return updated;
      });
      return true;
    } catch (err) {
      console.error('Error adding category:', err);
      return false;
    }
  };

  // Editar categoría
  const updateCategory = async (
    id: string,
    updates: Partial<Omit<Category, 'id'>>
  ): Promise<boolean> => {
    try {
      const payload: Record<string, unknown> = {};
      if (updates.name !== undefined) payload.name = updates.name.trim();
      if (updates.icon !== undefined) payload.icon = updates.icon;
      if (updates.color !== undefined) payload.color = updates.color;
      if (updates.budgetLimit !== undefined) payload.budget_limit = updates.budgetLimit;

      const { error } = await supabase
        .from('categories')
        .update(payload)
        .eq('id', id);

      if (error) throw error;

      setCategories((prev) => {
        const updated = prev.map((cat) =>
          cat.id === id ? { ...cat, ...updates } : cat
        );
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        return updated;
      });
      return true;
    } catch (err) {
      console.error('Error updating category:', err);
      return false;
    }
  };

  // Eliminar categoría
  const deleteCategory = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;

      setCategories((prev) => {
        const updated = prev.filter((cat) => cat.id !== id);
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        return updated;
      });
      return true;
    } catch (err) {
      console.error('Error deleting category:', err);
      return false;
    }
  };

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    refetchCategories: fetchCategories,
  };
}