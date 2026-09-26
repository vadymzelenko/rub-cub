# Cube Solver — каркас проекта

Phaser 3 (UI/меню/навигация) + Three.js (3D-кубик) + OpenCV.js (детект цвета камерой).
Целевая платформа: web → Capacitor → Android (APK) / iOS (IPA).

## Статус: рабочий каркас, не production

Навигация между всеми экранами работает, дизайн-система применена везде.
Три вещи — **заглушки с чётким TODO**, без них решение не считается по-настоящему:

| Модуль | Файл | Статус |
|---|---|---|
| Kociemba Two-Phase | `src/solvers/kociemba.js` | Интерфейс готов, `_solveRaw()` бросает ошибку — нужно подключить `min2phase.js` в Web Worker |
| CFOP (Cross/F2L/OLL/PLL) | `src/solvers/cfop.js` | Структура этапов готова, распознавание кейсов (`_solveCross`, `_solveF2L`, `_solveOLL`, `_solvePLL`) не реализовано, таблицы OLL(57)/PLL(21) пустые |
| facelet → 3D покраска | `src/cube/CubeRenderer3D.js` → `setState()` | Нужна таблица соответствия индекса facelet-строки конкретной грани конкретного мини-кубика |

Всё остальное — сканер камеры (OpenCV.js контур + HSV-классификация + стабильность по кадрам), ручной ввод, 3D-рендер с анимацией поворотов, orbit-управление, дизайн-система — реализовано и должно работать после `npm install`.

## Следующие шаги по приоритету

1. **Подключить min2phase.js** (или `cubejs`) — самое важное, без него нет решения
2. **Таблица facelet→mesh** для `CubeRenderer3D.setState()` — иначе скан не отражается в 3D
3. **OLL/PLL таблицы** для CFOP — можно наполнять постепенно, отдельными data-файлами
4. **Локальный self-hosted OpenCV.js** вместо CDN (`docs.opencv.org`) — обязательно перед релизом, plus для офлайн-работы в APK
5. Обратное воспроизведение ходов в `SolverScene._step(-1)`
6. Web Worker для Kociemba, чтобы анимация не подвисала на телефоне во время расчёта

## Запуск

```bash
npm install
npm run dev        # http://localhost:5173, для теста камеры на телефоне нужен https или туннель (ngrok)
npm run build       # dist/
npx cap add android
npx cap add ios
npm run cap:sync
```

## Структура

```
src/
├── main.js                    Phaser config, регистрация сцен, safe-area
├── scenes/                    Все экраны (наследуют BaseScene)
├── cube/
│   ├── CubeModel.js            Facelet-состояние, применение ходов, валидация
│   └── CubeRenderer3D.js       Three.js рендер + анимация вращений слоёв
├── solvers/
│   ├── kociemba.js              Обёртка (TODO: подключить реальную библиотеку)
│   └── cfop.js                  Обёртка (TODO: реализовать распознавание кейсов)
├── vision/
│   ├── CameraCapture.js         getUserMedia обёртка
│   └── ColorDetector.js         OpenCV.js: контур куба + HSV классификация + стабильность
└── ui/                         Button, Card, TopBar, theme (дизайн-система v0.dev)
```

## Дизайн-система

Токены — `src/ui/theme.js`. Тёмный фон `#0A0A0A`, плоские поверхности без теней,
hairline-границы `#262626`, один акцент `#3B82F6` только для активных состояний.
Inter для текста, JetBrains Mono для числовых меток (счётчик ходов).
Адаптив телефон/планшет — `BaseScene.isTablet`, карточки перестраиваются в 2 колонки на планшете.
Экраны не скроллятся — весь контент рассчитан на `contentHeight` с учётом safe-area.
