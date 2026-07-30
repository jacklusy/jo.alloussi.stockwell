# Stockwell release ProGuard / R8 rules
# Verify a release build on a physical device after any native module change.
# Reflection-heavy libraries break silently if keeps are missing.

-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Keychain / MMKV / op-sqlite / Reanimated / VisionCamera
-keep class com.oblador.keychain.** { *; }
-keep class com.tencent.mmkv.** { *; }
-keep class com.optech.** { *; }
-keep class com.swmansion.reanimated.** { *; }
-keep class com.mrousavy.camera.** { *; }
-keep class io.sentry.** { *; }

-dontwarn com.facebook.react.**
-dontwarn com.swmansion.**
-dontwarn io.sentry.**
