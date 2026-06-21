# Negin Heal Android (TWA)

Trusted Web Activity wrapper for [https://neginheal.ir/](https://neginheal.ir/). The APK only provides a launcher icon and splash screen; all app content loads from the live website and updates automatically when you deploy the web app.

- **Package ID:** `ir.neginheal.app`
- **Config:** `twa-manifest.json`

## Prerequisites

- Node.js 14+
- JDK 17 (Bubblewrap uses `~/.bubblewrap/jdk` or set `BUBBLEWRAP_JDK_HOME`)
- Android SDK with build-tools 34+ (`ANDROID_HOME` or `~/Library/Android/sdk`)

Configure Bubblewrap paths if needed:

```bash
npx bubblewrap doctor
npx bubblewrap updateConfig --jdkPath="/path/to/jdk-17" --androidSdkPath="/path/to/android-sdk"
```

## Build the APK

```bash
cd android
npm install          # first time only
npm run build
```

Output:

- `app-release-signed.apk` — install and test on a device
- `app-release-bundle.aab` — upload to Google Play
- `../app/public/app/negin-heal.apk` — copy for web download (e.g. `https://neginheal.ir/app/negin-heal.apk`)

Default keystore passwords are in `.env.example`. Override for builds:

```bash
export BUBBLEWRAP_KEYSTORE_PASSWORD='your-password'
export BUBBLEWRAP_KEY_PASSWORD='your-password'
npm run build
```

Create a signing keystore (first time only):

```bash
npm run setup:keystore
```

## Other commands

| Command | Purpose |
|---------|---------|
| `npm run update:project` | Regenerate Android files after editing `twa-manifest.json` |
| `npm run fingerprint` | Print SHA-256 certificate fingerprint |
| `npm run assetlinks` | Generate Digital Asset Links JSON via Bubblewrap |
| `npm run install:apk` | Install the signed APK on a connected device |
| `npm run doctor` | Check JDK and Android SDK configuration |

## Troubleshooting

If `npm run build` fails after running `npm run update:project`, the update script re-applies local fixes for:

- Aliyun Maven mirrors when `dl.google.com` is unreachable
- `compileSdkVersion 35` and `buildToolsVersion 35.0.1` to match installed SDK packages
- Stable `androidbrowserhelper:2.5.0` (compatible with compileSdk 35; 2.6.2 requires androidx.browser 1.9.0+)

Ensure your Android SDK has `platforms;android-35` and `build-tools;35.0.1` installed. The build script writes `local.properties` automatically from `ANDROID_SDK_ROOT`, `ANDROID_HOME`, or `~/Library/Android/sdk`.

## Before Play Store release

### 1. Deploy `assetlinks.json`

The file lives at `app/public/.well-known/assetlinks.json` and is regenerated on each `npm run build` in `android/`. After building the APK, **redeploy the web app** so production serves real JSON at:

`https://neginheal.ir/.well-known/assetlinks.json`

Verify (must return `content-type: application/json`, not HTML):

```bash
curl -sI https://neginheal.ir/.well-known/assetlinks.json
curl -s https://neginheal.ir/.well-known/assetlinks.json
```

Example content (the second entry is required for Cafe Bazaar TWA validation):

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "ir.neginheal.app",
      "sha256_cert_fingerprints": [
        "C7:61:73:0B:0E:0F:63:9C:33:71:16:ED:F1:E1:EC:06:E6:94:D7:80:43:E4:A0:4E:BE:AD:CE:09:87:07:26:DF"
      ]
    }
  },
  {
    "relation": ["check_validation"],
    "target": {
      "namespace": "cafebazaar_twa",
      "package_name": "ir.neginheal.app"
    }
  }
]
```

See [Cafe Bazaar TWA guide](https://developers.cafebazaar.ir/fa/document/feature/trusted-web-application/).

Run `npm run fingerprint` again if you create a new keystore, then `npm run sync:assetlinks` and redeploy.

### 2. Fix static file serving on production

`https://neginheal.ir/icons/icon-512.png` and `/manifest.webmanifest` must be served as static files, not SPA HTML fallback. Update nginx or your static server so those paths are excluded from the single-page-app rewrite.

### 3. Use a production keystore

Keep `android.keystore` out of git (already in `.gitignore`) and back it up safely. Use a dedicated release keystore for Play Store uploads.
