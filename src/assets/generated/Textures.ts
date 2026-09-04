export const Textures = {
  demo: {
    bunny: "bunny",
  },
  game: {
    carBlueV2: "car_blue_v2",
    carCyanH3: "car_cyan_h3",
    carGreenV2: "car_green_v2",
    carOrangeV2: "car_orange_v2",
    carPurpleH2: "car_purple_h2",
    carPurpleH3: "car_purple_h3",
    carRedH2: "car_red_h2",
    carYellowH2: "car_yellow_h2",
    exitArrow: "exit_arrow",
  },
} as const

export type TextureAtlas = keyof typeof Textures
