
-- Tabela de log de limpezas (histórico)
CREATE TABLE public.whatsapp_cleanup_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  store_name text,
  deleted_messages bigint DEFAULT 0,
  deleted_conversations bigint DEFAULT 0,
  deleted_cycles bigint DEFAULT 0,
  total_deleted bigint DEFAULT 0,
  execution_type text NOT NULL DEFAULT 'manual',
  executed_by uuid,
  executed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_cleanup_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master admin can view cleanup logs"
  ON public.whatsapp_cleanup_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.user_type = 'master_admin'
    )
  );

-- Tabela de configurações de limpeza automática (singleton)
CREATE TABLE public.whatsapp_cleanup_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean NOT NULL DEFAULT false,
  retention_days int NOT NULL DEFAULT 30,
  last_run_at timestamptz,
  next_run_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.whatsapp_cleanup_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master admin can manage cleanup settings"
  ON public.whatsapp_cleanup_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.user_type = 'master_admin'
    )
  );

-- Inserir configuração padrão
INSERT INTO public.whatsapp_cleanup_settings (is_enabled, retention_days)
VALUES (false, 30);

-- Adicionar flag retain_whatsapp_history em stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS retain_whatsapp_history boolean DEFAULT false;

-- Atualizar função para respeitar flag de retenção
CREATE OR REPLACE FUNCTION public.get_stores_without_chat_module()
RETURNS TABLE(store_id uuid, store_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH chat_module AS (
    SELECT id FROM modules WHERE key = 'whatsapp_chat' AND is_active = true LIMIT 1
  ),
  stores_with_module AS (
    SELECT sm.store_id
    FROM store_modules sm
    JOIN chat_module cm ON sm.module_id = cm.id
    WHERE sm.is_enabled = true
  ),
  stores_with_override_disabled AS (
    SELECT sm.store_id
    FROM store_modules sm
    JOIN chat_module cm ON sm.module_id = cm.id
    WHERE sm.is_enabled = false
  ),
  stores_via_plan AS (
    SELECT s.id AS store_id
    FROM stores s
    JOIN plan_modules pm ON s.plan_id = pm.plan_id
    JOIN chat_module cm ON pm.module_id = cm.id
    WHERE s.id NOT IN (SELECT store_id FROM store_modules sm2 JOIN chat_module cm2 ON sm2.module_id = cm2.id)
  )
  SELECT s.id AS store_id, s.name AS store_name
  FROM stores s
  WHERE (
    s.id NOT IN (
      SELECT store_id FROM stores_with_module
      UNION
      SELECT store_id FROM stores_via_plan
    )
    OR s.id IN (SELECT store_id FROM stores_with_override_disabled)
  )
  AND (s.retain_whatsapp_history IS NOT TRUE)
$$;
