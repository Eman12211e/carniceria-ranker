# Supabase Free Tier — Ceiling Audit

## Week 1 Risk Analysis: April 1, 2026

### Hard Limits (Free Plan)

| Resource              | Limit           | Our Estimate (Beta)     | Risk   |
|-----------------------|-----------------|-------------------------|--------|
| Database size         | 500 MB          | ~50 MB (25 shops × data)| LOW    |
| File storage          | 1 GB            | ~200 MB (photos)        | LOW    |
| Edge Function calls   | 500K/month      | ~10K/month              | LOW    |
| Auth MAU              | 50,000          | ~100 users beta         | LOW    |
| Realtime connections  | 200 concurrent  | ~20 concurrent          | LOW    |
| API requests          | Unlimited*      | N/A                     | -      |
| Bandwidth             | 5 GB/month      | ~1 GB (images + API)    | LOW    |
| Database connections  | 60 direct       | ~20 concurrent          | LOW    |

*API requests are unlimited but rate-limited to ~1000 req/sec on free tier.

### Known Constraints That Affect Us

1. **PostGIS**: Available on free tier. No issues with geo-queries.
2. **pg_cron**: Available on free tier. Needed for `flag_price_outliers()` job.
3. **Database backups**: Daily backups, 7-day retention on free tier. Sufficient for beta.
4. **No point-in-time recovery**: Free tier only has daily backups. Acceptable risk for beta.
5. **Single region**: Free tier is single-region. Fine for Merced/Central Valley beta.
6. **Edge Functions**: 2M invocations on Pro ($25/mo). Free = 500K. Enough for now.

### When We Hit the Ceiling

The first constraint we'll hit is **database size** if we scale beyond beta:
- 500 shops × 20 cuts × 365 days of price history = ~3.6M rows ≈ 200-300 MB
- Photos in storage will compound this

**Upgrade trigger**: When DB hits 300 MB or we exceed 200 concurrent users.
**Pro plan**: $25/month — 8 GB database, 100 GB storage, 2M edge function calls.

### Recommendation

Free tier is sufficient through Week 10 launch and initial beta (25 shops, 100 users).
Plan upgrade to Pro ($25/mo) when any single metric hits 60% of free-tier cap.
Build the internal Supabase usage dashboard in Week 5 to monitor these numbers weekly.

### Rate Limits to Code Around

- Auth: 30 sign-ups per hour, 100 OTP sends per hour
- Storage uploads: 50 per minute per user
- Edge Functions: ~100 concurrent executions

Code should include retry logic with exponential backoff for auth and storage operations.
