# ADR-M006: iOS App Store deferred

## Status
Accepted

## Context
Shipping iOS needs a Mac, Apple Developer Program ($99/year), privacy manifests, and 12–18 hours of store work. GitHub Actions macOS minutes are expensive relative to Linux Android builds.

## Decision
MVP ships **Android only** via GitHub Actions + Fastlane. iOS is deferred until after the application/portfolio window; App Store deployment experience already exists professionally.

## Consequences
README and Play listing are Android-first. `ios/` remains in the repo for future TestFlight work. EAS Build remains an option if a Mac is unavailable later.

**Operational checklist:** [docs/ios-testflight.md](../ios-testflight.md).
