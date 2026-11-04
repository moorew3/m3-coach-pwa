# M3 FLEX — Owner-stable Android signing (manual gate, not provisioned)

This applies to the ONE existing unified M3 FLEX Android app with package ID com.m3legacy.flexrecovery. No second app, new subscription, or production website deployment is necessary.

## Before changing an APK

Temporary GitHub CI debug certificates are not stable across app installs. Android generally requires a matching application ID and signing certificate for upgrades. The new manually gated owner-signing workflow creates NO new signing key and cannot deliver an owner APK until the owner supplies a permanent keystore through protected GitHub Secrets.

First open M3 FLEX Settings > Back up entire M3 FLEX. Download one password-protected, AES-256-GCM encrypted file covering BOTH the original 22-day workout history, nutrition, measurements and optional photos AND the separate actual Recovery exercise log. Decrypt and VERIFY the file before uninstalling. A Recovery-log-only export does not preserve the original tracker. Keep the backup and its password separately.

## Owner-only setup (not performed in this conversation)

1. On a trusted private computer, generate a long-lived signing key with Android keytool, for example:

    keytool -genkeypair -v -keystore m3-flex-owner.jks -storetype PKCS12 -keyalg RSA -keysize 3072 -validity 36500 -alias m3-flex-owner -dname "CN=M3 FLEX"

2. Preserve the private keystore and passwords with at least one separate secure offline backup. Never paste them into chat, put them in source code, or upload plaintext keystore files to public CI artifacts.
3. Get the public SHA-256 certificate fingerprint using keytool -list -v -keystore m3-flex-owner.jks -alias m3-flex-owner and remove colon separators.
4. Provision protected GitHub Actions secrets named M3_FLEX_KEYSTORE_BASE64 (base64-encoded keystore), M3_FLEX_KEYSTORE_PASSWORD, M3_FLEX_KEY_ALIAS, and M3_FLEX_KEY_PASSWORD. Put the 64-character public fingerprint into GitHub Actions variable M3_FLEX_EXPECTED_CERT_SHA256.
5. Create/approve protected environment m3-flex-android-owner-signing, ideally with owner manual approval. None of these confidential values was generated or uploaded by this assistant.

## New signing flow

The GitHub Actions workflow android-owner-signed.yml only supports manual workflow_dispatch. Choose OWNER_KEY_AND_BACKUP_READY after the owner security setup. It builds the original unified app and full Recovery Coach, runs tests, assembles the unsigned Android release, and uses a temporary copy of the owner keystore for Android apksigner. It verifies that the APK is signed with the pinned SHA-256 certificate AND that the package name remains com.m3legacy.flexrecovery. It deletes the temporary keystore, never pushes a production release, and provides a seven-day signed APK artifact with warnings.

A differently debug-signed previously installed APK cannot be upgraded in-place with this owner key. Before uninstalling it, verify the encrypted full-app data backup. After installing the owner-signed APK, restore the verified file into a clean, non-cloud-linked installation and check original workouts, progress photos, nutrition, and Recovery reps.

The same owner key and alias MUST be used for subsequent upgrades. Losing the key can break upgrade continuity.

## Current honest status

The manual signing workflow is implemented but has NOT executed a successful owner-signed release. Owner signing secrets and private signing certificate are not provisioned here. The debug test APK remains the tested artifact. Physical Galaxy Fold camera/microphone/Bluetooth/TV acceptance, live open-ended Marcus voice and lip-sync, approved A/B footage gaps, and user-approved production launch remain incomplete.

## Full-app data protection

The new local-only /recovery-coach/full-backup/ page combines the original state key arm-growth-tracker:v1 and Recovery logbook key m3-flex-real-reps-and-metrics-v1. It also preserves a validated last completed session receipt. Passwords, cloud sync keys, camera images, microphone data, current medical clearance and interrupted timers are NOT exported.

The encrypted backup uses PBKDF2-SHA-256 (310,000 iterations) with AES-256-GCM. The page supports a separate decrypt-and-verify operation that does not modify records. Restore refuses existing tracker/log data, existing cloud sync links, and active interrupted-session snapshots. It requires a deliberate checkbox and confirmation, and can operate only on an empty app. Galaxy Fold Android downloads and restorations must still be verified on the physical device before any uninstall.
