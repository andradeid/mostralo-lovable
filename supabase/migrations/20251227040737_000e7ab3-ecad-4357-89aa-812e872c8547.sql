-- Tabela para configuração do Totem de Autoatendimento
CREATE TABLE store_totem_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Ativação
  is_enabled BOOLEAN DEFAULT true,
  
  -- Aparência / Layout
  orientation TEXT DEFAULT 'vertical' CHECK (orientation IN ('horizontal', 'vertical')),
  theme_color TEXT DEFAULT '#f97316',
  background_color TEXT DEFAULT '#ffffff',
  dark_mode BOOLEAN DEFAULT false,
  show_logo BOOLEAN DEFAULT true,
  logo_size TEXT DEFAULT 'medium' CHECK (logo_size IN ('small', 'medium', 'large')),
  
  -- Tela Inicial
  welcome_title TEXT DEFAULT 'Bem-vindo!',
  welcome_subtitle TEXT DEFAULT 'Toque para começar seu pedido',
  show_welcome_image BOOLEAN DEFAULT true,
  welcome_image_url TEXT,
  
  -- Identificação do Cliente
  allow_customer_identification BOOLEAN DEFAULT true,
  identification_type TEXT DEFAULT 'optional' CHECK (identification_type IN ('none', 'optional', 'required')),
  identification_fields TEXT[] DEFAULT ARRAY['phone'],
  
  -- Produtos
  product_card_size TEXT DEFAULT 'medium' CHECK (product_card_size IN ('small', 'medium', 'large')),
  show_product_description BOOLEAN DEFAULT true,
  show_product_images BOOLEAN DEFAULT true,
  categories_position TEXT DEFAULT 'top' CHECK (categories_position IN ('top', 'left', 'hidden')),
  
  -- Carrinho
  cart_position TEXT DEFAULT 'bottom' CHECK (cart_position IN ('bottom', 'right', 'floating')),
  show_item_notes BOOLEAN DEFAULT true,
  
  -- Pagamento
  payment_methods TEXT[] DEFAULT ARRAY['pix'],
  pix_timeout_seconds INTEGER DEFAULT 300,
  
  -- Senha/Pedido
  password_display_duration_seconds INTEGER DEFAULT 15,
  show_order_summary_on_confirmation BOOLEAN DEFAULT true,
  auto_print_receipt BOOLEAN DEFAULT false,
  
  -- Comportamento
  inactivity_timeout_seconds INTEGER DEFAULT 60,
  inactivity_warning_seconds INTEGER DEFAULT 30,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(store_id)
);

-- Comentário na tabela
COMMENT ON TABLE store_totem_config IS 'Configurações do Totem de Autoatendimento por loja';

-- RLS
ALTER TABLE store_totem_config ENABLE ROW LEVEL SECURITY;

-- Policy para donos de loja e master admin
CREATE POLICY "Store owners can manage totem config"
  ON store_totem_config FOR ALL
  USING (
    EXISTS (SELECT 1 FROM stores WHERE id = store_totem_config.store_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'master_admin')
  );

-- Policy pública para leitura (para o totem funcionar sem autenticação)
CREATE POLICY "Public can read totem config for enabled stores"
  ON store_totem_config FOR SELECT
  USING (is_enabled = true);

-- Trigger para updated_at
CREATE TRIGGER update_store_totem_config_updated_at
  BEFORE UPDATE ON store_totem_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();