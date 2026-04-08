# Final Moderation & Price-Manipulation Policy

> **Owner**: Risk Analyst
> **Due**: Week 7 (final version)
> **Status**: FINAL — enforced at launch

---

## 1. Price Manipulation Policy

### What Counts as Price Manipulation

| Violation | Definition | Detection | Consequence |
|-----------|-----------|-----------|-------------|
| **Bait pricing** | Posting a price significantly below actual to boost ranking | Outlier flagging (>3x MAD from median) | Price removed, warning to shop |
| **Stale bait** | Posting a good price once, then never updating | Freshness tracking (>7 days = stale) | Stale badge shown, rank penalty |
| **Price flooding** | Submitting many prices rapidly to manipulate averages | Rate limit (50/hr), abuse_log trigger | Account review, temp ban if repeated |
| **Fake shop pricing** | Creating fake shops with fake prices | Shop creation trigger, unverified flag | Shop removed, account banned |
| **Competitor sabotage** | Flagging competitor prices as inaccurate when they're real | Flag resolution audit trail | Flag revoked, flagger warned |

### Enforcement Ladder

1. **First offense (any type)**: Warning + content removed. Notification sent to shop owner.
2. **Second offense (same type, 30 days)**: 7-day suspension from price uploads. Admin review required to reinstate.
3. **Third offense (any type, 90 days)**: Permanent ban from price uploads. Shop listing remains but marked "unmanaged."
4. **Egregious (fake shops, coordinated)**: Immediate ban. Shop removed. Abuse log entry with severity "critical."

### Outlier Handling

- Prices flagged as outliers by the Median+MAD algorithm:
  - Marked `is_outlier = TRUE` immediately
  - Excluded from `current_prices` view (shoppers never see them)
  - Hard deleted after 30 days
  - Do NOT count against the shop in the consistency score
  - Shop owner is NOT automatically penalized — outliers can be honest mistakes

- If a shop has >3 outliers in 30 days:
  - Admin notified
  - Shop's consistency score visibly impacted
  - Butcher receives "pricing accuracy warning" via SMS

## 2. Review Moderation Policy

### Prohibited Content

- Hate speech, threats, or personal attacks
- Content not related to the shop or meat quality
- Competitor-planted negative reviews
- Incentivized reviews (paid or exchanged for discounts)

### Detection

- Review spam trigger: >5 reviews/hour from single user (auto-logged as `review_spam`)
- Keyword filter (future): flag reviews containing slurs or threats
- Community reporting (future): users can flag reviews

### Enforcement

- Automated: spam-flagged reviews held for admin review
- Manual: admin approves or removes flagged reviews
- Shop owners can respond to reviews (future feature, Week 8+)

## 3. Photo Moderation Policy

### Accepted Content

- Price boards / chalkboard menus
- Meat display cases
- Shop storefronts
- Meat cuts (close-up)

### Rejected Content

| Reason | Examples |
|--------|---------|
| `blurry` | Unreadable price boards, motion blur |
| `inappropriate` | Graphic content, nudity, violence |
| `duplicate` | Same photo already approved for this shop |
| `not_relevant` | Food photos (cooked), selfies, memes |
| `privacy` | Visible faces, license plates, addresses beyond shop |

### SLA

| Queue Type | Target Response Time |
|-----------|---------------------|
| Auto-flagged photos | < 4 hours |
| Community-reported photos (3+ reports) | < 8 hours |
| Standard pending photos | < 24 hours |

### Auto-Approve (Trusted Uploaders)

Users with 10+ approved photos and 0 rejections bypass the queue entirely. This trust can be revoked by any admin.

## 4. Shop Verification Policy

### Claim Requirements

1. Valid phone number matching the shop's listed number
2. OTP verification via SMS to that number
3. Address confirmation
4. Admin approval (manual review of all claims)

### Fraud Prevention

- One active claim per user per shop
- Unverified users creating shops are logged (severity: medium)
- Admin can reject claims with a reason
- Rejected claimants can appeal once (via feedback form)

## 5. Data Retention

| Data Type | Retention | Deletion |
|-----------|----------|---------|
| Prices (normal) | Indefinite | User can request via CCPA |
| Prices (outlier) | 30 days | Hard delete via cron |
| Reviews | Indefinite | User can delete own; admin can remove |
| Photos (approved) | Indefinite | User can delete own |
| Photos (rejected) | 30 days | Auto-delete via cron (future) |
| Analytics events | 90 days | Auto-delete via cron (future) |
| Abuse log | 1 year | Manual cleanup |
| Rate limit records | 24 hours | Auto-delete via cron |

## 6. Incident Response (Preview — Full Playbook in Week 9)

If a price manipulation incident goes public:

1. **Detect** (< 1 hour): Admin notified via moderation dashboard alert
2. **Contain** (< 2 hours): Remove offending content, suspend account
3. **Communicate** (< 4 hours): Post on app + social media acknowledging the issue
4. **Fix** (< 24 hours): Implement additional detection for the specific attack vector
5. **Review** (< 72 hours): Post-mortem, update this policy

---

*This policy is reviewed weekly during Friday sync. Any team member can propose amendments.*
