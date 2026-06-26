# Negin Heal Android (Capacitor)

Capacitor WebView shell for [https://neginheal.ir/](https://neginheal.ir/). The native APK provides a launcher icon, splash screen, and Android System WebView — **no Chrome dependency** and no “Running in Chrome?” disclosure. The app shell is bundled in the APK for offline browsing; API calls go to the live backend when online.

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
- Bundles the web app shell in the APK (offline browsing via service worker + SQLite cache)
- API requests target `https://neginheal.ir` (set at build time via `VITE_API_BASE_URL`)
- Optional remote-shell dev mode: `CAPACITOR_USE_REMOTE_SERVER=1` loads from `server.url` instead
- Native shell bootstrap: `app/src/native/capacitorBootstrap.ts` (status bar, back button, splash, FCM registration)
- Launcher icon badge sync: `@capawesome/capacitor-badge` + FCM data messages from the API
- Icons are generated into `android/app/src/main/res/` by `app/scripts/generate-pwa-icons.mjs`

## Firebase setup (required for launcher badge + native push while app is closed)

Native Android push and launcher badge sync when the APK is **closed** require Firebase Cloud Messaging (FCM). The free Firebase plan is enough.

### Account and project

1. Go to [Firebase Console](https://console.firebase.google.com/) (use any Google account).
2. **Create a project** (or open an existing one).
3. Add an **Android app** with package ID **`neginheal.app`**.

### Files to configure

| File | Purpose |
|------|---------|
| `android/app/google-services.json` | Android client config (downloaded from Firebase; **gitignored**) |
| `api/.env` | Server credentials for sending FCM messages |

No Firebase keys are needed in `app/.env`.

### Where to find each value in Firebase

#### `google-services.json` (Android APK)

1. Firebase Console → **Project settings** (gear icon)
2. **Your apps** → Android app (`neginheal.app`)
3. **Download google-services.json**
4. Save as `android/app/google-services.json`

#### `FIREBASE_PROJECT_ID` (`api/.env`)

1. **Project settings** → **General**
2. Copy **Project ID** (not “Project name”)

Example: `neginheal`

#### `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` (`api/.env`)

These come from a **service account JSON**, not from the Android app screen.

1. **Project settings** → **Service accounts**
2. Click **Generate new private key** → confirm
3. A `.json` file downloads. Map fields to `.env`:

| `api/.env` key | JSON field |
|----------------|------------|
| `FIREBASE_PROJECT_ID` | `project_id` |
| `FIREBASE_CLIENT_EMAIL` | `client_email` |
| `FIREBASE_PRIVATE_KEY` | `private_key` |

**Admin SDK language (Node.js / Java / Python / Go):** any choice is fine — the JSON file is identical. Pick **Node.js** if you want sample code that matches this API (`firebase-admin`).

Example `.env` format:

```env
FIREBASE_PROJECT_ID=neginheal
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@neginheal.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

Keep `private_key` on one line; preserve `\n` between PEM lines. Wrap in double quotes.

You do **not** need the “Web API Key” or legacy “Server key” from Cloud Messaging for this setup.

### After configuring

1. Restart the API (reads `api/.env`).
2. Rebuild the APK: `cd android && npm run build` (or `assembleDebug` for local testing).
3. Confirm `pushNotificationConfig { nativePushEnabled }` is `true` in GraphQL.

### What works with vs without Firebase

| Scenario | Without Firebase | With Firebase |
|----------|------------------|---------------|
| In-app badges (app open) | Yes | Yes |
| Launcher badge (app open) | Yes (device-dependent) | Yes |
| Launcher badge (app **closed**) | No | Yes (FCM `badge_sync`) |
| Native push when app closed | No | Yes |

Without Firebase, in-app badges still work while the app is open, but launcher badge counts will not update when the APK is closed.

### Status bar / notch overlap

Samsung and other devices draw the WebView under the system status bar by default. The app handles this via:

- `StatusBar.overlaysWebView: false` in `app/capacitor.config.ts`
- `WindowCompat.setDecorFitsSystemWindows` in `MainActivity`
- `android:windowOptOutEdgeToEdgeEnforcement` for Android 15+ (`values-v35/styles.xml`)
- Native status bar color in `styles.xml` (`statusBarColor`)
- `app/src/native/nativeSafeArea.ts` — disables WebView overlay (no extra CSS body padding)

### Security

- Never commit `google-services.json`, service account JSON, or `FIREBASE_PRIVATE_KEY` to git.
- `android/app/google-services.json` is already in `.gitignore`.
- Store production secrets only in server environment variables.

Keep `android.keystore` out of git (already in `.gitignore`) and back it up safely.
