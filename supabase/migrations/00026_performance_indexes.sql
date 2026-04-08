-- Performance optimization — Week 7 Backend
-- Query plan analysis for geo-search + price lookup under load
-- Target: all critical paths < 50ms at 100 concurrent users

-- =============================================
-- GEO-SEARCH PATH: nearby_shops_ranked
-- =============================================
-- Primary bottleneck: ST_DWithin on shops.location
-- Already have GIST index from migration 00003
-- Add covering indexes for the JOIN paths

-- Composite index: shop lookup by active + location (most common filter)
CREATE INDEX IF NOT EXISTS idx_shops_active_location
  ON shops USING GIST (location)
  WHERE active = TRUE;

-- =============================================
-- PRICE LOOKUP PATH: search_cut_prices
-- =============================================
-- Hot path: current_prices view -> JOIN shops -> JOIN price_unit -> LEFT JOIN shop_freshness
-- Bottleneck: DISTINCT ON in current_prices view scans full prices table

-- Composite index for the DISTINCT ON query pattern
CREATE INDEX IF NOT EXISTS idx_prices_shop_cut_unit_recent
  ON prices (shop_id, cut_id, unit_id, recorded_at DESC)
  WHERE is_outlier = FALSE;

-- Index for price lookups by cut (search flow)
CREATE INDEX IF NOT EXISTS idx_prices_cut_recent
  ON prices (cut_id, recorded_at DESC)
  WHERE is_outlier = FALSE;

-- =============================================
-- SHARE CARD PATH: get_share_card_data
-- =============================================
-- Needs fast AVG(price) for a cut within radius
-- price_averages materialized view handles this (refreshed hourly)
-- Add index for the fallback live query path

CREATE INDEX IF NOT EXISTS idx_current_prices_cut_unit
  ON prices (cut_id, unit_id, recorded_at DESC)
  WHERE is_outlier = FALSE;

-- =============================================
-- ANALYTICS PATH
-- =============================================
-- Event lookups by shop_id in properties (JSONB)
CREATE INDEX IF NOT EXISTS idx_analytics_shop_id
  ON analytics_events ((properties->>'shop_id'), created_at DESC);

-- =============================================
-- FULL-TEXT SEARCH: meat cut bilingual lookup
-- =============================================
-- Already have GIN indexes on name_en and name_es
-- Add trigram index for fuzzy matching (handles typos)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_cuts_name_en_trgm
  ON meat_cuts USING GIN (name_en gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_cuts_name_es_trgm
  ON meat_cuts USING GIN (name_es gin_trgm_ops);

-- Fuzzy search function for cut lookup (handles "diezmilo" -> "Diezmillo")
CREATE OR REPLACE FUNCTION search_cuts_fuzzy(
  p_query TEXT,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  animal meat_animal,
  name_en TEXT,
  name_es TEXT,
  alt_names TEXT[],
  similarity_score REAL
) AS $$
  SELECT
    mc.id, mc.animal, mc.name_en, mc.name_es, mc.alt_names,
    GREATEST(
      similarity(mc.name_en, p_query),
      similarity(mc.name_es, p_query)
    ) AS similarity_score
  FROM meat_cuts mc
  WHERE mc.name_en % p_query
     OR mc.name_es % p_query
     OR mc.name_en ILIKE '%' || p_query || '%'
     OR mc.name_es ILIKE '%' || p_query || '%'
  ORDER BY similarity_score DESC
  LIMIT p_limit;
$$ LANGUAGE sql STABLE;

-- =============================================
-- VACUUM + ANALYZE on hot tables
-- =============================================
-- Schedule aggressive autovacuum on prices table (most writes)
ALTER TABLE prices SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);

ALTER TABLE analytics_events SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);
