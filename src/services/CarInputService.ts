import { inject, injectable } from 'tsyringe'
import type { FederatedPointerEvent } from 'pixi.js'
import { Rectangle } from 'pixi.js'
import { DI_TOKENS } from '@/di/tokens'
import { SceneRoot } from '@/game/SceneRoot'
import { DESIGN_HEIGHT, DESIGN_WIDTH, SWIPE_MIN_DELTA } from '@/puzzle/constants'
import { boardOrigin } from '@/puzzle/carArt'
import { PuzzleGridService } from '@/services/PuzzleGridService'
import { CarRenderService } from '@/services/CarRenderService'

export type CarMoveRequest = {
  carId: string
  direction: -1 | 1
}

@injectable()
export class CarInputService {
  private enabled = true
  private mounted = false
  private activeCarId: string | null = null
  private startX = 0
  private startY = 0
  onMove: ((req: CarMoveRequest) => void) | null = null
  onFirstPointer: (() => void) | null = null
  private firstPointerFired = false

  constructor(
    @inject(DI_TOKENS.SceneRoot) private readonly scene: SceneRoot,
    @inject(DI_TOKENS.PuzzleGridService) private readonly grid: PuzzleGridService,
    @inject(DI_TOKENS.CarRenderService) private readonly cars: CarRenderService,
  ) {}

  mount(): void {
    if (this.mounted) return
    this.mounted = true
    const root = this.scene.root
    root.eventMode = 'static'
    root.hitArea = new Rectangle(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT)
    root.on('pointerdown', this.onDown)
    root.on('pointermove', this.onMovePointer)
    root.on('pointerup', this.onUp)
    root.on('pointerupoutside', this.onUp)
  }

  unmount(): void {
    if (!this.mounted) return
    const root = this.scene.root
    root.off('pointerdown', this.onDown)
    root.off('pointermove', this.onMovePointer)
    root.off('pointerup', this.onUp)
    root.off('pointerupoutside', this.onUp)
    this.mounted = false
  }

  setEnabled(value: boolean): void {
    this.enabled = value
  }

  private onDown = (e: FederatedPointerEvent): void => {
    if (!this.enabled || this.cars.isAnimating()) return
    if (!this.firstPointerFired) {
      this.firstPointerFired = true
      this.onFirstPointer?.()
    }

    const pos = e.getLocalPosition(this.scene.root)
    this.startX = pos.x
    this.startY = pos.y

    const level = this.grid.level
    if (!level) return
    const origin = boardOrigin(level.rows, level.cols)
    const cell = this.grid.pixelToCell(pos.x, pos.y, origin.x, origin.y)
    if (!cell) return

    this.activeCarId = this.grid.hitTestCar(cell.row, cell.col)
  }

  private onMovePointer = (_e: FederatedPointerEvent): void => {
    // reserved for drag preview
  }

  private onUp = (e: FederatedPointerEvent): void => {
    if (!this.enabled || !this.activeCarId) return

    const pos = e.getLocalPosition(this.scene.root)
    const dx = pos.x - this.startX
    const dy = pos.y - this.startY
    const car = this.grid.cars.find((c) => c.id === this.activeCarId)
    this.activeCarId = null

    if (!car || car.exited) return

    let direction: -1 | 1 | null = null
    if (car.orientation === 'horizontal') {
      if (Math.abs(dx) < SWIPE_MIN_DELTA) return
      direction = dx > 0 ? 1 : -1
    } else {
      if (Math.abs(dy) < SWIPE_MIN_DELTA) return
      direction = dy > 0 ? 1 : -1
    }

    this.onMove?.({ carId: car.id, direction })
  }
}
