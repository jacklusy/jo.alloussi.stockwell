# iOS / TestFlight path (deferred)

See [ADR-M006](adr/ADR-M006-ios-deferred.md). MVP ships **Android only**. This checklist is the hand-off when a Mac + Apple Developer Program are available.

## Prerequisites

- [ ] Mac with Xcode matching the RN version
- [ ] Apple Developer Program membership
- [ ] App ID / bundle ID aligned with `ios/` project
- [ ] Privacy Nutrition Labels + App Privacy details drafted from `docs/privacy-policy.md`
- [ ] Camera usage string for barcode scanning
- [ ] Face ID / Keychain usage strings if biometric unlock ships on iOS

## Build

- [ ] `bundle install` + CocoaPods (`cd ios && pod install`)
- [ ] Archive Release in Xcode or Fastlane `gym`
- [ ] Optional: EAS Build if no local Mac CI minutes

## TestFlight

- [ ] Upload build to App Store Connect
- [ ] Internal testing group first
- [ ] External TestFlight (Beta App Review) if needed
- [ ] Verify Keychain + biometric re-gate, offline queue, and scanner permission denial path

## Store

- [ ] Screenshots (6.7" + 6.1" at minimum)
- [ ] Privacy policy URL (same GitHub Pages privacy as Android)
- [ ] Review notes: offline demo, test account
- [ ] Submit for App Review after Android production access is proven

## Background sync on iOS

Wire `BGTaskScheduler` to call the existing `runBackgroundSync` JS entry (ADR-M008). Do not invent a second queue.
