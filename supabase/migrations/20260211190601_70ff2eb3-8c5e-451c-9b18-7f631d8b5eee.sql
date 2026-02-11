
-- Adicionar colunas event_type e event_label na tabela page_visits
ALTER TABLE public.page_visits ADD COLUMN event_type TEXT NOT NULL DEFAULT 'pageview';
ALTER TABLE public.page_visits ADD COLUMN event_label TEXT;

-- Índice para consultas rápidas por tipo de evento
CREATE INDEX idx_page_visits_event_type ON public.page_visits (event_type);
