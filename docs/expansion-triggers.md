# Expansion Trigger Metrics — Fresno / Stockton

> **Owner**: GTM Strategist
> **Due**: Week 7
> **Status**: DEFINED

---

## When Do We Expand Beyond Merced?

Expansion is NOT calendar-driven. It's metric-driven. We expand when Merced proves the model works.

## Required Metrics (ALL must be green)

| Metric | Threshold | How We Measure |
|--------|-----------|---------------|
| Monthly Active Users (MAU) | >= 500 in Merced | `analytics_events` unique user_ids in 30 days |
| Verified Shops | >= 15 in Merced metro | `shops WHERE verified = TRUE AND city IN ('Merced', 'Atwater', 'Livingston')` |
| Butcher NPS | >= 0 (not negative) | Survey 5+ verified butchers, calculate Net Promoter Score |
| Price Freshness | >= 80% shops "fresh" or "aging" | `shop_freshness WHERE freshness_status != 'stale'` / total |
| Retention (D7) | >= 30% | Users who return within 7 days of first use |
| Share Card Virality | >= 5% share rate | `share_card_shared / share_card_generated` from analytics |

## SQL Query for Expansion Readiness

```sql
SELECT
  -- MAU
  (SELECT COUNT(DISTINCT user_id)
   FROM analytics_events
   WHERE created_at >= now() - INTERVAL '30 days') AS mau,

  -- Verified shops
  (SELECT COUNT(*) FROM shops
   WHERE verified = TRUE AND active = TRUE
   AND city IN ('Merced', 'Atwater', 'Livingston')) AS verified_shops,

  -- Price freshness
  (SELECT ROUND(
    COUNT(*) FILTER (WHERE freshness_status IN ('fresh', 'aging'))::numeric /
    NULLIF(COUNT(*), 0) * 100, 1
  ) FROM shop_freshness) AS pct_fresh,

  -- D7 retention
  (SELECT ROUND(
    COUNT(DISTINCT CASE WHEN ae2.user_id IS NOT NULL THEN ae1.user_id END)::numeric /
    NULLIF(COUNT(DISTINCT ae1.user_id), 0) * 100, 1
  ) FROM (
    SELECT DISTINCT user_id, MIN(created_at) AS first_seen
    FROM analytics_events GROUP BY user_id
  ) ae1
  LEFT JOIN analytics_events ae2 ON ae2.user_id = ae1.user_id
    AND ae2.created_at BETWEEN ae1.first_seen + INTERVAL '1 day'
    AND ae1.first_seen + INTERVAL '7 days'
  ) AS d7_retention,

  -- Share virality
  (SELECT ROUND(
    COUNT(*) FILTER (WHERE event = 'share_card_shared')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE event = 'share_card_generated'), 0) * 100, 1
  ) FROM analytics_events) AS share_rate;
```

## Expansion Playbook

### Phase 1: Fresno (population: 545K, ~30min from Merced)

**Pre-seed (2 weeks before launch):**
1. Visit 10 carnicerías in Fresno, photograph price boards
2. Seed prices for 10 shops (same process as Merced)
3. Recruit 3 butcher owners via in-person visits
4. Recruit 5 power users from Merced who have family in Fresno

**Launch trigger:** When 5 Fresno shops have 3+ cuts with prices < 7 days old

### Phase 2: Stockton (population: 320K, ~1hr from Merced)

Same playbook as Fresno. Only begins when Fresno hits the same metrics Merced hit before expansion.

### Phase 3: Sacramento / Modesto / Bakersfield

Requires external funding or revenue sustaining the expansion cost. Not planned for V1.

## Costs Per Expansion

| Item | Estimate |
|------|---------|
| In-person shop visits (gas + time) | $200 |
| Seed data entry (10 shops × 30min each) | 5 hours |
| Butcher recruitment outreach | 2 days |
| TikTok/IG content for new city | $50 (camera supplies) |
| **Total per city** | **~$300 + 3 days labor** |

## What We Don't Do

- No paid ads for expansion (organic only)
- No cold email/SMS to butchers we haven't visited
- No launching in a city with < 5 seeded shops
- No expanding while Merced metrics are below threshold
