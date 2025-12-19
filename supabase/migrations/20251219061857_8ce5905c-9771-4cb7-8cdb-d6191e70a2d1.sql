-- Tabela de configuração do WhatsApp Master
CREATE TABLE public.master_whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Instância WhatsApp
  instance_name TEXT,
  instance_status TEXT DEFAULT 'disconnected',
  instance_phone TEXT,
  evolution_instance_id TEXT,
  
  -- Bot de Vendas
  sales_bot_enabled BOOLEAN DEFAULT true,
  sales_bot_approach TEXT DEFAULT 'intermediate' CHECK (sales_bot_approach IN ('basic', 'intermediate', 'aggressive')),
  sales_bot_keywords TEXT[] DEFAULT ARRAY['preço', 'plano', 'delivery', 'quanto custa', 'ifood', 'taxa', 'sistema', 'cardápio', 'loja', 'menu'],
  sales_bot_evolution_id TEXT,
  
  -- Bot de Recrutamento
  recruitment_bot_enabled BOOLEAN DEFAULT true,
  recruitment_bot_approach TEXT DEFAULT 'moderate' CHECK (recruitment_bot_approach IN ('cold_lead', 'moderate', 'aggressive', 'super_aggressive')),
  recruitment_bot_keywords TEXT[] DEFAULT ARRAY['trabalhar', 'vender', 'ganhar', 'comissão', 'afiliado', 'renda', 'parceiro', 'vendedor', 'oportunidade', 'emprego'],
  recruitment_bot_evolution_id TEXT,
  
  -- Bot de Suporte
  support_bot_enabled BOOLEAN DEFAULT true,
  support_bot_keywords TEXT[] DEFAULT ARRAY['dúvida', 'ajuda', 'funciona', 'problema', 'como usar', 'suporte', 'não entendi', 'erro', 'bug'],
  support_bot_evolution_id TEXT,
  support_bot_custom_prompt TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(admin_user_id)
);

-- Tabela de sessões de conversa do Master
CREATE TABLE public.master_whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES public.master_whatsapp_config(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  active_bot_type TEXT CHECK (active_bot_type IN ('sales', 'recruitment', 'support')),
  bot_paused BOOLEAN DEFAULT false,
  paused_at TIMESTAMPTZ,
  paused_reason TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  messages_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_master_whatsapp_sessions_phone ON public.master_whatsapp_sessions(phone_number);
CREATE INDEX idx_master_whatsapp_sessions_config ON public.master_whatsapp_sessions(config_id);

-- RLS
ALTER TABLE public.master_whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para master_whatsapp_config
CREATE POLICY "Master admins can manage their own config" 
ON public.master_whatsapp_config 
FOR ALL 
USING (
  auth.uid() = admin_user_id 
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'master_admin')
);

-- Políticas para master_whatsapp_sessions
CREATE POLICY "Master admins can view all sessions" 
ON public.master_whatsapp_sessions 
FOR ALL 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'master_admin')
);

-- Trigger para updated_at
CREATE TRIGGER update_master_whatsapp_config_updated_at
BEFORE UPDATE ON public.master_whatsapp_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_master_whatsapp_sessions_updated_at
BEFORE UPDATE ON public.master_whatsapp_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();