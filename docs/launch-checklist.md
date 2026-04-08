# Launch Checklist — Carniceria Ranker Beta

> **Owner**: All workstreams
> **Target**: Week 10
> **Status**: PRE-LAUNCH

---

## 1. Backend Readiness

### Database
- [ ] All 36 migrations applied successfully to production Supabase
- [ ] Seed data loaded: 50 meat cuts, 10 Merced shops with hours + prices
- [ ] All materialized views refreshed (shop_freshness, price_averages, price_averages_by_city, price_trends)
- [ ] pg_cron jobs verified running:
  - `refresh-shop-freshness` (hourly)
  - `refresh-price-averages` (hourly h:10)
  - `refresh-price-averages-by-city` (hourly h:15)
  - `refresh-price-trends` (hourly h:20)
  - `hard-delete-outlier-prices` (daily 3am)
  - `expire-trials` (daily 6am)
  - `data-retention-cleanup` (daily 4am)
  - `flag-shop-duplicates` (weekly Sunday 3am)
  - `weekly-performance-emails` (Monday 9am)
- [ ] RLS policies tested: shopper, butcher, admin, anonymous all behave correctly
- [ ] PostGIS extension enabled, geo-search returns results within 5mi radius
- [ ] Supabase Auth: SMS OTP working with real phone numbers
- [ ] Storage bucket created for photos with proper policies

### API / RPCs
- [ ] `nearby_shops_ranked` — returns shops sorted by freshness + distance
- [ ] `search_cut_prices` — returns prices for a cut across nearby shops
- [ ] `search_cuts_fuzzy` — bilingual fuzzy search working
- [ ] `upsert_price` — creates/updates prices, triggers outlier check
- [ ] `get_share_card_data` — returns all fields for share card
- [ ] `create_price_alert` — creates geo-fenced alerts
- [ ] `get_expansion_readiness` — returns metric dashboard
- [ ] `get_weekly_performance` — returns shop performance data
- [ ] `check_feature_access` — pro gating works correctly
- [ ] `log_event` — analytics events recorded
- [ ] `export_my_data` / `request_data_deletion` — CCPA compliance verified

## 2. Frontend Readiness

### Core Flows
- [ ] Onboarding: 3-step carousel → role selection → location permission
- [ ] Search: fuzzy search in EN/ES → cut results → shop prices
- [ ] Map: shows nearby shops with markers, tappable to shop detail
- [ ] Shop Detail: hours, prices, reviews, photos, directions, call
- [ ] Share Card: generate → preview → native share sheet
- [ ] Price Alerts: create alert → notification when price drops

### Butcher Flows
- [ ] Upload Prices: select cuts → enter prices → submit batch
- [ ] Claim Shop: enter phone → OTP → admin approval
- [ ] Subscription: view plan → upgrade to Pro → manage
- [ ] Review Responses: view reviews → reply (500 char max)
- [ ] Weekly Email: data visible in Usage Dashboard

### Admin Flows
- [ ] Moderation Dashboard: photo queue, price flags, bulk actions
- [ ] Incident Response: active incidents, contain/resolve/escalate
- [ ] Expansion Dashboard: city metrics, readiness indicator
- [ ] Usage Dashboard: system-wide analytics

### Cross-Cutting
- [ ] i18n: all screens render correctly in EN and ES
- [ ] Dark theme consistent across all 18 screens
- [ ] Error states: all API calls have error handling with user-friendly messages
- [ ] Loading states: all data-fetching screens show loading indicator
- [ ] Empty states: EmptyState component used where no data exists
- [ ] Deep links: `carniceria://compare?shop=X&cut=Y` opens correct screen

## 3. Performance

- [ ] Geo-search < 20ms for 100 shops
- [ ] Price lookup < 30ms for 50 shops × 5 cuts
- [ ] Fuzzy search < 15ms for 50 cuts
- [ ] Share card data < 10ms
- [ ] Analytics insert < 5ms
- [ ] All indexes from migration 00026 verified with EXPLAIN ANALYZE

## 4. Security

- [ ] RLS enabled on ALL tables (no public access without policy)
- [ ] Rate limiting active: prices (50/hr), reviews (10/hr), shops (2/hr), photos (20/hr)
- [ ] Outlier detection: Median+MAD flags prices >3x MAD
- [ ] Abuse logging: all rate limit violations logged to abuse_log
- [ ] Photo moderation: all uploads go to pending queue
- [ ] No API keys in client code (using Supabase anon key only)
- [ ] CCPA: export + deletion RPCs tested and working
- [ ] OTP verification required for shop claims

## 5. Compliance & Legal

- [ ] CCPA banner shown to California users
- [ ] Data export produces complete user data JSON
- [ ] Data deletion removes all PII within 24 hours
- [ ] Privacy policy URL configured in app
- [ ] Terms of service URL configured in app
- [ ] Photo EXIF data stripped before storage (future: implement)

## 6. App Store / Distribution

- [ ] app.json: version bumped to 1.0.0
- [ ] App icon designed and configured (1024x1024)
- [ ] Splash screen configured
- [ ] iOS: App Store Connect listing created
- [ ] iOS: Screenshots (6.7", 6.1", 5.5") in EN and ES
- [ ] Android: Google Play Console listing created
- [ ] Android: Screenshots + feature graphic
- [ ] App Store description in EN and ES
- [ ] Privacy policy URL in store listings
- [ ] TestFlight / Internal Testing track configured

## 7. Launch Day

- [ ] Seed 5 additional Merced shops from field visits
- [ ] 3 verified butcher accounts ready
- [ ] Admin account created and tested
- [ ] Monitoring: check moderation dashboard 3x/day
- [ ] Social: TikTok/Instagram announcement content ready
- [ ] WhatsApp: share card links tested in group chats
- [ ] Rollback plan: know how to disable features via Supabase dashboard

## 8. Post-Launch (Week 1)

- [ ] Monitor abuse_log daily
- [ ] Check expansion readiness metrics
- [ ] Collect butcher NPS (5+ interviews)
- [ ] Review analytics: DAU, search volume, share rate
- [ ] First weekly performance email sent successfully
- [ ] Hotfix process tested (can push migration + app update same day)

---

*Last updated: Week 10. Review with full team before launch.*
