# Beta Launch Plan — Merced County

> **Owner**: GTM Strategist + PM
> **Target**: End of Week 10
> **Status**: PLANNING

---

## Launch Strategy: Quiet Beta

We are NOT doing a big public launch. This is a quiet beta targeting:
- 10-25 shoppers in Merced area (friends, family, community contacts)
- 5-10 butcher shop owners (visited in person)
- Goal: validate product-market fit before expanding

## Pre-Launch (Days -7 to -1)

### Data Seeding
- 10 Merced shops already seeded (batches 1 + 2)
- Visit 5 more shops, photograph current price boards
- Enter prices for all 15 shops (target: 10+ cuts each)
- Verify shop hours are accurate

### Butcher Recruitment
- In-person visits to top 5 shops
- Pitch: "Free tool to put your prices online. Customers find you easier."
- Offer: 3-month free Pro trial (activated via `activate_trial()`)
- Leave printed cards with QR code to download app
- Follow up via WhatsApp 2 days later

### Beta Tester Recruitment
- 10 friends/family who shop at carnicerias
- 5 community contacts (church groups, soccer leagues)
- Provide TestFlight/Internal Testing links
- Ask each tester to: search 3 cuts, visit 2 shop pages, share 1 card

## Launch Day

### Morning (9am)
1. Verify all cron jobs ran overnight successfully
2. Check materialized views are fresh
3. Confirm all 15 shops have current prices
4. Send TestFlight/Internal Testing invites to beta group

### Afternoon (2pm)
1. Monitor first sessions via analytics dashboard
2. Check for any RLS errors in Supabase logs
3. Respond to any butcher questions via WhatsApp

### Evening (7pm)
1. Review analytics: how many searches, shop views, share cards
2. Check abuse_log for any issues
3. Post first TikTok showing the app in action at a local carniceria

## Week 1 Post-Launch

### Daily
- Check moderation dashboard (3x/day per policy)
- Monitor abuse_log for severity HIGH+
- Respond to feedback form submissions

### Day 3
- Call 3 beta testers for verbal feedback
- Ask: What did you search for? Did you find it? Would you share it?

### Day 5
- Visit 2 butcher shops that signed up
- Ask: Are your prices showing correctly? What would make this more useful?

### Day 7
- Pull analytics: DAU, retention, search volume, share rate
- Calculate D7 retention
- First weekly performance emails go out (Monday cron)
- Team sync: what's working, what's broken, what to prioritize

## Success Criteria (End of Week 2)

| Metric | Target | How |
|--------|--------|-----|
| Beta users | 25+ | TestFlight + word of mouth |
| Daily searches | 50+ | analytics_events |
| Share cards generated | 10+ | analytics_events |
| Butcher signups | 3+ | profiles WHERE role = 'butcher' |
| Crash rate | < 1% | Expo error tracking |
| Avg session length | > 2 min | analytics_events timestamps |

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| No one downloads | Direct outreach — hand phones to people at shops |
| Prices are wrong | Flag system + butcher upload encouraged |
| App crashes | Error boundaries + Expo OTA updates |
| Butchers don't engage | In-person follow-up, show them their Usage Dashboard |
| Share cards don't spread | Test different formats, ask testers what they'd share |

## Budget

| Item | Cost |
|------|------|
| Apple Developer Account | $99/year |
| Google Play Developer | $25 (one-time) |
| Supabase (free tier) | $0 |
| Gas for shop visits | ~$50 |
| Printed QR cards (50) | ~$15 |
| **Total launch cost** | **~$189** |

---

*This is a lean launch. No ads, no influencers, no PR. Just show up at shops and let the product speak.*
