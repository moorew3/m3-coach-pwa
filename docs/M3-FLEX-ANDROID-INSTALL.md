# M3 FLEX — Installable Android Recovery Coach

This is a **real Android APK**, assembled with Capacitor 7 and the Android Gradle toolchain. It runs inside an installed Android WebView with local bundled HTML, scripts, MediaPipe pose model and WASM. It is not a browser shortcut or an ordinary ZIP of HTML pages.

**Available in the APK:** the original clinician-gated seated Recovery Coach, five approved movement scenes plus approved C09/C10 breathing, original Marcus audio source URLs, timed sets, optional superset partners, rest, pause/resume, emergency stop, Android Voice Access button labels, same-screen camera form-alignment guidance, phone/microphone checks and review-only Workout A/B candidates.

**Still unfinished:** synchronized talking avatar and truly conversational Marcus, independently verified Galaxy Fold audio/camera permissions, complete approved Workout A/B animations, trustworthy AI form diagnosis or confirmed repetitions, cross-device session synchronization and Play Store release signing.

**Internet is required for Marcus and approved original MP4 streams**, even though app logic and first-party pose model are bundled locally. No paid AI endpoint is enabled, no user-owned original media is replaced or redistributed as a new video, and no additional subscription is needed to generate the debug APK.

## Getting the APK

Open a successful GitHub Actions run titled **Android APK — M3 FLEX Recovery** on the protected pull request. Download artifact **m3-flex-recovery-android-debug-apk**. Open the artifact ZIP, then copy **M3_FLEX_Recovery_Android_Debug.apk** to your Galaxy Fold, open it from Files and explicitly approve installation from that source if Android requests it.

This is an **Android developer-signed debug APK** suitable for testing only. Its temporary debug signature may change on another CI run, requiring uninstalling the earlier test app and losing data stored only inside it. A user-owned long-lived release signing key is required for safe upgrades and final publication.

## Protect workout logs before replacing the test APK

From the currently installed M3 FLEX Recovery app, open the prominent **Check my records and encrypted backup before installing an update** link, or visit `/recovery-coach/update-safety/` within the same app. It reports how many locally stored records this installation can see and the build commit ID where available. The page reads local storage only; it **does not create, test, or upload any backup**.

Open **My actual reps and measurements → Export password-protected backup**, choose a unique 12–128-character password, save the downloaded JSON to a location you control, and verify the file is actually present in Android Files/Downloads (or your private storage). Keep the password separately. Do not uninstall the old APK until both the file and its password have been checked. After replacing the debug app, import the protected JSON using the password and verify the actual records and reps.

The APK's debug signing key is temporary, so Android may refuse an upgrade with "App not installed" and require uninstalling the previous version. Removing the app can erase **all** localStorage workout entries and the interrupted session snapshot. The encrypted logbook export preserves manual reps and measurements only, **not** clearance choices, camera permissions, or in-progress timer state. Do not delete the downloaded backup after reinstall until a successful restore is independently confirmed. Never commit either file/password to public GitHub.

A stable user-owned release keystore and production-signed updates remain an outstanding release prerequisite; this safeguard is **not** a substitute for stable signing.

## Privacy and phone permissions

The app declares INTERNET, CAMERA and RECORD_AUDIO solely to support the original streamed media, an optional camera model and an **explicit** microphone diagnostic. The pose system does not record/upload frames or access the microphone. It does not activate automatically on app launch. Check Android Settings → Apps → M3 FLEX Recovery → Permissions if a consent dialog was refused.

A physical Galaxy Fold with Bluetooth headset and real internet must validate actual playback, background/lock-screen behavior, camera/WebView permission prompts and data persistence. Do not treat CI compilation as hardware certification.

## Developer build

Requires Node 22, Java 21 and Android SDK with Gradle support.

1. Install existing project dependencies: npm install.
2. Stage local pose assets: node scripts/stage-pose-runtime.mjs.
3. Stage approved recovery app: node scripts/stage-android-recovery.mjs.
4. Install @capacitor/core, @capacitor/cli and @capacitor/android at matching v7.6.9.
5. npx cap add android && npx cap sync android.
6. Add the optional camera/audio permission declarations to generated AndroidManifest.xml as in the workflow.
7. In android/, execute ./gradlew assembleDebug.

The result is android/app/build/outputs/apk/debug/app-debug.apk. No owner credentials or production signing keystore belong in GitHub source.
