
-- Tabela de configuração de alertas do sistema via WhatsApp
CREATE TABLE public.system_alert_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  alert_phone TEXT, -- número sem código do país
  alert_country_code TEXT NOT NULL DEFAULT '+55',
  -- Thresholds
  max_connections_percent INTEGER NOT NULL DEFAULT 80, -- % do máximo de conexões
  min_cache_hit_ratio NUMERIC(5,2) NOT NULL DEFAULT 95.00, -- abaixo disso alerta
  max_query_time_ms INTEGER NOT NULL DEFAULT 5000, -- tempo máximo de query
  -- Cooldowns
  cooldown_minutes INTEGER NOT NULL DEFAULT 30,
  check_interval_minutes INTEGER NOT NULL DEFAULT 5,
  -- Last alert tracking
  last_alert_at TIMESTAMPTZ,
  last_alert_type TEXT,
  last_check_at TIMESTAMPTZ,
  last_check_status TEXT, -- 'ok' | 'alert_sent' | 'cooldown' | 'error'
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.system_alert_config ENABLE ROW LEVEL SECURITY;

-- Apenas master_admin pode ver/editar
CREATE POLICY "master_admin_select_system_alert_config"
  ON public.system_alert_config FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "master_admin_insert_system_alert_config"
  ON public.system_alert_config FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "master_admin_update_system_alert_config"
  ON public.system_alert_config FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'master_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

-- Insert default row
INSERT INTO public.system_alert_config (is_enabled) VALUES (false);
