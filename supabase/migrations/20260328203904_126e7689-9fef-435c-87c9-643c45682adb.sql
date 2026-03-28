
-- Índices compostos para queries filtradas por tipo + data
CREATE INDEX IF NOT EXISTS idx_webhook_logs_type_created 
ON public.webhook_logs (webhook_type, created_at DESC);

-- Índice composto para page_visits: store_id + created_at (queries do VisitsAnalytics)
CREATE INDEX IF NOT EXISTS idx_page_visits_store_created 
ON public.page_visits (store_id, created_at DESC);

-- Índice composto para webhook_logs cleanup (delete por created_at)
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at_status 
ON public.webhook_logs (created_at, status);
