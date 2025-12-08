-- Adicionar coluna key na tabela modules
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS key text UNIQUE;

-- Criar tabela store_modules para registrar bloqueios
CREATE TABLE public.store_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT false,
  blocked_at timestamp with time zone DEFAULT now(),
  blocked_by uuid REFERENCES auth.users(id),
  blocked_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(store_id, module_id)
);

-- Habilitar RLS
ALTER TABLE public.store_modules ENABLE ROW LEVEL SECURITY;

-- Policies para master_admin gerenciar
CREATE POLICY "Master admins can manage store_modules"
ON public.store_modules
FOR ALL
USING (has_role(auth.uid(), 'master_admin'))
WITH CHECK (has_role(auth.uid(), 'master_admin'));

-- Store admins podem visualizar seus próprios bloqueios
CREATE POLICY "Store admins can view their store_modules"
ON public.store_modules
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE stores.id = store_modules.store_id
    AND stores.owner_id = auth.uid()
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_store_modules_updated_at
BEFORE UPDATE ON public.store_modules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Atualizar módulos existentes com keys
UPDATE public.modules SET key = 'digital_menu' WHERE name = 'Cardápio Digital';
UPDATE public.modules SET key = 'order_management' WHERE name = 'Gestão de Pedidos';
UPDATE public.modules SET key = 'reports' WHERE name = 'Relatórios';
UPDATE public.modules SET key = 'customization' WHERE name = 'Personalização';
UPDATE public.modules SET key = 'whatsapp' WHERE name = 'WhatsApp Integration';
UPDATE public.modules SET key = 'delivery' WHERE name = 'Delivery';

-- Inserir novos módulos
INSERT INTO public.modules (name, description, icon, key, is_active) VALUES
  ('Entregadores', 'Gestão de entregadores e entregas', 'Truck', 'delivery_drivers', true),
  ('Impressão', 'Configuração de impressão térmica', 'Printer', 'printing', true),
  ('Promoções', 'Sistema de promoções e cupons', 'Tag', 'promotions', true),
  ('Marketing Digital', 'Integração com marketing e redes sociais', 'Megaphone', 'marketing', true),
  ('Pedidos Agendados', 'Sistema de agendamento de pedidos', 'Calendar', 'scheduled_orders', true)
ON CONFLICT (key) DO NOTHING;