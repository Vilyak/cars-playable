import { inject, injectable } from 'tsyringe'
import { DI_TOKENS } from '@/di/tokens'
import type { GameWorld } from '@/ecs/world'
import { CameraEntity } from '@/ecs/entities/CameraEntity'
import { GameApplication } from '@/game/GameApplication'
import { DESIGN_HEIGHT, DESIGN_WIDTH } from '@/puzzle/constants'

@injectable()
export class CameraBootstrapService {
  private cameraEid: number | null = null

  constructor(
    @inject(DI_TOKENS.GameWorld) private readonly world: GameWorld,
    @inject(DI_TOKENS.GameApplication) private readonly game: GameApplication,
  ) {}

  bootstrap(): number {
    const { Camera } = this.world.components
    if (this.cameraEid === null) {
      this.cameraEid = CameraEntity.create(this.world)
      Camera.initDefaults(this.cameraEid, this.game.width, this.game.height)
    }
    this.syncViewport()
    return this.cameraEid
  }

  syncViewport(): void {
    if (this.cameraEid === null) return
    const { Camera } = this.world.components
    const eid = this.cameraEid
    const focusY = DESIGN_HEIGHT * 0.48
    const zoom = Math.min(this.game.width / DESIGN_WIDTH, this.game.height / DESIGN_HEIGHT) * 1.05

    Camera.setViewport(eid, this.game.width, this.game.height)
    Camera.zoom[eid] = zoom
    Camera.x[eid] = DESIGN_WIDTH * 0.5
    Camera.y[eid] = focusY
    Camera.setBounds(eid, DESIGN_WIDTH * 0.5, focusY, DESIGN_WIDTH * 0.5, focusY)
  }

  getCameraEid(): number | null {
    return this.cameraEid
  }
}
