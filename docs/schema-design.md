# Carnicería Ranker — Database Schema Design

## Week 1 Audit: April 1, 2026

### Tables Overview

```
profiles          → user accounts (shoppers, butchers, admins)
shops             → carnicerías / grocery stores
shop_hours        → operating hours per day-of-week
meat_cuts         → bilingual meat-cut dictionary
price_unit        → unit types (lb, kg, each, pack)
prices            → current + historical prices per cut per shop
reviews           → user ratings (quality pillar)
photos            → user/butcher uploaded images
price_flags       → inaccurate-price reports from users
```

### Scoring System (3 Pillars)

1. **Price Score** — normalized against local average for that cut within 5mi radius
2. **Quality Score** — average of user sentiment ratings (1–5) from `reviews`
3. **Consistency Score** — 30-day price stability via Median + MAD (Median Absolute Deviation)
   - Outlier prices flagged when deviation > 3× MAD
   - Hard delete outliers after 30 days (not 45-day soft delete — distorts the window)

### Key Constraints

- `prices`: UNIQUE on (shop_id, cut_id, unit_id, recorded_at::date) — one price per cut per unit per day per shop
- `shops`: UNIQUE on (name, lat, lng) — prevent duplicate shop entries at same location
- `reviews`: one review per user per shop per cut (UNIQUE on user_id, shop_id, cut_id)
- `shop_hours`: UNIQUE on (shop_id, day_of_week) — one entry per day per shop

### Price Versioning (Upsert Strategy)

Prices use an append-only model with `recorded_at` timestamps.
The "current" price is the most recent entry for a (shop_id, cut_id, unit_id) tuple.
An upsert on the same day updates in place; a new day creates a new row.
This gives us full price history for trend arrows and consistency scoring.

### RLS Strategy

- `profiles`: users read own profile, admins read all
- `shops`: public read, butcher-owners + admins write
- `prices`: public read, butcher-owners write own shop's prices
- `reviews`: public read, authenticated users create, users edit/delete own
- `photos`: public read, authenticated upload, moderation queue for approval
- `price_flags`: authenticated create, admins read all

### Geo-Search

Using PostGIS `geography` type on shops table.
`ST_DWithin(location, user_point, 8047)` for 5-mile radius (8047 meters).
Index: `CREATE INDEX idx_shops_location ON shops USING GIST (location);`
