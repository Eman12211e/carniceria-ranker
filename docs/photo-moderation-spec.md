# Photo Moderation Queue — Spec

> **Owner**: Risk Analyst
> **Due**: Week 2 (spec), Week 3 (backend implementation)
> **Status**: SPEC READY — hand off to Backend for Wk 3 build

---

## Overview

User-submitted photos (price boards, storefront shots, meat display cases) need moderation before they appear publicly. This spec defines the queue, workflow, escalation rules, and admin interface requirements.

## Moderation States

```
[Upload] → PENDING → APPROVED → (visible to all users)
                   → REJECTED → (visible only to uploader + admin)
```

| State | Visibility | Who can transition |
|-------|-----------|-------------------|
| `pending` | Uploader only | System (on upload) |
| `approved` | All users | Admin, auto-approve (future) |
| `rejected` | Uploader + admin | Admin |

## Database (already exists — migration 00009)

The `photos` table already has:
- `moderation` enum: `pending | approved | rejected`
- `moderated_by` UUID (admin who reviewed)
- `moderated_at` timestamp
- Index on `moderation WHERE moderation = 'pending'` for fast queue reads

### Additional columns needed (Week 3 migration)

```sql
ALTER TABLE photos ADD COLUMN reject_reason TEXT;
ALTER TABLE photos ADD COLUMN report_count INT NOT NULL DEFAULT 0;
ALTER TABLE photos ADD COLUMN auto_flagged BOOLEAN NOT NULL DEFAULT FALSE;
```

- `reject_reason`: shown to uploader so they can fix and resubmit
- `report_count`: incremented by user reports, triggers auto-flag at threshold
- `auto_flagged`: set by automated checks (file size, EXIF strip, duplicate hash)

## Queue Priority Rules

Photos are served to admins in this order:
1. `auto_flagged = TRUE` (system suspects a problem)
2. `report_count >= 3` (community-flagged)
3. Oldest `pending` first (FIFO for everything else)

```sql
SELECT * FROM photos
WHERE moderation = 'pending'
ORDER BY
  auto_flagged DESC,
  report_count DESC,
  created_at ASC
LIMIT 20;
```

## Upload Validation (client + server)

### Client-side (before upload)
- Max file size: **5 MB**
- Accepted formats: JPEG, PNG, WebP
- Min resolution: 200x200 px
- Max resolution: 4096x4096 px

### Server-side (Supabase Edge Function or Storage hook)
- Strip EXIF data (privacy — no GPS coordinates leaked)
- Generate thumbnail (400px wide) for queue display
- Compute perceptual hash (pHash) for duplicate detection
- If duplicate hash matches existing approved photo for same shop: `auto_flagged = TRUE`

## Admin Moderation Interface (Week 3–4)

### Queue View
- Grid of pending photos with thumbnails
- Each card shows: photo, shop name, uploader, upload time, flag count
- Bulk actions: approve selected, reject selected
- Filter: all pending | auto-flagged | reported

### Review Actions
| Action | Effect |
|--------|--------|
| **Approve** | `moderation = 'approved'`, `moderated_by = admin_id`, `moderated_at = now()` |
| **Reject** | Same + `reject_reason` required (dropdown: blurry, inappropriate, duplicate, not meat-related, other) |
| **Ban uploader** | Reject photo + set user `verified = FALSE` + flag for review |

### Reject Reasons (standardized)
1. `blurry` — Photo too blurry to be useful
2. `inappropriate` — Contains inappropriate content
3. `duplicate` — Same photo already exists for this shop
4. `not_relevant` — Not a meat/shop photo
5. `privacy` — Contains personal information (faces, license plates)
6. `other` — Free text required

## Auto-Moderation Rules (Phase 2 — Week 5+)

These are NOT Week 3 scope but should be designed for:
- **Trusted uploader bypass**: Users with 10+ approved photos and 0 rejections skip queue
- **File hash dedup**: Exact hash match = auto-reject with "duplicate" reason
- **Rate limit**: Max 5 uploads per user per shop per day

## RLS Policies (already in place)

From migration 00012:
- Anyone can read approved photos
- Users see their own pending photos
- Authenticated users can upload
- Users can delete their own photos
- Admins manage all photos

**No additional RLS changes needed for Week 3.**

## API Endpoints Needed (Week 3 backend tasks)

1. `GET /photos?moderation=pending` — Admin queue (RLS handles auth)
2. `POST /photos/:id/moderate` — Edge function: approve/reject with reason
3. `POST /photos/:id/report` — Increment report_count, auto-flag if >= 3
4. `POST /storage/photos` — Upload with validation + EXIF strip

## Metrics to Track

- Queue depth (pending count) — alert if > 50
- Median time-to-moderate — target: < 4 hours
- Rejection rate — track by reason, alert if > 30%
- Auto-flag accuracy — track false positive rate

## SLA

- All photos moderated within **24 hours** of upload
- Auto-flagged photos reviewed within **4 hours**
- During beta (Wk 9–10): PM manually checks queue 3x/day

---

## Handoff Checklist for Backend (Week 3)

- [ ] Add `reject_reason`, `report_count`, `auto_flagged` columns
- [ ] Create `moderate_photo` RPC function
- [ ] Create `report_photo` RPC function
- [ ] Set up Supabase Storage bucket `shop-photos` with 5MB limit
- [ ] Edge function for EXIF stripping + thumbnail generation
- [ ] Create admin queue query as database function
