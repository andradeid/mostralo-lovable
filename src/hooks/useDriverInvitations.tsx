import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

interface DriverInvitation {
  id: string;
  store_id: string;
  driver_id: string;
  token: string;
  status: string;
  expires_at: string;
  proposed_payment_type: 'fixed' | 'commission';
  proposed_fixed_amount?: number;
  proposed_commission_percentage?: number;
  invitation_message?: string;
  counter_offer_payment_type?: 'fixed' | 'commission';
  counter_offer_fixed_amount?: number;
  counter_offer_commission_percentage?: number;
  counter_offer_message?: string;
  counter_offer_at?: string;
  created_at: string;
  stores: {
    name: string;
    logo_url: string | null;
  };
}

export const useDriverInvitations = () => {
  const { session } = useAuth();
  const [invitations, setInvitations] = useState<DriverInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchInvitations = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('driver_invitations')
        .select('*, stores(name, logo_url)')
        .eq('driver_id', session.user.id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInvitations(data || []);
      setPendingCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();

    // Subscrever a mudanças em tempo real
    const channel = supabase
      .channel('driver-invitations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_invitations',
          filter: `driver_id=eq.${session?.user?.id}`,
        },
        () => {
          fetchInvitations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  return {
    invitations,
    loading,
    pendingCount,
    refetch: fetchInvitations,
  };
};
