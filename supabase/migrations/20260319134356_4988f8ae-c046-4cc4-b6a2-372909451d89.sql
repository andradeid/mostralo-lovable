
-- ============================================
-- Tabelas para Chat WhatsApp do Master Admin
-- ============================================

-- 1. Conversas do Master
CREATE TABLE public.master_whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES public.master_whatsapp_config(id) ON DELETE CASCADE,
  remote_jid TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  profile_picture_url TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_direction TEXT DEFAULT 'incoming',
  unread_count INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  is_bot_active BOOLEAN NOT NULL DEFAULT true,
  active_bot_type TEXT DEFAULT 'sales',
  assigned_to UUID REFERENCES auth.users(id),
  last_message_source TEXT,
  needs_human BOOLEAN DEFAULT false,
  needs_human_reason TEXT,
  internal_notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(config_id, remote_jid)
);

-- 2. Mensagens do Master
CREATE TABLE public.master_whatsapp_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES public.master_whatsapp_config(id) ON DELETE CASCADE,
  remote_jid TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'incoming',
  sender_name TEXT,
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text',
  media_url TEXT,
  media_filename TEXT,
  media_mimetype TEXT,
  is_from_bot BOOLEAN DEFAULT false,
  is_read_by_admin BOOLEAN DEFAULT false,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  evolution_message_id TEXT,
  metadata JSONB DEFAULT '{}',
  quoted_message_id UUID,
  quoted_content JSONB,
  reactions JSONB DEFAULT '[]',
  status TEXT DEFAULT 'sent',
  message_source TEXT
);

-- 3. Índices para performance
CREATE INDEX idx_master_wpp_conv_config ON public.master_whatsapp_conversations(config_id);
CREATE INDEX idx_master_wpp_conv_status ON public.master_whatsapp_conversations(status);
CREATE INDEX idx_master_wpp_conv_last_msg ON public.master_whatsapp_conversations(last_message_at DESC NULLS LAST);
CREATE INDEX idx_master_wpp_conv_remote_jid ON public.master_whatsapp_conversations(config_id, remote_jid);

CREATE INDEX idx_master_wpp_msg_config ON public.master_whatsapp_chat_messages(config_id);
CREATE INDEX idx_master_wpp_msg_remote_jid ON public.master_whatsapp_chat_messages(remote_jid);
CREATE INDEX idx_master_wpp_msg_timestamp ON public.master_whatsapp_chat_messages(config_id, remote_jid, timestamp DESC);
CREATE INDEX idx_master_wpp_msg_evolution_id ON public.master_whatsapp_chat_messages(evolution_message_id);

-- 4. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_master_wpp_conv_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_master_wpp_conv_updated_at
  BEFORE UPDATE ON public.master_whatsapp_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_master_wpp_conv_updated_at();

-- 5. RLS
ALTER TABLE public.master_whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_whatsapp_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies para master_whatsapp_conversations
CREATE POLICY "Master admins can view master conversations"
  ON public.master_whatsapp_conversations
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Master admins can update master conversations"
  ON public.master_whatsapp_conversations
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'master_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Master admins can insert master conversations"
  ON public.master_whatsapp_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

-- Policies para master_whatsapp_chat_messages
CREATE POLICY "Master admins can view master messages"
  ON public.master_whatsapp_chat_messages
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Master admins can insert master messages"
  ON public.master_whatsapp_chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "Master admins can update master messages"
  ON public.master_whatsapp_chat_messages
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'master_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

-- 6. Habilitar Realtime para as duas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE public.master_whatsapp_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.master_whatsapp_chat_messages;
