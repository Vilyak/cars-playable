# Пробка: Выпусти машину

Playable ad — логическая головоломка (slide puzzle) на **PixiJS v8** + **React / Redux**.

## Скрипты

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run assets:process` — обработка исходников из `assets/` (фон, поле, машины)
- `npm run assets:pack` — process + упаковка в атлас `game` и `public/assets/game/`

## Графика

Казуальные спрайты (AI-generated) лежат в `assets/` и при сборке обрабатываются в:

- `public/assets/game/bg.png` — фон парковки (720×960)
- `public/assets/game/board.png` — поле 6×6 с разметкой
- `raw_assets/game/` — машины и стрелка выхода → атлас `game`


## Механика

Свайп по машине в направлении её оси — машина скользит до упора. Красная машина должна выехать через выход справа.

3 уровня, туториал, подсказки, CTA «Play Now».
