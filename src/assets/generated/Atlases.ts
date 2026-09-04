export const Atlases = {
  demo: "/assets/demo.json",
  game: "/assets/game.json",
} as const

export type AtlasName = keyof typeof Atlases
