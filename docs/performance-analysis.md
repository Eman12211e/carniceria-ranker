# Performance & Query Plan Analysis — Week 7

> **Owner**: Backend Architect
> **Status**: Indexes deployed, analysis documented

---

## Critical Query Paths

### 1. Geo-Search: `nearby_shops_ranked`

**Pattern**: `ST_DWithin(location, point, 8047)` on shops table
**Index**: GIST on `shops.location WHERE active = TRUE`
**Expected plan**:
```
Index Scan using idx_shops_active_location on shops
  Filter: ST_DWithin(location, ...)
  -> Nested Loop Left Join on shop_freshness
```
**Target**: < 20ms for 100 shops in radius
**Bottleneck at scale**: GIST index handles up to ~100K rows efficiently. Not a concern until statewide expansion.

### 2. Price Lookup: `search_cut_prices`

**Pattern**: `current_prices` view (DISTINCT ON) -> JOIN shops -> ST_DWithin
**Index**: Composite `(shop_id, cut_id, unit_id, recorded_at DESC) WHERE is_outlier = FALSE`
**Expected plan**:
```
Index Only Scan using idx_prices_shop_cut_unit_recent on prices
  -> DISTINCT ON (shop_id, cut_id, unit_id)
  -> Nested Loop Join on shops (GIST filter)
```
**Target**: < 30ms for 50 shops × 5 cuts
**Optimization**: `current_prices` view uses DISTINCT ON which is efficient with the composite index. No seq scan.

### 3. Share Card: `get_share_card_data`

**Pattern**: Single price lookup + AVG across nearby shops
**Optimization**: Uses `price_averages` materialized view (refreshed hourly) for the avg. Single-row lookups from `current_prices`.
**Target**: < 10ms (single row + materialized avg)

### 4. Fuzzy Search: `search_cuts_fuzzy`

**Pattern**: Trigram similarity on `name_en` and `name_es`
**Index**: GIN trigram indexes on both columns
**Target**: < 15ms for 50 cuts (will grow to ~200 cuts max)

### 5. Analytics: `log_event`

**Pattern**: Simple INSERT into `analytics_events`
**Concern**: High write volume. Configured aggressive autovacuum (5% scale factor).
**JSONB index**: On `properties->>'shop_id'` for share card stats queries.

## Index Summary

| Index | Table | Type | Purpose |
|-------|-------|------|---------|
| `idx_shops_location` | shops | GIST | Geo-search |
| `idx_shops_active_location` | shops | GIST (partial) | Active-only geo-search |
| `idx_prices_shop_cut_unit_recent` | prices | B-tree composite | DISTINCT ON for current_prices |
| `idx_prices_cut_recent` | prices | B-tree | Cut-specific price lookups |
| `idx_current_prices_cut_unit` | prices | B-tree | Share card avg fallback |
| `idx_cuts_name_en_trgm` | meat_cuts | GIN trigram | Fuzzy EN search |
| `idx_cuts_name_es_trgm` | meat_cuts | GIN trigram | Fuzzy ES search |
| `idx_analytics_shop_id` | analytics_events | B-tree (JSONB) | Share stats by shop |

## Materialized Views (Refreshed by Cron)

| View | Refresh Rate | Purpose |
|------|-------------|---------|
| `shop_freshness` | Hourly | Freshness status + ranking |
| `price_averages` | Hourly (h:10) | Global avg per cut |
| `price_averages_by_city` | Hourly (h:15) | City-level avg per cut |
| `price_trends` | Hourly (h:20) | 7-day trend arrows |

## Autovacuum Tuning

| Table | vacuum_scale_factor | analyze_scale_factor |
|-------|-------------------|---------------------|
| prices | 0.05 (5%) | 0.02 (2%) |
| analytics_events | 0.1 (10%) | 0.05 (5%) |
| All others | default (0.2) | default (0.1) |

## Load Estimates (Beta: 100 users, 25 shops)

| Query | Calls/hour (est.) | Avg latency target |
|-------|-------------------|-------------------|
| nearby_shops_ranked | 200 | < 20ms |
| search_cut_prices | 150 | < 30ms |
| search_cuts_fuzzy | 300 | < 15ms |
| upsert_price | 20 | < 50ms |
| log_event | 500 | < 5ms |
| get_share_card_data | 50 | < 10ms |

All targets achievable on Supabase free tier (single Postgres instance, ~1000 req/sec capacity).
