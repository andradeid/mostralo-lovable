
-- Tabela de ligação: categorias de produtos ↔ categorias de adicionais
CREATE TABLE public.category_addon_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  addon_category_id UUID NOT NULL REFERENCES public.addon_categories(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category_id, addon_category_id)
);

-- Enable RLS
ALTER TABLE public.category_addon_categories ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Store owners can manage category addon links"
ON public.category_addon_categories
FOR ALL
USING (
  store_id IN (
    SELECT id FROM public.stores WHERE owner_id = auth.uid()
  )
)
WITH CHECK (
  store_id IN (
    SELECT id FROM public.stores WHERE owner_id = auth.uid()
  )
);

-- Attendants can view
CREATE POLICY "Attendants can view category addon links"
ON public.category_addon_categories
FOR SELECT
USING (
  store_id IN (
    SELECT store_id FROM public.attendant_permissions WHERE user_id = auth.uid()
  )
);

-- Index for performance
CREATE INDEX idx_category_addon_categories_category ON public.category_addon_categories(category_id);
CREATE INDEX idx_category_addon_categories_store ON public.category_addon_categories(store_id);
