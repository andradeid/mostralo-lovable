-- Criar storage bucket para logos e capas das lojas
INSERT INTO storage.buckets (id, name, public) VALUES ('store-assets', 'store-assets', true);

-- Policies para o bucket store-assets
CREATE POLICY "Store assets são publicamente acessíveis" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'store-assets');

CREATE POLICY "Admins podem fazer upload de assets das lojas" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'store-assets' AND 
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('master_admin', 'store_admin')))
);

CREATE POLICY "Admins podem atualizar assets das lojas" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'store-assets' AND 
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('master_admin', 'store_admin')))
);

CREATE POLICY "Admins podem deletar assets das lojas" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'store-assets' AND 
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type IN ('master_admin', 'store_admin')))
);

-- Expandir tabela stores com novos campos
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS responsible_name TEXT,
ADD COLUMN IF NOT EXISTS responsible_email TEXT,
ADD COLUMN IF NOT EXISTS responsible_phone TEXT,
ADD COLUMN IF NOT EXISTS responsible_cpf TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS facebook TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_order_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS accepts_cash BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS accepts_card BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS accepts_pix BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS payment_gateways JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS delivery_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS analytics_config JSONB DEFAULT '{}';

-- Criar tabela para configurações avançadas das lojas
CREATE TABLE IF NOT EXISTS public.store_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Configurações de aparência
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#10B981',
  product_display_layout TEXT DEFAULT 'grid', -- grid, list, carousel
  
  -- Configurações de pagamento
  online_payment_enabled BOOLEAN DEFAULT false,
  pix_key TEXT,
  mercado_pago_token TEXT,
  stripe_config JSONB DEFAULT '{}',
  
  -- Configurações de entrega
  delivery_zones JSONB DEFAULT '[]',
  delivery_times JSONB DEFAULT '{}',
  qr_code_enabled BOOLEAN DEFAULT false,
  qr_code_url TEXT,
  
  -- Configurações de contato
  social_media JSONB DEFAULT '{}',
  google_analytics_id TEXT,
  facebook_pixel_id TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de configurações
ALTER TABLE public.store_configurations ENABLE ROW LEVEL SECURITY;

-- Policies para store_configurations
CREATE POLICY "Master admins podem gerenciar todas as configurações" 
ON public.store_configurations 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND user_type = 'master_admin'
));

CREATE POLICY "Store admins podem gerenciar configurações das suas lojas" 
ON public.store_configurations 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.stores 
  WHERE id = store_configurations.store_id AND owner_id = auth.uid()
));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_store_configurations_updated_at
  BEFORE UPDATE ON public.store_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir configurações padrão para lojas existentes
INSERT INTO public.store_configurations (store_id)
SELECT id FROM public.stores 
WHERE id NOT IN (SELECT store_id FROM public.store_configurations);