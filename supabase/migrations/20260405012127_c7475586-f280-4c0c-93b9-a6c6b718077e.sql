
-- Remover tabelas desnecessárias do Realtime para reduzir WAL polling
ALTER PUBLICATION supabase_realtime DROP TABLE public.store_invite_links;
ALTER PUBLICATION supabase_realtime DROP TABLE public.master_whatsapp_conversations;
ALTER PUBLICATION supabase_realtime DROP TABLE public.master_whatsapp_chat_messages;
