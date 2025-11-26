-- Verificar se a tabela product_variants existe e criar se necessário
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para product_variants
CREATE POLICY "Anyone can view variants of available products from active stores" 
ON public.product_variants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM products 
    JOIN stores ON products.store_id = stores.id 
    WHERE products.id = product_variants.product_id 
    AND products.is_available = true 
    AND stores.status = 'active'
  ) 
  AND is_available = true
);

CREATE POLICY "Store owners can manage their product variants" 
ON public.product_variants 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM products 
    JOIN stores ON products.store_id = stores.id 
    WHERE products.id = product_variants.product_id 
    AND stores.owner_id = auth.uid()
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_display_order ON public.product_variants(product_id, display_order);