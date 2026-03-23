CREATE OR REPLACE FUNCTION public.get_system_health_modules()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(jsonb_agg(row_data ORDER BY store_name), '[]'::jsonb)
  FROM (
    SELECT jsonb_build_object(
      'storeName', s.name,
      'storeId', s.id,
      'totalModules', count(m.id),
      'enabledModules', count(m.id) FILTER (
        WHERE COALESCE(sm.is_enabled, true) = true
      ),
      'disabledModules', count(m.id) FILTER (
        WHERE COALESCE(sm.is_enabled, true) = false
      )
    ) as row_data,
    s.name as store_name
    FROM stores s
    CROSS JOIN modules m
    LEFT JOIN store_modules sm ON sm.store_id = s.id AND sm.module_id = m.id
    WHERE m.is_active = true
    GROUP BY s.id, s.name
  ) sub;
$$;