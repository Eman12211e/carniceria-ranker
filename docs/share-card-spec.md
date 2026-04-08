# Shareable Price-Comparison Card — Spec

> **Owner**: Product/UX + GTM
> **Designed**: Week 4 (moved from Week 6)
> **Backend build**: Week 6

## Purpose

The viral mechanic for TikTok/Instagram. Users capture a price savings "receipt" and share it to group chats and social media. This is how the app spreads — not ads, not SEO.

## Required Fields (non-negotiable)

| Field | Source |
|-------|--------|
| **Shop name** | `shops.name` |
| **Cut name** (bilingual) | `meat_cuts.name_en` + `meat_cuts.name_es` |
| **Price paid** | `current_prices.price` |
| **Local average** | Computed: AVG of all `current_prices` for same cut within 5mi |
| **Savings** | `avg - price`, shown as $ and % |
| **Date** | Day the card was generated |
| **Language toggle** | ES/EN indicator (card renders in user's current language) |

## Design Requirements

- Dark theme matching app (#0f0f23 + #1a1a2e + #e94560)
- "CARNICERIA RANKER" branding at top (subtle, not dominant)
- Green ($4ecca3) for savings amount
- Card is captured as PNG via `react-native-view-shot`
- Shared via native share sheet (`expo-sharing`)
- Aspect ratio: roughly 4:5 (Instagram-friendly)

## User Flow

1. User views a shop's price for a cut
2. Taps "Share savings" button
3. Card generates with all fields populated
4. Native share sheet opens (WhatsApp, iMessage, Instagram Stories, etc.)

## Backend Endpoint (Week 6)

```
GET /api/share-card?shop_id=X&cut_id=Y&unit_id=Z
```

Returns JSON:
```json
{
  "shop_name": "Mercado Mi Pueblo",
  "cut_name_en": "Chuck Roast",
  "cut_name_es": "Diezmillo",
  "price": 3.99,
  "unit": "lb",
  "avg_price": 4.52,
  "saved": 0.53,
  "saved_percent": 12,
  "date": "2026-04-06"
}
```

## Analytics to Track

- Share card generated (count by shop, cut, city)
- Share completed vs cancelled
- App opens from shared card (deep link: `carniceria://compare?shop=X&cut=Y`)
