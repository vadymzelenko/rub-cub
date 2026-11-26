# RubCub

Rubik's Cube 3x3 scanner and solver. An installable, offline-ready PWA built with React and Vite, packaged for Android with Capacitor.

Live: https://rub-cub.vercel.app/

## Features

- **Camera scanning**: guided order (four sides, then top and bottom), coloured hints showing which centres must surround the face, live sticker preview, flashlight toggle, undo, per-face confirmation with a colour picker
- **Robust colour detection**: CIELAB matching against the measured centres of your own cube, with a balanced re-classification (exactly 9 stickers per colour) if the first pass does not add up; optional one-off calibration
- **Full solvability check**: sticker counts, impossible corners and edges, duplicated pieces, twisted corners, flipped edges and swap parity, with clear messages in every language
- **Manual input** on an unfolded net with per-colour counters
- **Kociemba two-phase solver** (`cubejs`) running in a Web Worker, so the UI never freezes; every solution is verified before it is shown
- **3D player**: animated cube, play/pause, step forward and back, jump to any move, keeps the screen awake while solving
- **Learning mode**: the 7-step beginner method with diagrams and 3D demonstrations of every algorithm
- Light, dark and automatic theme; English, Polish, Ukrainian and Russian

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build (service worker enabled)
```

The camera needs HTTPS (or `localhost`).

## PWA

`vite-plugin-pwa` generates the manifest and a Workbox service worker that precaches the whole app, including the solver and fonts, so it works fully offline after the first visit. New versions show an “Update” prompt. The manifest has maskable icons, app shortcuts (Scan, Manual, Learn) and screenshots for the rich install dialog. Shortcuts open a screen directly with `?screen=scan|manual|learn|help|settings|about`.

## Android

The Capacitor project lives in `android/` (app id `dev.vzstudio.rubcub`, target SDK 36). Requirements: Node 22+, JDK 21, Android SDK.

```bash
npm run android:debug     # build web app, sync, assemble a debug APK
npm run android:open      # open in Android Studio
npm run assets:android    # regenerate launcher icons and splash from assets/
```

The version code and name come from `package.json` (`1.2.3` → `10203`).

### CI builds

`.github/workflows/android.yml` builds a debug APK on every push to `main`, on pull requests and on manual runs (download it from the run's artifacts). When a GitHub release is published, the APKs are attached to it.

To also get a **signed release APK and AAB** (for Google Play), add these repository secrets:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 release.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password |
| `ANDROID_KEY_ALIAS` | key alias |
| `ANDROID_KEY_PASSWORD` | key password |

Create a keystore once with:

```bash
keytool -genkey -v -keystore release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias rubcub
```

Locally, the same values are read from `RUBCUB_KEYSTORE_PATH`, `RUBCUB_KEYSTORE_PASSWORD`, `RUBCUB_KEY_ALIAS` and `RUBCUB_KEY_PASSWORD`.

## Structure

```
src/
├── App.jsx                    Navigation stack mirrored in browser history (back button / gesture)
├── main.jsx                   Entry point, theme, service worker, native shell
├── settings.js                Persisted settings (theme, animation speed)
├── pwa.js                     Install prompt and update handling
├── i18n.jsx, locales.js       Localisation (en, pl, uk, ru)
├── screens/                   Home, Scan, Calibrate, Manual, Review, Solve, Learn, Help, Settings, About
├── components/                TopBar, CubeNet, ColorPicker, Cube3D (Three.js), HeroCube, Logo, UpdateToast
├── cube/CubeModel.js          Facelet state, moves, solvability analysis
├── solvers/                   Kociemba solver in a Web Worker
└── vision/ColorDetector.js    CIELAB colour classification and face sampling
```

## Stack

React 19, Vite 7, vite-plugin-pwa, Three.js, cubejs, Capacitor 8, react-icons, @fontsource/inter.

## License

[MIT](LICENSE) © Vadym Zelenko
