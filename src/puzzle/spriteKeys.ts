import { Textures, type TextureAtlas } from '@/assets/generated/Textures'
import type { CarDef } from '@/puzzle/types'

type GameFrame = keyof (typeof Textures)['game']

const CAR_FRAMES: Record<string, GameFrame> = {
  'red-h2': 'carRedH2',
  'blue-v2': 'carBlueV2',
  'green-v2': 'carGreenV2',
  'yellow-h2': 'carYellowH2',
  'purple-h3': 'carPurpleH3',
  'purple-h2': 'carPurpleH2',
  'orange-v2': 'carOrangeV2',
  'cyan-h3': 'carCyanH3',
}

export function carTextureFrame(car: CarDef): GameFrame {
  const orient = car.orientation === 'horizontal' ? 'h' : 'v'
  const key = `${car.color}-${orient}${car.length}`
  return CAR_FRAMES[key] ?? 'carRedH2'
}

export const GAME_ATLAS = 'game' satisfies TextureAtlas
export const GAME_BG_ALIAS = 'game/bg'
export const GAME_BOARD_FRAME_ALIAS = 'game/board_frame'
export const GAME_BOARD_GRID_ALIAS = 'game/board_grid'
