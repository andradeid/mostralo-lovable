
-- RPC: Conexões do sistema (pg_stat_activity)
CREATE OR REPLACE FUNCTION public.get_system_health_connections()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM pg_stat_activity),
    'active', (SELECT count(*) FROM pg_stat_activity WHERE state = 'active'),
    'idle', (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle'),
    'max', (SELECT setting::int FROM pg_settings WHERE name = 'max_connections'),
    'byState', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('state', COALESCE(state, 'other'), 'count', cnt))
       FROM (SELECT state, count(*) as cnt FROM pg_stat_activity GROUP BY state) sub),
      '[]'::jsonb
    )
  );
$$;

-- RPC: Estatísticas do banco (pg_stat_database)
CREATE OR REPLACE FUNCTION public.get_system_health_db_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'cacheHitRatio', ROUND(
      CASE WHEN (blks_hit + blks_read) = 0 THEN 0
      ELSE (blks_hit::numeric / (blks_hit + blks_read) * 100)
      END, 2
    ),
    'txCommit', xact_commit,
    'txRollback', xact_rollback,
    'tupReturned', tup_returned,
    'tupFetched', tup_fetched,
    'tupInserted', tup_inserted,
    'tupUpdated', tup_updated,
    'tupDeleted', tup_deleted
  )
  FROM pg_stat_database
  WHERE datname = current_database();
$$;

-- RPC: Contagem de assinaturas Realtime
CREATE OR REPLACE FUNCTION public.get_system_health_realtime()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'activeSubscriptions', (SELECT count(*) FROM realtime.subscription)
  );
$$;

-- RPC: Módulos por loja
CREATE OR REPLACE FUNCTION public.get_system_health_modules()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(row_data), '[]'::jsonb)
  FROM (
    SELECT jsonb_build_object(
      'storeName', s.name,
      'storeId', s.id,
      'totalModules', count(sm.id),
      'enabledModules', count(sm.id) FILTER (WHERE sm.is_enabled = true),
      'disabledModules', count(sm.id) FILTER (WHERE sm.is_enabled = false)
    ) as row_data
    FROM stores s
    LEFT JOIN store_modules sm ON sm.store_id = s.id
    GROUP BY s.id, s.name
    ORDER BY s.name
  ) sub;
$$;

-- RPC: Top tabelas mais acessadas
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
      'tableName', relname,
      'liveRows', n_live_tup,
      'seqScans', COALESCE(seq_scan, 0),
      'idxScans', COALESCE(idx_scan, 0)
    ) as row_data
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY n_live_tup DESC
    LIMIT 20
  ) sub;
$$;
