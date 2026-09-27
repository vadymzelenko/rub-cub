# Cube Solver

Сканер и решатель кубика Рубика 3×3. Веб (React + Vite) с упаковкой под
Android/iOS через Capacitor.

## Возможности

- Скан камерой: захват грани по кнопке-«затвору», цветные подсказки центров
  соседних граней вокруг рамки, авто-коррекция «растекания» цвета центра,
  проверка согласованности (количество цветов + невозможные кусочки).
- Ручной ввод цветов на развёртке.
- Решатель Kociemba Two-Phase (библиотека `cubejs`) с 3D-анимацией поворотов.
- Обучение: пошаговый послойный метод из 7 шагов с алгоритмами и 3D-превью.
- Инструкция по использованию, настройки (тема/язык/скорость), 4 языка.

## Запуск

```bash
npm install
npm run dev        # http://localhost:5173 (для камеры на телефоне нужен https или туннель)
npm run build      # сборка в dist/
npx cap add android
npx cap add ios
npm run cap:sync
```

## Структура

```
src/
├── App.jsx                  Маршрутизация экранов (без роутера)
├── main.jsx                 Точка входа, шрифты, тема
├── i18n.jsx / locales.js    Локализация (ru/en/pl/uk)
├── screens/                 Экраны (Home, Scan, Manual, Review, Solve, Learn, Help, Settings, About)
├── components/              TopBar, CubeNet (развёртка), Cube3D (Three.js)
├── cube/CubeModel.js        Facelet-состояние, ходы, валидация/анализ
├── solvers/kociemba.js      Решатель (cubejs)
└── vision/ColorDetector.js  Классификация цвета HSV + сэмплинг грани 3×3
```

## Технологии

React 19, Vite 5, Three.js (3D), cubejs (решатель), react-icons,
@fontsource/rubik (шрифт, локально), Capacitor 6.

