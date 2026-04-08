# Incident Response Playbook — Carnicería Ranker

> **Owner**: Risk Analyst
> **Version**: 1.0 (Week 9)
> **Status**: ACTIVE

## Severity Levels

| Level | Definition | Examples | Response Time |
|-------|-----------|----------|---------------|
| Low | Minor policy violation, isolated | Single spam review, blurry photo | < 24 hours |
| Medium | Pattern of violations or unverified shop activity | Multiple outlier prices, unverified shop creation | < 8 hours |
| High | Coordinated attack or significant manipulation | Review bombing, bait pricing campaign | < 2 hours |
| Critical | System integrity threatened or public incident | Data breach, mass fake shops, media attention | < 30 minutes |

## Response Procedures

### Phase 1: Detection (Target: < SLA above)
- Monitor moderation dashboard for new abuse_log entries
- Check severity HIGH and CRITICAL entries immediately
- Auto-alerts: notification_queue entries with type = 'admin_alert'
- Escalation path: Risk Analyst → PM → Founder

### Phase 2: Containment (Target: < 2× detection SLA)
For each severity:
- **Low**: Remove offending content. Log action.
- **Medium**: Remove content + issue warning to user. Increase monitoring.
- **High**: Suspend user account (set profiles.verified = false). Remove all content from last 24h. Lock shop if applicable.
- **Critical**: Suspend all involved accounts. Lock affected shops. Disable affected feature if systemic. Alert all admins.

SQL for account suspension:
```sql
UPDATE profiles SET verified = false, updated_at = now() WHERE id = '<user_id>';
INSERT INTO abuse_log (user_id, event_type, severity, details) VALUES ('<user_id>', 'account_suspended', 'high', '{"reason": "incident response", "incident_id": "<id>"}');
```

### Phase 3: Communication (Target: < 4 hours for HIGH+)
- Internal: Post in team Slack/group chat
- Affected users: Send notification via notification_queue
- Public (CRITICAL only): Post in-app banner if widespread

### Phase 4: Fix (Target: < 24 hours)
- Identify the attack vector
- Implement additional detection (new trigger, tighter rate limit, etc.)
- Deploy fix via new migration
- Test with fake-shop-attack-test scenarios

### Phase 5: Review (Target: < 72 hours)
- Write post-mortem document in docs/
- Update moderation-policy.md if needed
- Update this playbook if needed
- Share learnings with team

## Runbook: Common Scenarios

### Fake Shop Flood
1. Query: `SELECT * FROM abuse_log WHERE event_type = 'shop_creation' AND created_at > now() - interval '1 hour' ORDER BY created_at DESC`
2. Identify the user(s) creating shops
3. Suspend accounts
4. Delete fake shops: `UPDATE shops SET active = false WHERE owner_id IN (...)`
5. Check if rate limits were bypassed — if so, tighten

### Bait Price Campaign
1. Query: `SELECT * FROM prices WHERE is_outlier = true AND created_at > now() - interval '24 hours' ORDER BY shop_id`
2. Group by shop to identify coordinated activity
3. If single shop: warning + price removal
4. If multiple shops/same user: account suspension

### Review Bombing
1. Query: `SELECT user_id, COUNT(*) FROM reviews WHERE created_at > now() - interval '1 hour' GROUP BY user_id HAVING COUNT(*) > 5`
2. Flag reviews from the offending user
3. Suspend account
4. Hide reviews pending manual review

### Data Breach Response
1. Immediately disable all public API endpoints (emergency: set all RLS to deny)
2. Identify scope of breach
3. Notify affected users within 72 hours (CCPA requirement)
4. File breach report if > 500 CA residents affected
5. Post-mortem within 1 week

## Contacts

| Role | Responsibility |
|------|---------------|
| Risk Analyst | First responder, containment |
| PM | Escalation, communication |
| Backend Architect | Technical fix, deployment |
| GTM Strategist | Public communication |

## Metrics to Track

- Mean time to detect (MTTD)
- Mean time to contain (MTTC)
- Incidents per week by severity
- False positive rate on auto-detection
- Repeat offender rate
