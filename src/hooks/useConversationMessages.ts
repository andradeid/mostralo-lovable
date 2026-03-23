import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ConversationMessage {
  id: string;
  content: string | null;
  direction: string;
  is_from_bot: boolean;
  message_type: string;
  timestamp: string;
  sender_name: string | null;
  media_url: string | null;
}

export type MessageSender = 'cliente' | 'ia' | 'atendente';

export function getMessageSender(msg: ConversationMessage): MessageSender {
  if (msg.direction === 'incoming') return 'cliente';
  if (msg.is_from_bot) return 'ia';
  return 'atendente';
}

export function useConversationMessages(storeId: string | undefined, remoteJid: string | undefined) {
  return useQuery({
    queryKey: ['conversation-messages', storeId, remoteJid],
    queryFn: async () => {
      if (!storeId || !remoteJid) return [];

      const { data, error } = await supabase
        .from('whatsapp_chat_messages')
        .select('id, content, direction, is_from_bot, message_type, timestamp, sender_name, media_url')
        .eq('store_id', storeId)
        .eq('remote_jid', remoteJid)
        .order('timestamp', { ascending: true })
        .limit(500);

      if (error) throw error;
      return (data || []) as ConversationMessage[];
    },
    enabled: !!storeId && !!remoteJid
  });
}
