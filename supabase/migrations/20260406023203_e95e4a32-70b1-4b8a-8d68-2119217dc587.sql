
-- 1. Index on master_whatsapp_config.instance_name (webhook queries)
CREATE INDEX IF NOT EXISTS idx_master_wpp_config_instance_name 
  ON public.master_whatsapp_config (instance_name);

-- 2. Index on whatsapp_instances (store_id, provider) for booking functions
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_store_provider 
  ON public.whatsapp_instances (store_id, provider);

-- 3. Index on professionals.user_id for profile lookups
CREATE INDEX IF NOT EXISTS idx_professionals_user_id 
  ON public.professionals (user_id) WHERE user_id IS NOT NULL;

-- 4. Optimize the RLS policy on professionals to use existing index
-- Current policy: is_active = true (full table scan!)
-- New policy: uses store_id which hits idx_professionals_active
DROP POLICY IF EXISTS "Public can view active professionals" ON public.professionals;
CREATE POLICY "Public can view active professionals" 
  ON public.professionals 
  FOR SELECT 
  USING (is_active = true);
-- Note: The above is the same but we add a supporting partial index below

-- 5. Partial index to support public RLS on professionals (is_active = true)
CREATE INDEX IF NOT EXISTS idx_professionals_active_only 
  ON public.professionals (id, store_id) WHERE is_active = true;

-- 6. Analyze tables to refresh planner stats
ANALYZE public.professionals;
ANALYZE public.master_whatsapp_config;
ANALYZE public.whatsapp_instances;
ANALYZE public.orders;
