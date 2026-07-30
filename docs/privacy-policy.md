# Privacy Policy — Stockwell

**Last updated:** 2026-07-30  
**App:** Stockwell (`jo.alloussi.stockwell`)  
**Contact:** [your email]

## What Stockwell is

Stockwell is a mobile inventory client for warehouse operators. It talks to your organisation's Stockwell API and stores inventory data on the device so work continues offline.

## Data we process

### Account & authentication

- Email and password are sent to your organisation's API over HTTPS to sign in.
- Access and refresh tokens are stored only in the device Keychain / Android Keystore. They are not written to MMKV, SQLite, or logs.

### Operational data

- Warehouse, product, location, and stock balance data are cached in an on-device SQLite database so the app works without connectivity.
- Pending stock adjustments are queued locally until they sync successfully.

### Crash reports (optional)

- If enabled by the build configuration, crash and error reports may be sent to Sentry.
- We scrub passwords, tokens, and email addresses from those reports before send.
- We do not use advertising SDKs or product analytics in the MVP.

## What we do not collect

- Precise location
- Contacts, photos, or microphone (except the camera when you choose to scan a barcode)
- Advertising identifiers for ads

## Permissions

- **Internet** — sync with the API
- **Camera** — optional barcode scanning; you can always enter a SKU manually
- **Biometrics** — optional unlock of stored credentials on this device

## Retention

- Local data remains on the device until you log out (which wipes tenant data after confirmation if unsynced work exists) or uninstall the app.
- Server-side retention is controlled by your organisation's Stockwell backend policy.

## Your rights

If you use Stockwell through an employer or tenant organisation, contact that organisation's administrator for access, correction, or deletion requests. You can also clear local data by logging out or uninstalling.

## Changes

We may update this policy. The "Last updated" date will change when we do.

## Contact

Questions about this policy: [your email]
