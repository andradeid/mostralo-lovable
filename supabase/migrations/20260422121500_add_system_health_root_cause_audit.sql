CREATE OR REPLACE FUNCTION public.get_system_health_slow_queries()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(row_data),
    '[]'::jsonb
  )
  FROM (
    SELECT jsonb_build_object(
      'queryid', COALESCE(queryid::text, md5(query)),
      'calls', calls,
      'totalExecTimeMs', ROUND(total_exec_time::numeric, 2),
      'meanExecTimeMs', ROUND(mean_exec_time::numeric, 2),
      'rows', rows,
      'query', LEFT(regexp_replace(query, '\s+', ' ', 'g'), 220)
    ) AS row_data
    FROM pg_stat_statements
    WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
      AND query NOT ILIKE '%pg_stat_statements%'
    ORDER BY total_exec_time DESC
    LIMIT 10
  ) sub;
$$;

CREATE OR REPLACE FUNCTION public.get_system_health_index_alerts()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(row_data),
    '[]'::jsonb
  )
  FROM (
    SELECT jsonb_build_object(
      'tableName', s.relname,
      'seqScans', COALESCE(s.seq_scan, 0),
      'idxScans', COALESCE(s.idx_scan, 0),
      'liveRows', GREATEST(s.n_live_tup, COALESCE(c.reltuples::bigint, 0)),
      'indexUsagePercent', CASE
        WHEN (COALESCE(s.seq_scan, 0) + COALESCE(s.idx_scan, 0)) = 0 THEN 0
        ELSE ROUND((COALESCE(s.idx_scan, 0)::numeric / (COALESCE(s.seq_scan, 0) + COALESCE(s.idx_scan, 0))) * 100)
      END
    ) AS row_data
    FROM pg_stat_user_tables s
    LEFT JOIN pg_class c
      ON c.relname = s.relname
     AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    WHERE s.schemaname = 'public'
      AND GREATEST(s.n_live_tup, COALESCE(c.reltuples::bigint, 0)) >= 100
      AND COALESCE(s.seq_scan, 0) > COALESCE(s.idx_scan, 0)
    ORDER BY COALESCE(s.seq_scan, 0) DESC,
             GREATEST(s.n_live_tup, COALESCE(c.reltuples::bigint, 0)) DESC
    LIMIT 10
  ) sub;
$$;
