import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PausedContact {
  id: string;
  store_id: string;
  instance_name: string;
  remote_jid: string;
  customer_name: string | null;
  paused_at: string;
  auto_reactivate_at: string | null;
  status: string;
}

export function usePausedContacts(storeId: string | null) {
  const [contacts, setContacts] = useState<PausedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [reactivating, setReactivating] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    if (!storeId) return;

    try {
      const { data, error } = await supabase
        .from('whatsapp_paused_contacts')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'paused')
        .order('paused_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Erro ao buscar contatos pausados:', error);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchContacts();
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(fetchContacts, 30000);
    return () => clearInterval(interval);
  }, [fetchContacts]);

  const reactivateContact = async (contact: PausedContact) => {
    setReactivating(contact.id);
    try {
      const response = await supabase.functions.invoke('whatsapp-bot-pause', {
        body: {
          action: 'reactivate',
          storeId: contact.store_id,
          instanceName: contact.instance_name,
          remoteJid: contact.remote_jid,
          customerName: contact.customer_name,
        },
      });

      if (response.error) throw response.error;
      
      // Atualizar lista local
      setContacts(prev => prev.filter(c => c.id !== contact.id));
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao reativar bot:', error);
      return { success: false, error: error.message };
    } finally {
      setReactivating(null);
    }
  };

  const reactivateAll = async () => {
    const results = await Promise.all(
      contacts.map(contact => reactivateContact(contact))
    );
    return results;
  };

  return {
    contacts,
    loading,
    reactivating,
    refetch: fetchContacts,
    reactivateContact,
    reactivateAll,
  };
}
