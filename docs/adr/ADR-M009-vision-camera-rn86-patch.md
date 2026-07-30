# ADR-M009: Patch Vision Camera for RN 0.86 Android

## Status

Accepted

## Context

`react-native-vision-camera@4.6.4` fails `:compileDebugKotlin` on React Native 0.86:

1. `getExportedCustomDirectEventTypeConstants()` must return `Map<String, Any>?`, not `MutableMap`.
2. `currentActivity` is no longer on the module base class; use `reactApplicationContext.currentActivity`.

Upstream has the fix on main / v5, but v4.x has not shipped a release that builds against RN 0.86. Upgrading to VisionCamera 5 requires Nitro Image and API churn we do not need for barcode scanning.

## Decision

1. Pin `react-native-vision-camera` to `4.6.4` (exact) so `patch-package` always matches.
2. Ship `patches/react-native-vision-camera+4.6.4.patch` with the two Kotlin fixes.
3. Apply via `"postinstall": "patch-package"`.

## Consequences

- Android CI can assemble Debug without waiting on a v4 release.
- Bumping Vision Camera requires regenerating or dropping the patch.
- Remove the patch when a release compiles cleanly against RN 0.86.
