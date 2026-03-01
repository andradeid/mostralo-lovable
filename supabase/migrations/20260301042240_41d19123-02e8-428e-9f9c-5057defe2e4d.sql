
-- =============================================
-- MÓDULO DE CHAT WHATSAPP - TABELAS PRINCIPAIS
-- =============================================

-- 1. Tabela de mensagens do chat (bidirecional)
CREATE TABLE public.whatsapp_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  remote_jid TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  sender_name TEXT,
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document', 'location', 'sticker', 'reaction')),
  media_url TEXT,
  media_mimetype TEXT,
  media_filename TEXT,
  evolution_message_id TEXT,
  is_from_bot BOOLEAN NOT NULL DEFAULT false,
  is_read_by_attendant BOOLEAN NOT NULL DEFAULT false,
  quoted_message_id UUID REFERENCES public.whatsapp_chat_messages(id),
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabela de conversas (agregação por contato)
CREATE TABLE public.whatsapp_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  remote_jid TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  profile_picture_url TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_direction TEXT CHECK (last_message_direction IN ('incoming', 'outgoing')),
  unread_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'muted')),
  assigned_to UUID REFERENCES public.profiles(id),
  is_bot_active BOOLEAN NOT NULL DEFAULT true,
  customer_id UUID REFERENCES public.customers(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, remote_jid)
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

-- Mensagens: busca por conversa (mais comum)
CREATE INDEX idx_chat_messages_conversation ON public.whatsapp_chat_messages(store_id, remote_jid, timestamp DESC);

-- Mensagens: busca por evolution_message_id (dedup)
CREATE UNIQUE INDEX idx_chat_messages_evolution_id ON public.whatsapp_chat_messages(evolution_message_id) WHERE evolution_message_id IS NOT NULL;

-- Mensagens: não lidas
CREATE INDEX idx_chat_messages_unread ON public.whatsapp_chat_messages(store_id, is_read_by_attendant) WHERE is_read_by_attendant = false;

-- Conversas: ordenação por última mensagem
CREATE INDEX idx_conversations_last_message ON public.whatsapp_conversations(store_id, last_message_at DESC);

-- Conversas: não lidas
CREATE INDEX idx_conversations_unread ON public.whatsapp_conversations(store_id, unread_count) WHERE unread_count > 0;

-- =============================================
-- RLS (Row Level Security)
-- =============================================

ALTER TABLE public.whatsapp_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

-- Mensagens: admin da loja pode ver/inserir
CREATE POLICY "Store admins can view chat messages"
  ON public.whatsapp_chat_messages FOR SELECT
  USING (public.is_store_admin_of(store_id));

CREATE POLICY "Store admins can insert chat messages"
  ON public.whatsapp_chat_messages FOR INSERT
  WITH CHECK (public.is_store_admin_of(store_id));

CREATE POLICY "Store admins can update chat messages"
  ON public.whatsapp_chat_messages FOR UPDATE
  USING (public.is_store_admin_of(store_id));

-- Mensagens: atendentes podem ver/inserir
CREATE POLICY "Attendants can view chat messages"
  ON public.whatsapp_chat_messages FOR SELECT
  USING (public.is_attendant_for_store(store_id));

CREATE POLICY "Attendants can insert chat messages"
  ON public.whatsapp_chat_messages FOR INSERT
  WITH CHECK (public.is_attendant_for_store(store_id));

CREATE POLICY "Attendants can update chat messages"
  ON public.whatsapp_chat_messages FOR UPDATE
  USING (public.is_attendant_for_store(store_id));

-- Conversas: admin da loja
CREATE POLICY "Store admins can view conversations"
  ON public.whatsapp_conversations FOR SELECT
  USING (public.is_store_admin_of(store_id));

CREATE POLICY "Store admins can insert conversations"
  ON public.whatsapp_conversations FOR INSERT
  WITH CHECK (public.is_store_admin_of(store_id));

CREATE POLICY "Store admins can update conversations"
  ON public.whatsapp_conversations FOR UPDATE
  USING (public.is_store_admin_of(store_id));

-- Conversas: atendentes
CREATE POLICY "Attendants can view conversations"
  ON public.whatsapp_conversations FOR SELECT
  USING (public.is_attendant_for_store(store_id));

CREATE POLICY "Attendants can update conversations"
  ON public.whatsapp_conversations FOR UPDATE
  USING (public.is_attendant_for_store(store_id));

-- =============================================
-- TRIGGER para updated_at em conversas
-- =============================================

CREATE TRIGGER update_whatsapp_conversations_updated_at
  BEFORE UPDATE ON public.whatsapp_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_whatsapp_updated_at();

-- =============================================
-- HABILITAR REALTIME
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;

-- =============================================
-- POLICY para service_role (edge functions)
-- =============================================

-- Edge functions usam service_role que bypassa RLS automaticamente
-- Não precisa de policy extra
