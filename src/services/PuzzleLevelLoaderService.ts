import { inject, injectable } from 'tsyringe'
import { Container } from 'pixi.js'
import { DI_TOKENS } from '@/di/tokens'
import { AssetService } from '@/assets/AssetService'
import { SceneRoot } from '@/game/SceneRoot'
import { createParkingBoard } from '@/puzzle/carArt'
import {
  GAME_ATLAS,
  GAME_BOARD_FRAME_ALIAS,
  GAME_BOARD_GRID_ALIAS,
} from '@/puzzle/spriteKeys'
import type { PuzzleLevel } from '@/puzzle/types'
import puzzle1 from '@/levels/puzzle1.json'
import puzzle2 from '@/levels/puzzle2.json'
import puzzle3 from '@/levels/puzzle3.json'

const LEVELS: PuzzleLevel[] = [puzzle1, puzzle2, puzzle3] as PuzzleLevel[]

@injectable()
export class PuzzleLevelLoaderService {
  readonly boardContainer = new Container()
  currentLevel: PuzzleLevel | null = null

  constructor(
    @inject(DI_TOKENS.SceneRoot) scene: SceneRoot,
    @inject(DI_TOKENS.AssetService) private readonly assets: AssetService,
  ) {
    this.boardContainer.zIndex = 10
    scene.root.addChild(this.boardContainer)
  }

  getLevel(index: number): PuzzleLevel {
    return LEVELS[index - 1] ?? LEVELS[0]
  }

  load(index: number): PuzzleLevel {
    this.boardContainer.removeChildren()
    const level = this.getLevel(index)
    this.currentLevel = level

    const frameTexture = this.assets.getStandalone(GAME_BOARD_FRAME_ALIAS)
    const gridTexture = this.assets.getStandalone(GAME_BOARD_GRID_ALIAS)
    const exitTexture = this.assets.getGeneratedTexture(GAME_ATLAS, 'exitArrow')
    this.boardContainer.addChild(
      createParkingBoard(level, frameTexture, gridTexture, exitTexture),
    )
    return level
  }

  clear(): void {
    this.boardContainer.removeChildren()
    this.currentLevel = null
  }
}
