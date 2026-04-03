# Ghost Mode & "Map Alive" Threshold

## Map Alive Condition

The map is considered **alive** when:
- **5 shops** exist within the user's 5-mile radius
- Each shop has prices for **at least 3 different cuts**
- At least 1 price per shop was updated within the **last 7 days** (freshness)

Until this threshold is met, the app shows Ghost Mode on all location-dependent screens.

## Ghost Mode — What Shows on Each Screen

### Map Screen (0 results)
- Large friendly icon + "Be the first!" / "Se el primero!"
- "No shops in your area yet. Know a local carniceria? Help us add it."
- CTA button: "Suggest a Shop" (opens a simple form with name + address + optional photo)
- Map still renders with user's location pin — just no shop markers

### Map Screen (1–4 results, below threshold)
- Show the shops that exist (don't hide them)
- Banner at top: "We're growing! Only X shops in your area so far."
- Same "Suggest a Shop" CTA

### Search Screen (0 results for a cut)
- "No shops near you carry [cut name] yet"
- "Set a price alert" CTA — we'll notify when it appears
- Show the cut info (English/Spanish names, animal type) even with no prices

### Shop Profile (0 prices)
- Show shop name, address, hours, verification status
- Price section: "No prices yet — be the first to report one"
- CTA: "Add a Price" (for logged-in users)

### Shop Profile (0 reviews)
- "No reviews yet — share your experience"
- CTA: "Write a Review"

### Shop Profile (0 photos)
- Placeholder image with camera icon
- "Add a photo of this shop"

## Freshness Tracking

A shop is considered **stale** when its most recent price update is > 7 days old.

Stale shops:
- Get a subtle indicator (dimmed card, "prices may be outdated" label)
- Are ranked lower in search results
- Are NOT hidden — the data is still useful, just less trustworthy

## Data Quality Thresholds

| Metric                    | Green        | Yellow        | Red          |
|---------------------------|-------------|---------------|--------------|
| Shops in radius           | 5+          | 2–4           | 0–1          |
| Cuts per shop             | 3+          | 1–2           | 0            |
| Price freshness           | < 3 days    | 3–7 days      | > 7 days     |
| Reviews per shop          | 3+          | 1–2           | 0            |

## Launch Condition (from GTM)

Merced beta launches when:
- 5 shops seeded with real data
- 3 cuts minimum per shop
- All 5 shops have verified addresses
- At least 1 shop is claimed by its owner
