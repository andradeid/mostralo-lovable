-- Tabela para armazenar tokens OAuth do Google Calendar para cada profissional
CREATE TABLE public.google_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  google_email TEXT,
  calendar_id TEXT DEFAULT 'primary',
  is_active BOOLEAN DEFAULT true,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(professional_id)
);

-- Tabela para mapear agendamentos aos eventos do Google Calendar
CREATE TABLE public.booking_google_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,
  google_calendar_id TEXT NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT now(),
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(booking_id)
);

-- Índices para performance
CREATE INDEX idx_google_calendar_tokens_professional ON public.google_calendar_tokens(professional_id);
CREATE INDEX idx_google_calendar_tokens_store ON public.google_calendar_tokens(store_id);
CREATE INDEX idx_booking_google_events_booking ON public.booking_google_events(booking_id);
CREATE INDEX idx_booking_google_events_store ON public.booking_google_events(store_id);

-- Habilitar RLS
ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_google_events ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para google_calendar_tokens
-- Profissionais podem ver/editar seus próprios tokens
CREATE POLICY "Professionals can view own tokens"
ON public.google_calendar_tokens
FOR SELECT
USING (
  professional_id IN (
    SELECT id FROM public.professionals 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Professionals can insert own tokens"
ON public.google_calendar_tokens
FOR INSERT
WITH CHECK (
  professional_id IN (
    SELECT id FROM public.professionals 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Professionals can update own tokens"
ON public.google_calendar_tokens
FOR UPDATE
USING (
  professional_id IN (
    SELECT id FROM public.professionals 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Professionals can delete own tokens"
ON public.google_calendar_tokens
FOR DELETE
USING (
  professional_id IN (
    SELECT id FROM public.professionals 
    WHERE user_id = auth.uid()
  )
);

-- Store admins podem ver tokens dos profissionais da sua loja
CREATE POLICY "Store admins can view store tokens"
ON public.google_calendar_tokens
FOR SELECT
USING (
  store_id IN (
    SELECT store_id FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'store_admin'
  )
);

-- Políticas RLS para booking_google_events
CREATE POLICY "View booking events for own store"
ON public.booking_google_events
FOR SELECT
USING (
  store_id IN (
    SELECT store_id FROM public.profiles 
    WHERE id = auth.uid()
  )
  OR
  store_id IN (
    SELECT p.store_id FROM public.professionals p
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Insert booking events for own store"
ON public.booking_google_events
FOR INSERT
WITH CHECK (
  store_id IN (
    SELECT store_id FROM public.profiles 
    WHERE id = auth.uid()
  )
  OR
  store_id IN (
    SELECT p.store_id FROM public.professionals p
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Update booking events for own store"
ON public.booking_google_events
FOR UPDATE
USING (
  store_id IN (
    SELECT store_id FROM public.profiles 
    WHERE id = auth.uid()
  )
  OR
  store_id IN (
    SELECT p.store_id FROM public.professionals p
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Delete booking events for own store"
ON public.booking_google_events
FOR DELETE
USING (
  store_id IN (
    SELECT store_id FROM public.profiles 
    WHERE id = auth.uid()
  )
  OR
  store_id IN (
    SELECT p.store_id FROM public.professionals p
    WHERE p.user_id = auth.uid()
  )
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_google_calendar_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_google_calendar_tokens_updated_at
BEFORE UPDATE ON public.google_calendar_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_google_calendar_tokens_updated_at();