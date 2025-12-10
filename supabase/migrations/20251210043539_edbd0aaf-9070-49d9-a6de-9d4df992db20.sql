
-- Adicionar módulo WhatsApp Recuperação
INSERT INTO modules (name, description, icon, key, is_active)
VALUES (
  'WhatsApp Recuperação',
  'Conecte seu WhatsApp e envie campanhas automatizadas para recuperar clientes inativos',
  'MessageCircle',
  'whatsapp_recovery',
  true
);

-- Criar enum para status de instância WhatsApp
CREATE TYPE whatsapp_instance_status AS ENUM ('disconnected', 'connecting', 'connected', 'banned');

-- Criar enum para status de campanha
CREATE TYPE whatsapp_campaign_status AS ENUM ('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled');

-- Criar enum para status de mensagem
CREATE TYPE whatsapp_message_status AS ENUM ('pending', 'queued', 'sent', 'delivered', 'read', 'failed');

-- Criar enum para tipo de mensagem
CREATE TYPE whatsapp_message_type AS ENUM ('text', 'image', 'document', 'audio', 'video');

-- Tabela de configuração global da Evolution API (master admin)
CREATE TABLE evolution_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_url text NOT NULL,
  api_key text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE evolution_config ENABLE ROW LEVEL SECURITY;

-- Política: apenas master_admin pode gerenciar
CREATE POLICY "Master admins can manage evolution config"
ON evolution_config FOR ALL
USING (has_role(auth.uid(), 'master_admin'))
WITH CHECK (has_role(auth.uid(), 'master_admin'));

-- Tabela de instâncias WhatsApp (1 por loja)
CREATE TABLE whatsapp_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  instance_name text NOT NULL,
  instance_id text, -- ID retornado pela Evolution API
  status whatsapp_instance_status DEFAULT 'disconnected',
  phone_number text,
  profile_name text,
  profile_picture_url text,
  qr_code text,
  last_connected_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT whatsapp_instances_store_unique UNIQUE (store_id)
);

-- Habilitar RLS
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Política: store owners podem gerenciar suas instâncias
CREATE POLICY "Store owners can manage their whatsapp instances"
ON whatsapp_instances FOR ALL
USING (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = whatsapp_instances.store_id AND stores.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = whatsapp_instances.store_id AND stores.owner_id = auth.uid()
));

-- Política: master admin pode ver todas
CREATE POLICY "Master admins can view all whatsapp instances"
ON whatsapp_instances FOR SELECT
USING (has_role(auth.uid(), 'master_admin'));

-- Tabela de templates de mensagem
CREATE TABLE whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL, -- 'recuperacao', 'boas_vindas', 'promocao', 'agradecimento', 'custom'
  message_type whatsapp_message_type DEFAULT 'text',
  content text NOT NULL, -- Texto com variáveis {nome}, {dias_inativo}, etc
  media_url text, -- URL da mídia se não for texto
  media_caption text, -- Legenda para mídia
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Política: store owners podem gerenciar seus templates
CREATE POLICY "Store owners can manage their whatsapp templates"
ON whatsapp_templates FOR ALL
USING (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = whatsapp_templates.store_id AND stores.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = whatsapp_templates.store_id AND stores.owner_id = auth.uid()
));

-- Tabela de campanhas
CREATE TABLE whatsapp_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  template_id uuid REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  status whatsapp_campaign_status DEFAULT 'draft',
  
  -- Segmentação
  filter_days_inactive integer, -- Clientes inativos há X dias
  filter_min_orders integer, -- Mínimo de pedidos
  filter_max_orders integer, -- Máximo de pedidos
  filter_min_spent numeric, -- Mínimo gasto
  filter_max_spent numeric, -- Máximo gasto
  filter_last_order_after timestamp with time zone, -- Último pedido após
  filter_last_order_before timestamp with time zone, -- Último pedido antes
  
  -- Configuração de disparo
  message_interval_seconds integer DEFAULT 30, -- Intervalo entre mensagens
  daily_limit integer DEFAULT 100, -- Limite diário de envios
  scheduled_start_at timestamp with time zone, -- Quando iniciar
  start_hour integer DEFAULT 9, -- Hora de início (9h)
  end_hour integer DEFAULT 21, -- Hora de término (21h)
  
  -- Estatísticas
  total_recipients integer DEFAULT 0,
  messages_sent integer DEFAULT 0,
  messages_delivered integer DEFAULT 0,
  messages_read integer DEFAULT 0,
  messages_failed integer DEFAULT 0,
  
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE whatsapp_campaigns ENABLE ROW LEVEL SECURITY;

-- Política: store owners podem gerenciar suas campanhas
CREATE POLICY "Store owners can manage their whatsapp campaigns"
ON whatsapp_campaigns FOR ALL
USING (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = whatsapp_campaigns.store_id AND stores.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = whatsapp_campaigns.store_id AND stores.owner_id = auth.uid()
));

-- Política: master admin pode ver todas
CREATE POLICY "Master admins can view all whatsapp campaigns"
ON whatsapp_campaigns FOR SELECT
USING (has_role(auth.uid(), 'master_admin'));

-- Tabela de log de mensagens
CREATE TABLE whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES whatsapp_campaigns(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  template_id uuid REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
  
  phone_number text NOT NULL,
  customer_name text,
  message_type whatsapp_message_type DEFAULT 'text',
  content text NOT NULL, -- Mensagem final enviada (variáveis substituídas)
  media_url text,
  
  status whatsapp_message_status DEFAULT 'pending',
  evolution_message_id text, -- ID retornado pela Evolution API
  error_message text,
  
  scheduled_for timestamp with time zone,
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  read_at timestamp with time zone,
  failed_at timestamp with time zone,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Política: store owners podem ver suas mensagens
CREATE POLICY "Store owners can view their whatsapp messages"
ON whatsapp_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = whatsapp_messages.store_id AND stores.owner_id = auth.uid()
));

-- Política: sistema pode inserir/atualizar mensagens
CREATE POLICY "System can manage whatsapp messages"
ON whatsapp_messages FOR ALL
USING (true)
WITH CHECK (true);

-- Política: master admin pode ver todas
CREATE POLICY "Master admins can view all whatsapp messages"
ON whatsapp_messages FOR SELECT
USING (has_role(auth.uid(), 'master_admin'));

-- Índices para performance
CREATE INDEX idx_whatsapp_instances_store ON whatsapp_instances(store_id);
CREATE INDEX idx_whatsapp_templates_store ON whatsapp_templates(store_id);
CREATE INDEX idx_whatsapp_campaigns_store ON whatsapp_campaigns(store_id);
CREATE INDEX idx_whatsapp_campaigns_status ON whatsapp_campaigns(status);
CREATE INDEX idx_whatsapp_messages_store ON whatsapp_messages(store_id);
CREATE INDEX idx_whatsapp_messages_campaign ON whatsapp_messages(campaign_id);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX idx_whatsapp_messages_scheduled ON whatsapp_messages(scheduled_for) WHERE status = 'pending';

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_evolution_config_updated_at
  BEFORE UPDATE ON evolution_config
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER update_whatsapp_instances_updated_at
  BEFORE UPDATE ON whatsapp_instances
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER update_whatsapp_campaigns_updated_at
  BEFORE UPDATE ON whatsapp_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER update_whatsapp_messages_updated_at
  BEFORE UPDATE ON whatsapp_messages
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();
