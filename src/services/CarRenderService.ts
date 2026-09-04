import { inject, injectable } from 'tsyringe'
import gsap from 'gsap'
import { Container, Sprite } from 'pixi.js'
import { DI_TOKENS } from '@/di/tokens'
import { AssetService } from '@/assets/AssetService'
import { SceneRoot } from '@/game/SceneRoot'
import { CELL_SIZE, SLIDE_DURATION } from '@/puzzle/constants'
import { carRenderDepth, carToPixel, createCarSprite } from '@/puzzle/carArt'
import { carTextureFrame, GAME_ATLAS } from '@/puzzle/spriteKeys'
import type { CarState } from '@/puzzle/types'

@injectable()
export class CarRenderService {
  readonly container = new Container()
  private carSprites = new Map<string, Container>()
  private targetPulse: gsap.core.Tween | null = null
  private animating = false

  constructor(
    @inject(DI_TOKENS.SceneRoot) scene: SceneRoot,
    @inject(DI_TOKENS.AssetService) private readonly assets: AssetService,
  ) {
    this.container.zIndex = 20
    this.container.sortableChildren = true
    scene.root.addChild(this.container)
  }

  isAnimating(): boolean {
    return this.animating
  }

  rebuild(
    cars: CarState[],
    rows: number,
    cols: number,
    hintCarId: string | null,
    selectedCarId: string | null,
  ): void {
    if (this.animating) return
    this.carSprites.forEach((s) => s.destroy())
    this.carSprites.clear()
    this.container.removeChildren()
    this.targetPulse?.kill()
    this.targetPulse = null

    for (const car of cars) {
      if (car.exited) continue
      this.addCarSprite(car, rows, cols, hintCarId, selectedCarId)
    }
    this.container.children.sort((a, b) => a.zIndex - b.zIndex)
  }

  private addCarSprite(
    car: CarState,
    rows: number,
    cols: number,
    hintCarId: string | null,
    selectedCarId: string | null,
  ): Container {
    const pos = carToPixel(car, rows, cols)

    const frame = carTextureFrame(car)
    const texture = this.assets.getGeneratedTexture(GAME_ATLAS, frame)
    const sprite = createCarSprite(car, texture, car.id === selectedCarId, car.id === hintCarId)
    sprite.x = pos.x
    sprite.y = pos.y
    sprite.zIndex = carRenderDepth(car)
    this.container.addChild(sprite)
    this.carSprites.set(car.id, sprite)

    if (car.isTarget) {
      const body = sprite.children.find((child): child is Sprite => child instanceof Sprite)
      if (body) {
        body.scale.set(1)
        this.targetPulse = gsap.to(body.scale, {
          x: 1.04,
          y: 1.04,
          duration: 0.75,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
        })
      }
    }
    return sprite
  }

  animateMove(
    carId: string,
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
    car: CarState,
    rows: number,
    cols: number,
  ): Promise<void> {
    const sprite = this.carSprites.get(carId)
    if (!sprite) return Promise.resolve()

    this.animating = true
    this.targetPulse?.pause()

    const from = carToPixel({ ...car, row: fromRow, col: fromCol }, rows, cols)
    const to = carToPixel({ ...car, row: toRow, col: toCol }, rows, cols)

    sprite.x = from.x
    sprite.y = from.y

    return new Promise((resolve) => {
      gsap.to(sprite, {
        x: to.x,
        y: to.y,
        duration: SLIDE_DURATION,
        ease: 'power2.out',
        onComplete: () => {
          this.animating = false
          this.targetPulse?.resume()
          resolve()
        },
      })
    })
  }

  animateTargetExit(car: CarState, _rows: number, _cols: number): Promise<void> {
    const sprite = this.carSprites.get(car.id)
    if (!sprite) return Promise.resolve()

    this.animating = true
    this.targetPulse?.kill()

    return new Promise((resolve) => {
      gsap.to(sprite, {
        x: sprite.x + CELL_SIZE * 4,
        duration: 0.8,
        ease: 'power2.in',
        onComplete: () => {
          sprite.destroy()
          this.carSprites.delete(car.id)
          this.animating = false
          resolve()
        },
      })
    })
  }

  clear(): void {
    this.targetPulse?.kill()
    this.targetPulse = null
    this.carSprites.forEach((s) => s.destroy())
    this.carSprites.clear()
    this.container.removeChildren()
    this.animating = false
  }
}
