# R8 / ProGuard — release build notes (M-30)

`enableProguardInReleaseBuilds` is **true** in `android/app/build.gradle`.

## Why this matters

R8 strips unused code and renames classes. Reflection-based native modules
(Keychain, MMKV, Reanimated, Vision Camera, Sentry, op-sqlite) break if keep
rules are wrong — usually as a white screen or silent crash on cold start.

## Verification checklist (do on a physical device)

1. `bundle exec fastlane android release_aab`
2. Install the release AAB/APK via `bundletool` or Play internal track
3. Cold start → login → warehouse → list → adjust offline → sync
4. Open scanner (camera permission + torch)
5. Confirm Sentry receives a test event from the store build

## Keep rules

See `android/app/proguard-rules.pro`. After adding any native dependency, extend
keeps and re-run the checklist — do not assume greylists are enough.
