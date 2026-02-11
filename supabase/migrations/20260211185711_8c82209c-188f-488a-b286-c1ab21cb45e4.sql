
-- Tabela para registrar visitas de páginas
CREATE TABLE public.page_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_url TEXT NOT NULL,
  session_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  country TEXT,
  city TEXT,
  region TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  store_id UUID,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para consultas do dashboard
CREATE INDEX idx_page_visits_created_at ON public.page_visits (created_at DESC);
CREATE INDEX idx_page_visits_page_url ON public.page_visits (page_url);
CREATE INDEX idx_page_visits_session_id ON public.page_visits (session_id);
CREATE INDEX idx_page_visits_store_id ON public.page_visits (store_id);
CREATE INDEX idx_page_visits_device_type ON public.page_visits (device_type);
CREATE INDEX idx_page_visits_country ON public.page_visits (country);

-- RLS
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

-- Inserção pública (anon) para registrar visitas
CREATE POLICY "Allow anonymous insert for tracking"
ON public.page_visits
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Leitura apenas para master_admin
CREATE POLICY "Only master_admin can read visits"
ON public.page_visits
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'master_admin'
  )
);
