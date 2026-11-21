# Cube Solver

Rubik's Cube 3x3 scanner and solver. A React web app packaged for Android and iOS with Capacitor.

Live: https://rub-cub.vercel.app/

## Features

- Camera scanning: capture each face with a shutter button, colour hints for the neighbouring centres around the frame, automatic correction of centre colour bleed, consistency checks (colour counts and impossible pieces)
- Manual colour input on an unfolded cube net
- Kociemba two-phase solver (`cubejs`) with an animated 3D cube showing each move
- Learning mode: the 7-step layer-by-layer beginner method with algorithms and 3D previews
- Built-in guide and settings for theme, language and animation speed
- Four languages: English, Polish, Ukrainian, Russian

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

The camera on a phone requires HTTPS. For local testing use a tunnel or `vite --host` with a certificate.

## Mobile builds

```bash
npm run build
npx cap add android      # or: npx cap add ios
npm run cap:sync
npm run cap:android      # opens Android Studio
```

A debug APK is built by GitHub Actions on every push to `main` (workflow artifacts) and attached to each published GitHub release. A Codemagic configuration (`codemagic.yaml`) is included as an alternative.

## Structure

```
src/
├── App.jsx                  Screen navigation
├── main.jsx                 Entry point, fonts, theme
├── i18n.jsx, locales.js     Localisation (en, pl, uk, ru)
├── screens/                 Home, Scan, Manual input, Review, Solve, Learn, Help, Settings, About
├── components/              TopBar, CubeNet (unfolded net), Cube3D (Three.js)
├── cube/CubeModel.js        Facelet state, moves, validation and analysis
├── solvers/kociemba.js      Solver wrapper (cubejs)
└── vision/ColorDetector.js  HSV colour classification and 3x3 face sampling
```

## Stack

React 19, Vite 5, Three.js, cubejs, Capacitor 6, react-icons, @fontsource/inter.

## License

[MIT](LICENSE) © Vadym Zelenko
