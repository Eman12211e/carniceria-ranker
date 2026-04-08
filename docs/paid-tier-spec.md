# Paid Tier Spec — $19/month "Carnicería Pro"

> **Owner**: GTM Strategist
> **Due**: Week 6 (before beta)
> **Status**: DEFINED

---

## Free vs Pro Feature Split

| Feature | Free (forever) | Free Trial (3mo) | Pro ($19/mo) |
|---------|---------------|-------------------|-------------|
| Shop listing visible | Yes | Yes | Yes |
| Show in search results | Yes | Yes | Priority placement |
| Shopper reviews visible | Yes | Yes | Yes |
| Upload prices | No | Yes | Yes |
| Update prices | No | Yes | Unlimited |
| Price history (days visible) | 7 | 30 | 90 |
| Weekly performance email | No | Basic | Full w/ trends |
| Share card branding | "Carnicería Ranker" | "Carnicería Ranker" | Custom shop name |
| "Verified Pro" badge | No | No | Yes |
| Freshness boost in ranking | No | No | Yes (stale penalty reduced) |
| Price alerts to shoppers | No | No | Yes (notify nearby shoppers of deals) |
| Analytics dashboard | No | Basic | Full (views, searches, conversion) |
| Support | Community | Email | Priority email + phone |

## Why $19/month

- **Target market**: Small carnicerías doing $2K-$15K/week revenue
- $19 is less than a single daily sale — easy to justify if app brings 1 new customer/week
- Comparable to Yelp's cheapest business plan ($1/day = $30/mo) but cheaper
- Undercuts Google Business Profile paid features
- Round number, memorable, low enough for cash-heavy businesses

## Trial Mechanics

- 3 months free from date of shop claim verification
- Full Pro features during trial
- At day 75: email warning (template in `butcher-onboarding.ts`)
- At day 90: auto-downgrade to Free
  - Prices freeze (last uploaded prices remain visible but can't update)
  - Analytics access revoked
  - Pro badge removed
- Butcher can upgrade anytime — Stripe checkout

## Billing

- Monthly billing via Stripe
- Payment methods: credit/debit card
- No annual plan for V1 (keep it simple)
- Cancellation: immediate access removal at end of billing period
- No refunds for partial months (standard SaaS)

## Revenue Projections (Conservative)

| Milestone | Shops | Conversion | MRR |
|-----------|-------|-----------|-----|
| Launch (Merced) | 10 | 20% (2) | $38 |
| Month 3 | 25 | 30% (8) | $152 |
| Fresno expansion | 50 | 25% (13) | $247 |
| Central Valley | 150 | 20% (30) | $570 |

Break-even on Supabase Pro ($25/mo) at 2 paying shops.

## Implementation Notes

- Stripe checkout stub: Week 8
- Trial tracking: `profiles.trial_ends_at` column (add in Week 8 migration)
- Pro feature gating: check `profiles.subscription_status` in RPC functions
- Downgrade cron: daily check for expired trials
