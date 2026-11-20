# Void Shards

A dark, high-intensity match-3 puzzle game for Android. Swap shards, forge specials, and hold back the void.
It's built to be **harder than the usual match-3**:

- **Void Bombs** count down every move. Let one reach zero and you lose the level instantly.
- **Corruption** spreads to a neighbouring shard every turn you fail to destroy some of it.
- **Obsidian** (2 hits), **Frost** (1–2 layers), **Chains** (locked shards) and **holes** in the board.
- Six shard types from sector 4 onward, so fewer free cascades.
- Tight move limits. Hints only appear in the first four sectors.
- 20 sectors, with a boss sector every 5.

Specials: 4 in a row → **Beam**, L/T → **Nova**, 5 in a row → **Prism**. Swap two specials for combos:
Crossfire (beam + nova), Supernova (nova + nova), Total Erasure (prism + prism) and more.

Graphics are drawn on HTML5 Canvas with glow, particles, shockwaves, screen shake and a danger vignette.
**All audio is synthesized live** with Web Audio: a reverb'd SFX engine and an adaptive soundtrack that speeds up as the danger rises.
There are no third-party assets, so there are no licensing issues.

## Project layout

```
www/            the game (index.html, game.js, audio.js, levels.js, style.css)
assets/         source icon and splash (1024px / 2732px)
android/        Capacitor Android project (targetSdk 36)
capacitor.config.json
```

Edit levels in `www/levels.js`. Each level is an 8×8 character map (see the legend at the top of the file).

## Run in a browser

```bash
npx http-server www -p 8080 -c-1
```

Open http://localhost:8080. Use your browser's device toolbar to get a phone-shaped view.

## Build for Android

Requirements: Node 20+, JDK 21, and the Android SDK (install Android Studio, or the command-line tools with `platforms;android-36` and `build-tools;36.0.0`).

```bash
npm install
npx cap sync android
cd android && ./gradlew assembleDebug        # app/build/outputs/apk/debug/app-debug.apk
```

Install the APK on your phone to test it (`adb install app/build/outputs/apk/debug/app-debug.apk`).

### Signed release bundle for Google Play

1. Create an upload key once. **Back it up somewhere safe and never commit it.**
   ```bash
   keytool -genkeypair -v -keystore android/upload-key.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Copy `android/keystore.properties.example` to `android/keystore.properties` and fill in your passwords.
3. Build:
   ```bash
   npx cap sync android && cd android && ./gradlew bundleRelease
   ```
   Output: `android/app/build/outputs/bundle/release/app-release.aab`
4. For every update, bump `versionCode` (and `versionName`) in `android/app/build.gradle`.

## Publishing on Google Play

1. Create a Google Play Console developer account (one-time US$25 fee) and verify your identity.
2. Change `appId` in `capacitor.config.json` (and `applicationId`/`namespace` in `android/app/build.gradle`) to an ID you own, e.g. `com.yourname.voidshards`. It can never change after the first upload.
3. Create the app, then fill in: store listing (512px icon, 1024×500 feature graphic, at least 2 phone screenshots), content rating questionnaire, target audience, data safety (this game collects no data) and a privacy policy URL.
4. Enrol in Play App Signing and upload the `.aab`.
5. **New personal developer accounts** must run a closed test with at least 12 testers for 14 consecutive days before they can apply for production access.
