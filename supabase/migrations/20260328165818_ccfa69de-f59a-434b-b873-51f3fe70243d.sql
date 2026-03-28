-- Fix: Use pg_class.reltuples for more accurate row counts
-- n_live_tup from pg_stat_user_tables can be 0 if ANALYZE hasn't run recently
CREATE OR REPLACE FUNCTION public.get_system_health_top_tables()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(row_data), '[]'::jsonb)
  FROM (
    SELECT jsonb_build_object(
      'tableName', s.relname,
      'liveRows', GREATEST(s.n_live_tup, COALESCE(c.reltuples::bigint, 0)),
      'seqScans', COALESCE(s.seq_scan, 0),
      'idxScans', COALESCE(s.idx_scan, 0)
    ) as row_data
    FROM pg_stat_user_tables s
    LEFT JOIN pg_class c ON c.relname = s.relname AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    WHERE s.schemaname = 'public'
    ORDER BY GREATEST(s.n_live_tup, COALESCE(c.reltuples::bigint, 0)) DESC
    LIMIT 20
  ) sub;
$$;