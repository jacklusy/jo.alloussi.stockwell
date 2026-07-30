# Play closed-track checklist (M-16)

Do this in week 2 — the 14-day clock cannot be compressed.

1. Register Google Play developer account ($25).
2. Generate upload keystore and **back up in two places**:
   ```bash
   keytool -genkeypair -v -keystore stockwell-upload.keystore -alias stockwell -keyalg RSA -keysize 2048 -validity 10000
   ```
3. Store keystore + passwords in GitHub Secrets (never commit).
4. Set local env for Fastlane:
   - `STOCKWELL_KEYSTORE_PATH`
   - `STOCKWELL_KEYSTORE_PASSWORD`
   - `STOCKWELL_KEY_ALIAS`
   - `STOCKWELL_KEY_PASSWORD`
   - `PLAY_JSON_KEY_PATH`
5. Build & upload:
   ```bash
   bundle exec fastlane android release_aab
   bundle exec fastlane android closed_track
   ```
6. Invite **12 testers**, confirm they **installed** (invited-but-not-installed does not count).
7. Keep them opted in for 14 consecutive days before applying for production.
