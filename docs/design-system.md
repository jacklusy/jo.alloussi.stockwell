# Stockwell Design System

**Audience:** warehouse operators — gloves, glare, one free hand, cheap devices, dead network zones.  
**Not:** managers viewing dashboards.

---

## 1. Direction

**Cool industrial neutral + safety amber.**

Surfaces are slate greys with a blue-green undertone (`#12161A` → `#EEF2F4`), reading like equipment housings rather than consumer chrome. The single accent is **amber borrowed from warehouse safety signage** (`#B87709` light / `#E8A820` dark), used only for primary actions and pending-sync state. Semantic red/green stay conventional — in operations, red means error and nothing else.

### Signature element — the sync edge rail

Every inventory row carries a **4 dp vertical rail** on the leading edge whose colour encodes sync state (`sync.pending` / `syncing` / `synced` / `failed` / `conflict`). Operators learn it the way they learn machine indicator lights. It is always present, never decorative, and pairs with an icon so colour is never the sole carrier of meaning.

### Pass-2 critique

Would a generic "inventory app" prompt land here?

| Default AI look | This system |
|---|---|
| Cream `#F4F1EA` + terracotta `#D97757` | Cool slate with teal undertone; amber safety accent |
| Purple-on-white SaaS | No purple anywhere |
| Soft grey cards, `#3B82F6` primary | No floating card chrome as brand; amber primary; edge rail as identity |
| Decorative gradients | Flat industrial surfaces; elevation via border (dark) or shadow (light) |

A generic prompt produces cards, blue CTAs, and Inter-for-aesthetics. We use Inter for **tabular figures and slashed zero**, JetBrains Mono for quantities, and the edge rail as the memorable device. The look should feel like a **handheld scanner UI**, not a SaaS console.

---

## 2. Colour roles

Semantic names only — components never reference hex literals.

| Group | Tokens |
|---|---|
| `brand` | `primary`, `primaryPressed`, `primarySubtle`, `onPrimary` |
| `surface` | `background`, `surface`, `surfaceRaised`, `surfaceSunken` |
| `text` | `primary`, `secondary`, `tertiary`, `inverse`, `onBrand` |
| `border` | `subtle`, `default`, `strong`, `focus` |
| `status` | `success`, `warning`, `danger`, `info` (+ `*Subtle`) |
| `sync` | `pending`, `syncing`, `synced`, `failed`, `conflict` |

**Contrast targets (both themes, verified in `scripts/verify-contrast.ts`):** body ≥ 4.5:1 · large text ≥ 3:1 · UI/borders ≥ 3:1 · focus ≥ 3:1.

**Dark mode:** surfaces lift from `#12161A`; saturation reduced ~15%; shadows replaced by subtle borders. Components contain **zero** theme conditionals — they only read tokens.

---

## 3. Typography

| Family | Role | Why |
|---|---|---|
| **Inter** | Body / UI | Tabular figures, slashed zero, legible at 12–14 pt on low-DPI screens |
| **JetBrains Mono** | Quantities, SKUs, deltas | Fixed-width digits — scrolling lists do not jitter as values change |

Maximum 2 families / 5 weights: Inter 400/500/600/700, JetBrains Mono 500/700.

Scale tokens: `display` … `overline`, plus `numeric` / `numericLg` / `numericSm` (all tabular). Minimum 12 pt anywhere; minimum 14 pt for operator-readable copy while working.

---

## 4. Spacing, radius, elevation

- **4 pt base** — screen/card padding `space.4` (16); related gap `space.2`; group gap `space.6`.
- **Radius:** cards/buttons `md` (10); sheets top `xl` (20); badges `full`.
- **Elevation:** `flat` · `raised` · `overlay` · `sticky`. Each token emits Android `elevation` **and** iOS shadow. Dark theme substitutes borders.

---

## 5. Motion (summary)

If motion does not answer “where did this come from / go / change?”, delete it. Press 100 ms · toast/banner 250 ms · sheet spring 300 ms. Animate only `transform` / `opacity`. Honour reduce-motion with instant state changes. Never animate stock quantities.

---

## 6. Component inventory (MVP)

14 primitives in `src/ui/` (domain-agnostic) + `OfflineBanner` / `SyncStatusIndicator`. Domain components (`BalanceRow`, `QuantityStepper` usage wrappers, etc.) live in features.
