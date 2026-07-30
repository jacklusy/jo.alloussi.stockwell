# Accessibility pass — M-28

Primary flow under test: **login → warehouse → inventory list → adjust → sync centre**.

## Checklist

| Criterion | Status |
|---|---|
| Interactive elements have `accessibilityLabel` / role | Login, list rows, adjust, sync actions, scanner, settings |
| Touch targets ≥ 48 dp | Buttons default `md` = 48; list rows `minHeight` 56 |
| Contrast ≥ 4.5:1 body / 3:1 UI both themes | `__tests__/unit/contrast.test.ts` |
| Font scale to 200% | `maxFontSizeMultiplier={1.6}` on Text primitive (cap prevents layout break; revisit for full 2.0 if QA requires) |
| `reduceMotion` honoured | SyncStatusIndicator + OfflineBanner skip loops when enabled |
| TalkBack primary flow | **Manual device pass required** — no Detox in MVP |

## Known follow-ups

- Scanner torch control uses `sm` button (40 dp) — enlarge if TalkBack review flags it
- Confirm live region announcements for sync status changes on a physical device
