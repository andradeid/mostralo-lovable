// Ações do topo da Agenda: slug da loja (link da página pública) e sincronizar
// tudo com o Google Calendar. Código movido da BookingCalendarPage sem mudança.
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function useCalendarHeaderActions(storeId: string | null) {
  const [storeSlug, setStoreSlug] = useState<string | null>(null);
  const [syncingCalendar, setSyncingCalendar] = useState(false);

  // Sync all bookings with Google Calendar
  const handleSyncGoogleCalendar = async () => {
    if (!storeId) return;
    
    setSyncingCalendar(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { action: 'sync_all', store_id: storeId }
      });
      
      if (error) throw error;
      
      if (data?.synced_count > 0) {
        toast.success(`${data.synced_count} agendamento(s) sincronizado(s) com Google Calendar`);
      } else if (data?.message) {
        toast.info(data.message);
      } else {
        toast.info('Nenhum agendamento pendente para sincronizar');
      }
    } catch (err: any) {
      console.error('Erro ao sincronizar com Google Calendar:', err);
      toast.error('Erro ao sincronizar. Verifique se há profissionais conectados ao Google Calendar.');
    } finally {
      setSyncingCalendar(false);
    }
  };

  // Fetch store slug for public link
  useEffect(() => {
    const fetchStoreSlug = async () => {
      if (!storeId) return;
      const { data } = await supabase
        .from('stores')
        .select('slug')
        .eq('id', storeId)
        .single();
      if (data) setStoreSlug(data.slug);
    };
    fetchStoreSlug();
  }, [storeId]);

  return { storeSlug, syncingCalendar, handleSyncGoogleCalendar };
}
