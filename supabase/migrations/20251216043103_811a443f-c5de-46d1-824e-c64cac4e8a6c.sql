-- =============================================
-- FASE 1: Alterações na tabela evolution_config
-- =============================================

ALTER TABLE evolution_config 
ADD COLUMN IF NOT EXISTS openai_api_key TEXT,
ADD COLUMN IF NOT EXISTS openai_creds_id TEXT,
ADD COLUMN IF NOT EXISTS openai_default_model TEXT DEFAULT 'gpt-4-turbo',
ADD COLUMN IF NOT EXISTS openai_max_tokens INTEGER DEFAULT 1000;

-- =============================================
-- FASE 2: Tabela de configuração de bot por loja
-- =============================================

CREATE TABLE IF NOT EXISTS store_bot_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  whatsapp_instance_id UUID REFERENCES whatsapp_instances(id) ON DELETE SET NULL,
  
  -- Configurações básicas
  enabled BOOLEAN DEFAULT false,
  bot_name TEXT DEFAULT 'Assistente Virtual',
  
  -- Comportamento (nativo Evolution)
  stop_bot_from_me BOOLEAN DEFAULT true,
  listening_from_me BOOLEAN DEFAULT false,
  delay_message INTEGER DEFAULT 1500,
  
  -- Sessão (nativo Evolution)
  expire_minutes INTEGER DEFAULT 20,
  keyword_finish TEXT DEFAULT '#SAIR',
  unknown_message TEXT DEFAULT 'Desculpe, não entendi. Digite #SAIR para encerrar.',
  keep_open BOOLEAN DEFAULT false,
  debounce_time INTEGER DEFAULT 10,
  
  -- Gatilho (nativo Evolution)
  trigger_type TEXT DEFAULT 'all' CHECK (trigger_type IN ('all', 'keyword', 'none')),
  trigger_operator TEXT DEFAULT 'contains' CHECK (trigger_operator IN ('contains', 'equals', 'startsWith', 'endsWith', 'regex')),
  trigger_value TEXT,
  
  -- Ignorar contatos
  ignore_jids TEXT[] DEFAULT '{}',
  
  -- IDs da Evolution
  evolution_bot_id TEXT,
  evolution_bot_status TEXT DEFAULT 'pending',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(store_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_store_bot_config_store_id ON store_bot_config(store_id);
CREATE INDEX IF NOT EXISTS idx_store_bot_config_enabled ON store_bot_config(enabled);

-- RLS
ALTER TABLE store_bot_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Store owners can manage their bot config"
ON store_bot_config FOR ALL
USING (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = store_bot_config.store_id AND stores.owner_id = auth.uid()
));

CREATE POLICY "Master admins can view all bot configs"
ON store_bot_config FOR SELECT
USING (has_role(auth.uid(), 'master_admin'::app_role));

-- =============================================
-- FASE 3: Tabela de ambiente de testes master admin
-- =============================================

CREATE TABLE IF NOT EXISTS master_admin_test_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Instância de Teste
  test_instance_name TEXT,
  test_instance_id TEXT,
  test_instance_status TEXT DEFAULT 'disconnected',
  test_instance_qr_code TEXT,
  test_phone_number TEXT,
  
  -- Loja Sandbox
  sandbox_store_name TEXT DEFAULT 'Pizzaria Teste',
  sandbox_store_description TEXT DEFAULT 'Loja fictícia para testes do sistema de Bot IA',
  sandbox_products JSONB DEFAULT '[
    {"id": "1", "name": "Pizza Margherita", "price": 39.90, "category": "Pizzas", "description": "Molho de tomate, mussarela e manjericão"},
    {"id": "2", "name": "Pizza Calabresa", "price": 44.90, "category": "Pizzas", "description": "Calabresa, cebola e mussarela"},
    {"id": "3", "name": "Pizza Portuguesa", "price": 49.90, "category": "Pizzas", "description": "Presunto, ovos, cebola, azeitona e mussarela"},
    {"id": "4", "name": "Coca-Cola 2L", "price": 12.00, "category": "Bebidas", "description": "Refrigerante Coca-Cola 2 litros"},
    {"id": "5", "name": "Guaraná 2L", "price": 10.00, "category": "Bebidas", "description": "Refrigerante Guaraná Antarctica 2 litros"}
  ]'::jsonb,
  sandbox_categories JSONB DEFAULT '[
    {"id": "1", "name": "Pizzas", "description": "Nossas deliciosas pizzas artesanais"},
    {"id": "2", "name": "Bebidas", "description": "Refrigerantes e sucos"}
  ]'::jsonb,
  sandbox_business_hours JSONB DEFAULT '{
    "monday": {"open": "18:00", "close": "23:00"},
    "tuesday": {"open": "18:00", "close": "23:00"},
    "wednesday": {"open": "18:00", "close": "23:00"},
    "thursday": {"open": "18:00", "close": "23:00"},
    "friday": {"open": "18:00", "close": "00:00"},
    "saturday": {"open": "18:00", "close": "00:00"},
    "sunday": {"open": "18:00", "close": "23:00"}
  }'::jsonb,
  sandbox_whatsapp TEXT DEFAULT '5561999999999',
  sandbox_address TEXT DEFAULT 'Rua das Pizzas, 123 - Centro',
  
  -- Configurações Bot IA de Teste
  bot_enabled BOOLEAN DEFAULT false,
  bot_name TEXT DEFAULT 'Luna Teste',
  bot_system_prompt TEXT,
  bot_delay_message INTEGER DEFAULT 1500,
  bot_stop_from_me BOOLEAN DEFAULT true,
  bot_expire_minutes INTEGER DEFAULT 20,
  bot_keyword_finish TEXT DEFAULT '#SAIR',
  bot_trigger_type TEXT DEFAULT 'all',
  bot_trigger_value TEXT,
  bot_evolution_id TEXT,
  
  -- Logs e métricas de teste
  last_test_at TIMESTAMPTZ,
  test_messages_count INTEGER DEFAULT 0,
  test_logs JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(admin_user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_master_admin_test_config_user ON master_admin_test_config(admin_user_id);

-- RLS
ALTER TABLE master_admin_test_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - apenas master admin pode gerenciar seu próprio ambiente de teste
CREATE POLICY "Master admins can manage their test config"
ON master_admin_test_config FOR ALL
USING (
  admin_user_id = auth.uid() AND 
  has_role(auth.uid(), 'master_admin'::app_role)
)
WITH CHECK (
  admin_user_id = auth.uid() AND 
  has_role(auth.uid(), 'master_admin'::app_role)
);

-- =============================================
-- FASE 4: Triggers para updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_store_bot_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_store_bot_config_updated_at
BEFORE UPDATE ON store_bot_config
FOR EACH ROW
EXECUTE FUNCTION update_store_bot_config_updated_at();

CREATE TRIGGER trigger_master_admin_test_config_updated_at
BEFORE UPDATE ON master_admin_test_config
FOR EACH ROW
EXECUTE FUNCTION update_store_bot_config_updated_at();