# Negin Heal Android (Capacitor)

Capacitor WebView shell for [https://neginheal.ir/](https://neginheal.ir/). The native APK provides a launcher icon, splash screen, and Android System WebView — **no Chrome dependency** and no “Running in Chrome?” disclosure. App content loads from the live website and updates automatically when you deploy the web app.

- **Package ID:** `neginheal.app` (new Cafe Bazaar listing; legacy `ir.neginheal.app` is retired)
- **Config:** `app/capacitor.config.ts`
- **Version:** `android/app-version.json`
- **Signing fingerprint:** `android/.signing-fingerprint` (committed; public certificate hash)

## Prerequisites

- Node.js 18+
- JDK 17 (`JAVA_HOME`)
- Android SDK with `platforms;android-35` and `build-tools;35.0.1` (`ANDROID_HOME` or `~/Library/Android/sdk`)

## Build the APK

```bash
cd android
npm run build
```

This will:

1. Build the web app (`app/`)
2. Run `cap sync android`
3. Produce signed release APK and AAB

Output:

- `app/build/outputs/apk/release/app-release.apk` — install and test on a device
- `app/build/outputs/bundle/release/app-release.aab` — upload to Cafe Bazaar
- `app-release-signed.apk` — copy at repo root for convenience
- `../app/public/app/negin-heal.apk` — copy for web download (`https://neginheal.ir/app/negin-heal.apk`)

The web app exposes a single APK download. Legacy `negin-heal-no-chrome.apk` is removed on each release build.

Default keystore passwords are in `.env.example`. Override for builds:

```bash
export ANDROID_KEYSTORE_PASSWORD='your-password'
export ANDROID_KEY_PASSWORD='your-password'
npm run build
```

Create or rotate the signing keystore:

```bash
npm run setup:new-keystore   # backs up to ~/secure-backups/negin-heal/
npm run verify:keystore
```

**Updating an existing Cafe Bazaar listing:** keep the same package ID and keystore. For a lost keystore, publish a new listing with `neginheal.app` (current setup).

Local test builds with a different key: `SKIP_KEYSTORE_VERIFY=1 npm run build`

## Other commands

| Command | Purpose |
|---------|---------|
| `npm run sync` | Sync web assets and plugins after `app/` changes |
| `npm run verify:release` | Verify APK/AAB targetSdk, versionCode, and structure before upload |
| `npm run setup:new-keystore` | Create a fresh keystore and record `.signing-fingerprint` |
| `npm run verify:apk-signature` | Verify a signed APK matches `.signing-fingerprint` |
| `npm run fingerprint` | Print SHA-256 certificate fingerprint |

From `app/`:

| Command | Purpose |
|---------|---------|
| `npm run cap:sync` | Sync Capacitor Android project |
| `npm run cap:open` | Open Android project in Android Studio |

## Release a new version

1. Bump `versionCode` and `versionName` in `android/app-version.json`
2. Run `npm run build` in `android/`
3. Run `npm run verify:release`
4. Upload **`app-release-signed.apk`** or **`app-release-bundle.aab`** to Cafe Bazaar

## Cafe Bazaar requirements

| Requirement | Value |
|-------------|-------|
| `targetSdkVersion` | **35** (pinned in `variables.gradle`) |
| `minSdkVersion` | **23** |
| `compileSdkVersion` | **35** |
| Permissions | `INTERNET` only |
| Launcher activity | `neginheal.app.MainActivity` |

Before upload:

```bash
npm run verify:release
```

Confirm target SDK:

```bash
$ANDROID_HOME/build-tools/*/aapt2 dump badging app-release-signed.apk | grep targetSdk
```

## Troubleshooting

If Gradle cannot reach `dl.google.com`, build scripts add Aliyun Maven mirrors automatically via `scripts/apply-build-fixes.sh`.

Ensure your Android SDK has `platforms;android-35` and `build-tools;35.0.1` installed. The build script writes `local.properties` automatically from `ANDROID_SDK_ROOT`, `ANDROID_HOME`, or `~/Library/Android/sdk`.

## Architecture notes

- Uses **Android System WebView**, not Chrome Custom Tabs / TWA
- Loads production content from `https://neginheal.ir` via Capacitor `server.url`
- Offline fallback page: `app/public/capacitor-offline.html` (Persian)
- Native shell bootstrap: `app/src/native/capacitorBootstrap.ts` (status bar, back button, splash)
- Icons are generated into `android/app/src/main/res/` by `app/scripts/generate-pwa-icons.mjs`

Keep `android.keystore` out of git (already in `.gitignore`) and back it up safely.
