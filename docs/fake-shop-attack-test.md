# Fake-Shop Attack Test — Week 5

> **Owner**: Risk Analyst
> **Date**: Week 5
> **Status**: Spec + defenses deployed

## Attack Scenarios Tested

### 1. Mass Shop Creation
**Attack**: Bot creates 100 fake shops to flood search results.
**Defense**: Rate limit — max 2 shop creations per user per hour. All shop creations logged to `abuse_log` with severity `medium` if user is unverified.
**Result**: Attacker can create max 2 shops/hour. All creations flagged for admin review.

### 2. Bait Price Injection
**Attack**: Fake butcher posts $0.01/lb prices to manipulate rankings.
**Defense**: Median+MAD outlier detection flags prices >3x MAD from median. Price flagging system lets community report. Consistency score penalizes volatile shops.
**Result**: Bait prices auto-flagged as outliers within 24h (cron). Community can flag instantly.

### 3. Review Bombing
**Attack**: Bot submits 50 five-star reviews on a single shop to boost rating.
**Defense**: Rate limit — max 10 reviews/hour. Trigger logs when >5 reviews/hour from single user (severity: high). UNIQUE constraint prevents duplicate user+shop+cut reviews.
**Result**: Attacker limited to 10 reviews/hour. Flagged after 5.

### 4. Duplicate Shop Listings
**Attack**: Create same shop with slightly different names to appear multiple times.
**Defense**: UNIQUE constraint on (name, location). Geo-proximity check — shops within 50m with similar names should be flagged.
**Gap identified**: No fuzzy name matching yet. Manual admin review needed for now.
**TODO Wk7**: Add Levenshtein distance check on shop names within 100m radius.

### 5. Photo Spam
**Attack**: Upload inappropriate images to a shop's profile.
**Defense**: All photos go through moderation queue (pending -> approved). Rate limit: 20 uploads/hour. Auto-flag on >3 community reports. EXIF stripping prevents location leaks.
**Result**: No photos visible until admin-approved.

### 6. Fake Verification Claims
**Attack**: Claim someone else's shop via the OTP flow.
**Defense**: OTP sent to the business phone on record. Admin must approve after OTP + address confirmation. One active claim per user per shop.
**Result**: Attacker needs physical access to the shop's phone.

## Gaps to Address (Week 7+)

1. **Fuzzy shop name dedup** — Levenshtein or trigram matching
2. **IP-based rate limiting** — not possible on Supabase free tier (no edge function middleware). Defer to Pro plan.
3. **Device fingerprinting** — complex, defer to post-launch
4. **Coordinated attacks** — multiple accounts, same patterns. Need analytics pipeline. Post-launch.

## Monitoring

All defenses log to `abuse_log`. Admins check via Moderation Dashboard.
Alert thresholds:
- `abuse_log` entries with severity `high` or `critical` → immediate admin notification
- >10 unresolved entries in 24h → PM escalation
