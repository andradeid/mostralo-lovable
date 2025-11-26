-- Criar tabela de configurações de impressão
CREATE TABLE IF NOT EXISTS public.print_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('complete', 'kitchen', 'delivery')),
  print_type TEXT NOT NULL CHECK (print_type IN ('thermal_58mm', 'thermal_80mm', 'a4')),
  
  -- Configurações de seções (visibilidade)
  sections JSONB NOT NULL DEFAULT '{
    "header": true,
    "orderInfo": true,
    "customerInfo": true,
    "items": true,
    "totals": true,
    "payment": true,
    "footer": true
  }'::jsonb,
  
  -- Configurações de estilo
  styles JSONB NOT NULL DEFAULT '{
    "fontSize": "medium",
    "fontFamily": "monospace",
    "headerAlign": "center",
    "itemsAlign": "left",
    "boldTitles": true,
    "showSeparators": true
  }'::jsonb,
  
  -- Textos personalizados
  custom_texts JSONB NOT NULL DEFAULT '{
    "headerText": "",
    "footerText": "Obrigado pela preferência!"
  }'::jsonb,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(store_id, document_type, print_type)
);

-- RLS Policies
ALTER TABLE public.print_configurations ENABLE ROW LEVEL SECURITY;

-- Lojistas podem ver suas configurações
CREATE POLICY "Store owners can view their print configs"
  ON public.print_configurations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = print_configurations.store_id
      AND stores.owner_id = auth.uid()
    )
  );

-- Lojistas podem gerenciar suas configurações
CREATE POLICY "Store owners can manage their print configs"
  ON public.print_configurations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = print_configurations.store_id
      AND stores.owner_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_print_configurations_updated_at
  BEFORE UPDATE ON public.print_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários
COMMENT ON TABLE public.print_configurations IS 'Configurações de impressão por loja e tipo de documento';
COMMENT ON COLUMN public.print_configurations.document_type IS 'Tipo de documento: complete (completo), kitchen (cozinha), delivery (entregador)';
COMMENT ON COLUMN public.print_configurations.print_type IS 'Tipo de impressora: thermal_58mm, thermal_80mm, a4';