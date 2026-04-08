-- Internal Supabase usage dashboard
-- Tracks DB size, table sizes, row counts, and key metrics weekly
-- so we don't hit free-tier ceiling as a surprise.

-- Usage snapshots table (populated by cron)
CREATE TABLE internal_usage_snapshots (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  db_size_mb  NUMERIC(10,2),
  table_sizes JSONB,         -- { "prices": "12 MB", "shops": "0.5 MB", ... }
  row_counts  JSONB,         -- { "prices": 1234, "shops": 10, ... }
  index_size_mb NUMERIC(10,2),
  active_connections INT,
  storage_used_mb NUMERIC(10,2) DEFAULT 0
);

-- Function to capture usage snapshot
CREATE OR REPLACE FUNCTION capture_usage_snapshot()
RETURNS void AS $$
DECLARE
  v_db_size NUMERIC;
  v_index_size NUMERIC;
  v_table_sizes JSONB;
  v_row_counts JSONB;
  v_connections INT;
BEGIN
  -- Total database size in MB
  SELECT pg_database_size(current_database()) / 1048576.0 INTO v_db_size;

  -- Total index size in MB
  SELECT SUM(pg_indexes_size(c.oid)) / 1048576.0 INTO v_index_size
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r';

  -- Table sizes
  SELECT jsonb_object_agg(
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename))
  ) INTO v_table_sizes
  FROM pg_tables
  WHERE schemaname = 'public';

  -- Row counts (estimated for speed)
  SELECT jsonb_object_agg(
    relname,
    reltuples::bigint
  ) INTO v_row_counts
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r';

  -- Active connections
  SELECT count(*) INTO v_connections FROM pg_stat_activity;

  INSERT INTO internal_usage_snapshots (
    db_size_mb, table_sizes, row_counts, index_size_mb, active_connections
  ) VALUES (
    ROUND(v_db_size, 2), v_table_sizes, v_row_counts,
    ROUND(COALESCE(v_index_size, 0), 2), v_connections
  );
END;
$$ LANGUAGE plpgsql;

-- RPC: get latest usage snapshot for the dashboard
CREATE OR REPLACE FUNCTION get_usage_dashboard()
RETURNS JSON AS $$
DECLARE
  v_latest internal_usage_snapshots%ROWTYPE;
  v_free_tier_limits JSON;
  v_result JSON;
BEGIN
  SELECT * INTO v_latest
  FROM internal_usage_snapshots
  ORDER BY captured_at DESC
  LIMIT 1;

  v_free_tier_limits := json_build_object(
    'db_max_mb', 500,
    'storage_max_mb', 1024,
    'edge_fn_max_calls', 500000,
    'auth_mau_max', 50000,
    'realtime_max_connections', 200,
    'bandwidth_max_gb', 5
  );

  SELECT json_build_object(
    'snapshot', CASE WHEN v_latest IS NOT NULL THEN row_to_json(v_latest) ELSE NULL END,
    'free_tier_limits', v_free_tier_limits,
    'alerts', json_build_array(
      CASE WHEN v_latest.db_size_mb > 300 THEN
        json_build_object('level', 'warning', 'msg', 'DB size > 60% of free tier (300/500 MB)')
      ELSE NULL END,
      CASE WHEN v_latest.active_connections > 40 THEN
        json_build_object('level', 'warning', 'msg', 'Active connections > 66% of limit (40/60)')
      ELSE NULL END
    ),
    -- Key table row counts for quick monitoring
    'key_metrics', json_build_object(
      'total_shops', (SELECT count(*) FROM shops WHERE active = TRUE),
      'total_prices', (SELECT count(*) FROM prices WHERE is_outlier = FALSE),
      'total_reviews', (SELECT count(*) FROM reviews),
      'pending_photos', (SELECT count(*) FROM photos WHERE moderation = 'pending'),
      'pending_flags', (SELECT count(*) FROM price_flags WHERE resolved = FALSE),
      'pending_claims', (SELECT count(*) FROM verification_requests WHERE status = 'pending'),
      'stale_shops', (SELECT count(*) FROM shop_freshness WHERE freshness_status = 'stale')
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Weekly usage snapshot cron (Sundays at midnight)
SELECT cron.schedule(
  'weekly-usage-snapshot',
  '0 0 * * 0',
  'SELECT capture_usage_snapshot()'
);

-- Also capture one now on migration run
SELECT capture_usage_snapshot();
