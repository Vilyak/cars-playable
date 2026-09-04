import { inject, injectable } from 'tsyringe'
import { Sprite } from 'pixi.js'
import { DI_TOKENS } from '@/di/tokens'
import { AssetService } from '@/assets/AssetService'
import { SceneRoot } from '@/game/SceneRoot'
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '@/puzzle/constants'
import { GAME_BG_ALIAS } from '@/puzzle/spriteKeys'

@injectable()
export class BackgroundRenderService {
  private mounted = false

  constructor(
    @inject(DI_TOKENS.SceneRoot) private readonly scene: SceneRoot,
    @inject(DI_TOKENS.AssetService) private readonly assets: AssetService,
  ) {}

  mount(): void {
    if (this.mounted) return
    const bg = new Sprite(this.assets.getStandalone(GAME_BG_ALIAS))
    bg.width = DESIGN_WIDTH
    bg.height = DESIGN_HEIGHT
    bg.zIndex = 0
    this.scene.root.addChild(bg)
    this.scene.root.sortableChildren = true
    this.mounted = true
  }
}
