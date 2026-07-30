# Play Store listing (M-31)

Application ID: **`jo.alloussi.stockwell`** (immutable)

## Copy

**App name:** Stockwell

**Short description (≤80):**  
Offline-first stock adjustments for warehouse operators — works in dead zones.

**Full description:**  
Stockwell is a warehouse inventory client built for operators on the floor — gloves, glare, cheap devices, and Wi-Fi that lies.

Work offline without waiting on the network. Adjust stock, queue mutations safely with idempotency keys, and sync when connectivity returns. Conflicts surface for manual resolution so nobody silently overwrites a bin count.

Features:
• Offline-first inventory list from on-device SQLite  
• Adjust stock with instant optimistic UI  
• Sync centre for pending, failed, and conflicted work  
• Barcode scan with manual SKU fallback  
• Biometric unlock for returning sessions  
• Light and dark themes tuned for warehouse lighting

Demo account credentials are in the review notes.

## Assets checklist

- [ ] Feature graphic 1024 × 500
- [ ] App icon 512 × 512
- [ ] Phone screenshots (6–8) showing: list, adjust, airplane-mode pending badge, sync centre, conflict modal, dark mode
- [ ] Category: Business
- [ ] Content rating questionnaire
- [ ] Privacy policy URL (GitHub Pages): publish `docs/privacy-policy.md`
- [ ] Data safety form — declare exactly what is collected (tokens in Keychain; no analytics in MVP)
- [ ] **Demo account in review notes**

## Data safety (MVP)

| Data                 | Collected          | Shared            | Purpose      |
| -------------------- | ------------------ | ----------------- | ------------ |
| Account credentials  | Yes (auth API)     | With backend only | Sign-in      |
| Device identifiers   | Via Sentry (crash) | Sentry            | Stability    |
| Approximate location | No                 | —                 | —            |
| Analytics / ads      | No                 | —                 | Cut from MVP |

## Review notes template

```
Demo account:
  email: <fill>
  password: <fill>

Primary flow:
  1. Sign in
  2. Select warehouse
  3. Open inventory → adjust stock
  4. Enable airplane mode → adjust again → see pending badge
  5. Disable airplane mode → open Sync tab → watch sync
  6. Optional: force a conflict from a second session
```
