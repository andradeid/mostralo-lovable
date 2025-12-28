-- Tabela de etiquetas de clientes
CREATE TABLE public.customer_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  description TEXT,
  label_type TEXT DEFAULT 'custom',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, name)
);

-- Tabela de atribuição de etiquetas aos clientes
CREATE TABLE public.customer_label_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES public.customer_labels(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(customer_id, label_id)
);

-- Índices para performance
CREATE INDEX idx_customer_labels_store_id ON public.customer_labels(store_id);
CREATE INDEX idx_customer_label_assignments_customer_id ON public.customer_label_assignments(customer_id);
CREATE INDEX idx_customer_label_assignments_label_id ON public.customer_label_assignments(label_id);
CREATE INDEX idx_customer_label_assignments_store_id ON public.customer_label_assignments(store_id);

-- Habilitar RLS
ALTER TABLE public.customer_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_label_assignments ENABLE ROW LEVEL SECURITY;

-- Policies para customer_labels (abertas para funcionamento)
CREATE POLICY "Anyone can view labels"
ON public.customer_labels FOR SELECT
USING (true);

CREATE POLICY "Authenticated can insert labels"
ON public.customer_labels FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update labels"
ON public.customer_labels FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can delete non-system labels"
ON public.customer_labels FOR DELETE
USING (auth.uid() IS NOT NULL AND is_system = false);

-- Policies para customer_label_assignments
CREATE POLICY "Anyone can view label assignments"
ON public.customer_label_assignments FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert label assignments"
ON public.customer_label_assignments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated can update label assignments"
ON public.customer_label_assignments FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can delete label assignments"
ON public.customer_label_assignments FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Função para criar etiquetas padrão quando uma loja é criada
CREATE OR REPLACE FUNCTION public.create_default_customer_labels()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.customer_labels (store_id, name, color, label_type, is_system, description) VALUES
    (NEW.id, 'Agendamento Online', '#22c55e', 'origin', true, 'Cliente veio pelo agendamento online'),
    (NEW.id, 'WhatsApp', '#25d366', 'origin', true, 'Cliente veio pelo WhatsApp'),
    (NEW.id, 'Loja Física', '#8b5cf6', 'origin', true, 'Cliente veio presencialmente'),
    (NEW.id, 'Indicação', '#f97316', 'origin', true, 'Cliente veio por indicação'),
    (NEW.id, 'Redes Sociais', '#ef4444', 'origin', true, 'Cliente veio pelas redes sociais'),
    (NEW.id, 'Delivery', '#3b82f6', 'channel', true, 'Comprou via delivery'),
    (NEW.id, 'Totem', '#6366f1', 'channel', true, 'Comprou via totem'),
    (NEW.id, 'E-commerce', '#ec4899', 'channel', true, 'Comprou via e-commerce'),
    (NEW.id, 'Balcão', '#14b8a6', 'channel', true, 'Comprou no balcão');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar etiquetas padrão em novas lojas
CREATE TRIGGER trigger_create_default_customer_labels
AFTER INSERT ON public.stores
FOR EACH ROW
EXECUTE FUNCTION public.create_default_customer_labels();

-- Trigger para atualizar updated_at
CREATE TRIGGER update_customer_labels_updated_at
BEFORE UPDATE ON public.customer_labels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();