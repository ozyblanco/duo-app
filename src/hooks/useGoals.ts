import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { Goal } from '@/types';

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setGoals([]);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('couple_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.couple_id) {
        setGoals([]);
        return;
      }

      setCoupleId(profile.couple_id);

      const { data, error: fetchError } = await supabase
        .from('goals')
        .select('*')
        .eq('couple_id', profile.couple_id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (data) {
        const mapped: Goal[] = data.map((row) => ({
          id: row.id,
          title: row.title,
          category: row.category || 'General',
          targetAmount: Number(row.target_amount),
          currentAmount: Number(row.current_amount),
          deadline: row.deadline || '',
          userContribution: Number(row.user_contribution || 0),
          partnerContribution: Number(row.partner_contribution || 0),
          isCompleted: row.is_completed || Number(row.current_amount) >= Number(row.target_amount),
        }));
        setGoals(mapped);
      }
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar las metas';
      console.error('Error fetching goals:', err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const execute = async () => {
      if (isMounted) await fetchGoals();
    };
    execute();
    return () => {
      isMounted = false;
    };
  }, [fetchGoals]);

  // Suscripción Realtime
  useEffect(() => {
    if (!coupleId) return;

    const channel = supabase
      .channel(`realtime-goals-${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          fetchGoals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, fetchGoals]);

  // Crear nueva meta
  const addGoal = async (newGoalData: {
    title: string;
    category: string;
    targetAmount: number;
    deadline?: string;
  }): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !coupleId) throw new Error('Usuario o espacio no vinculado');

      const newRow = {
        couple_id: coupleId,
        user_id: user.id,
        title: newGoalData.title.trim(),
        category: newGoalData.category,
        target_amount: newGoalData.targetAmount,
        current_amount: 0,
        deadline: newGoalData.deadline || null,
        user_contribution: 0,
        partner_contribution: 0,
        is_completed: false,
      };

      const { data, error: insertError } = await supabase
        .from('goals')
        .insert(newRow)
        .select()
        .single();

      if (insertError) throw insertError;

      if (data) {
        const formatted: Goal = {
          id: data.id,
          title: data.title,
          category: data.category,
          targetAmount: Number(data.target_amount),
          currentAmount: Number(data.current_amount),
          deadline: data.deadline || '',
          userContribution: Number(data.user_contribution || 0),
          partnerContribution: Number(data.partner_contribution || 0),
          isCompleted: data.is_completed,
        };
        setGoals((prev) => [formatted, ...prev]);
      }
      return true;
    } catch (err) {
      console.error('Error adding goal:', err);
      return false;
    }
  };

  // Abonar a una meta
  const depositToGoal = async (
    goalId: string,
    amount: number,
    isCurrentUserDeposit: boolean
  ): Promise<{ success: boolean; isNowCompleted: boolean }> => {
    try {
      const targetGoal = goals.find((g) => g.id === goalId);
      if (!targetGoal) throw new Error('Meta no encontrada');

      const updatedCurrent = targetGoal.currentAmount + amount;
      const updatedUserContrib = isCurrentUserDeposit
        ? targetGoal.userContribution + amount
        : targetGoal.userContribution;
      const updatedPartnerContrib = !isCurrentUserDeposit
        ? targetGoal.partnerContribution + amount
        : targetGoal.partnerContribution;
      const isCompleted = updatedCurrent >= targetGoal.targetAmount;

      const { error: updateError } = await supabase
        .from('goals')
        .update({
          current_amount: updatedCurrent,
          user_contribution: updatedUserContrib,
          partner_contribution: updatedPartnerContrib,
          is_completed: isCompleted,
        })
        .eq('id', goalId);

      if (updateError) throw updateError;

      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? {
                ...g,
                currentAmount: updatedCurrent,
                userContribution: updatedUserContrib,
                partnerContribution: updatedPartnerContrib,
                isCompleted,
              }
            : g
        )
      );

      return { success: true, isNowCompleted: isCompleted };
    } catch (err) {
      console.error('Error depositing to goal:', err);
      return { success: false, isNowCompleted: false };
    }
  };

  // Eliminar meta
  const deleteGoal = async (goalId: string): Promise<boolean> => {
    try {
      const { error: delError } = await supabase.from('goals').delete().eq('id', goalId);
      if (delError) throw delError;

      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      return true;
    } catch (err) {
      console.error('Error deleting goal:', err);
      return false;
    }
  };

  // Métricas colectivas
  const totalTarget = useMemo(() => goals.reduce((acc, g) => acc + g.targetAmount, 0), [goals]);
  const totalSaved = useMemo(() => goals.reduce((acc, g) => acc + g.currentAmount, 0), [goals]);
  const overallProgress = useMemo(() => {
    return totalTarget > 0 ? Math.min(Math.round((totalSaved / totalTarget) * 100), 100) : 0;
  }, [totalTarget, totalSaved]);

  return {
    goals,
    isLoading,
    error,
    totalTarget,
    totalSaved,
    overallProgress,
    addGoal,
    depositToGoal,
    deleteGoal,
    refetch: fetchGoals,
  };
}