import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  email?: string;
}

export function useCoupleProfiles() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [coupleCode, setCoupleCode] = useState<string>('DUO-8842');
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCurrentUser(null);
        setPartner(null);
        return;
      }

      const { data: myProfile, error: myProfileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (myProfileErr || !myProfile) {
        return;
      }

      const formattedMe: UserProfile = {
        id: myProfile.id,
        name: myProfile.full_name || 'Tú',
        avatarUrl: myProfile.avatar_url || '',
        email: myProfile.email || user.email || '',
      };
      setCurrentUser(formattedMe);

      if (myProfile.couple_id) {
        const formattedCode = `DUO-${myProfile.couple_id.slice(0, 4).toUpperCase()}`;
        setCoupleCode(formattedCode);

        const { data: partnerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('couple_id', myProfile.couple_id)
          .neq('id', user.id)
          .maybeSingle();

        if (partnerData) {
          setPartner({
            id: partnerData.id,
            name: partnerData.full_name || 'Tu Pareja',
            avatarUrl: partnerData.avatar_url || '',
            email: partnerData.email || '',
          });
        }
      }
    } catch (err: unknown) {
      console.error('Error cargando perfiles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const executeFetch = async () => {
      if (isMounted) {
        await fetchProfiles();
      }
    };

    executeFetch();

    return () => {
      isMounted = false;
    };
  }, [fetchProfiles]);

  return {
    currentUser,
    partner,
    coupleCode,
    loading,
    refreshProfiles: fetchProfiles,
  };
}