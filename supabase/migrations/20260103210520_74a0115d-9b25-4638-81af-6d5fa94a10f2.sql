-- Adicionar campos para cartões de loja/profissionais
ALTER TABLE public.digital_cards 
ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS professional_id uuid REFERENCES public.professionals(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS inherit_store_data boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS booking_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS booking_button_text text DEFAULT 'Agendar Horário';

-- Atualizar constraint de owner_type
ALTER TABLE public.digital_cards DROP CONSTRAINT IF EXISTS digital_cards_owner_type_check;
ALTER TABLE public.digital_cards ADD CONSTRAINT digital_cards_owner_type_check 
  CHECK (owner_type IN ('salesperson', 'admin', 'store'));

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_digital_cards_store_id ON public.digital_cards(store_id) WHERE store_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_digital_cards_professional_id ON public.digital_cards(professional_id) WHERE professional_id IS NOT NULL;

-- RLS: Lojista pode gerenciar cartões da própria loja
CREATE POLICY "Store owners can view their store cards"
ON public.digital_cards FOR SELECT
USING (
  store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  OR owner_id = auth.uid()
);

CREATE POLICY "Store owners can insert store cards"
ON public.digital_cards FOR INSERT
WITH CHECK (
  store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  OR owner_id = auth.uid()
);

CREATE POLICY "Store owners can update store cards"
ON public.digital_cards FOR UPDATE
USING (
  store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  OR owner_id = auth.uid()
);

CREATE POLICY "Store owners can delete store cards"
ON public.digital_cards FOR DELETE
USING (
  store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid())
  OR owner_id = auth.uid()
);

-- Profissional pode ver seu próprio cartão
CREATE POLICY "Professionals can view their own card"
ON public.digital_cards FOR SELECT
USING (
  professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
);