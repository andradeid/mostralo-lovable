-- Tabela de avaliações de agendamentos
CREATE TABLE public.booking_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  token VARCHAR(64) UNIQUE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  is_public BOOLEAN DEFAULT true,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days')
);

-- Índices para performance
CREATE INDEX idx_booking_reviews_token ON public.booking_reviews(token);
CREATE INDEX idx_booking_reviews_professional ON public.booking_reviews(professional_id);
CREATE INDEX idx_booking_reviews_store ON public.booking_reviews(store_id);
CREATE INDEX idx_booking_reviews_booking ON public.booking_reviews(booking_id);

-- Habilitar RLS
ALTER TABLE public.booking_reviews ENABLE ROW LEVEL SECURITY;

-- Policy para leitura pública via token (para página de avaliação)
CREATE POLICY "Allow public read by token" ON public.booking_reviews
  FOR SELECT USING (true);

-- Policy para atualização via token (cliente enviando avaliação)
CREATE POLICY "Allow public update by token" ON public.booking_reviews
  FOR UPDATE USING (token IS NOT NULL AND reviewed_at IS NULL);

-- Policy para leitura por donos da loja (usando user_roles)
CREATE POLICY "Store owners can read reviews" ON public.booking_reviews
  FOR SELECT USING (
    store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid())
  );

-- Policy para profissionais verem suas avaliações
CREATE POLICY "Professionals can read own reviews" ON public.booking_reviews
  FOR SELECT USING (
    professional_id IN (SELECT id FROM public.professionals WHERE user_id = auth.uid())
  );

-- Policy para inserção por usuários autenticados (admin/atendente criando token)
CREATE POLICY "Authenticated users can insert reviews" ON public.booking_reviews
  FOR INSERT WITH CHECK (
    store_id IN (SELECT store_id FROM public.user_roles WHERE user_id = auth.uid())
  );