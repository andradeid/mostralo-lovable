import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

interface SystemUpdate {
  id: string;
  version: string;
  title: string;
  release_date: string;
}

export function useUnreadUpdates() {
  const { profile, userRole } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadUpdates, setUnreadUpdates] = useState<SystemUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  // Roles que podem ver novidades (exceto customer)
  const allowedRoles = ['master_admin', 'store_admin', 'salesperson', 'delivery_driver', 'attendant'];
  const canViewUpdates = profile && (
    allowedRoles.includes(userRole || '') || 
    (profile.user_type && allowedRoles.includes(profile.user_type))
  );

  const fetchUnreadUpdates = async () => {
    if (!profile?.id || !canViewUpdates) {
      setLoading(false);
      return;
    }

    try {
      // Buscar todas as atualizações publicadas
      const { data: updates, error: updatesError } = await supabase
        .from('system_updates')
        .select('id, version, title, release_date')
        .eq('is_published', true)
        .order('release_date', { ascending: false });

      if (updatesError) {
        console.error('Erro ao buscar atualizações:', updatesError);
        setLoading(false);
        return;
      }

      // Buscar leituras do usuário
      const { data: reads, error: readsError } = await supabase
        .from('user_update_reads')
        .select('update_id')
        .eq('user_id', profile.id);

      if (readsError) {
        console.error('Erro ao buscar leituras:', readsError);
        setLoading(false);
        return;
      }

      const readIds = new Set((reads || []).map(r => r.update_id));
      const unread = (updates || []).filter(u => !readIds.has(u.id));

      setUnreadUpdates(unread);
      setUnreadCount(unread.length);
    } catch (error) {
      console.error('Erro ao verificar novidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (updateId: string) => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from('user_update_reads')
        .upsert({
          user_id: profile.id,
          update_id: updateId
        }, {
          onConflict: 'user_id,update_id'
        });

      if (!error) {
        setUnreadUpdates(prev => prev.filter(u => u.id !== updateId));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!profile?.id || unreadUpdates.length === 0) return;

    try {
      const inserts = unreadUpdates.map(u => ({
        user_id: profile.id,
        update_id: u.id
      }));

      const { error } = await supabase
        .from('user_update_reads')
        .upsert(inserts, {
          onConflict: 'user_id,update_id'
        });

      if (!error) {
        setUnreadUpdates([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  useEffect(() => {
    fetchUnreadUpdates();
  }, [profile?.id, canViewUpdates]);

  // Realtime subscription para novas atualizações
  useEffect(() => {
    if (!canViewUpdates) return;

    const channel = supabase
      .channel('system-updates-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_updates'
        },
        () => {
          fetchUnreadUpdates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [canViewUpdates, profile?.id]);

  return {
    unreadCount,
    unreadUpdates,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchUnreadUpdates,
    canViewUpdates
  };
}
