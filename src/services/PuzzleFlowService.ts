import { inject, injectable } from 'tsyringe'
import { DI_TOKENS } from '@/di/tokens'
import { getStore } from '@/ui/store/storeHolder'
import {
  carMoved,
  firstSuccess,
  levelFailed,
  levelLoaded,
  levelWon,
  setHint,
  setHintCarId,
  dismissHint,
  allLevelsComplete,
} from '@/ui/store/playableSlice'
import { PuzzleGridService } from '@/services/PuzzleGridService'
import { PuzzleLevelLoaderService } from '@/services/PuzzleLevelLoaderService'
import { CarRenderService } from '@/services/CarRenderService'
import { CarInputService } from '@/services/CarInputService'
import { AudioService } from '@/services/AudioService'
import { ParticleService } from '@/services/ParticleService'
import { CameraCommandService } from '@/services/CameraCommandService'
import {
  EXTRA_MOVES_HINT,
  HINT_DELAY_MS,
  RESTART_DELAY_MS,
} from '@/puzzle/constants'
import type { PlayablePhase } from '@/puzzle/types'
import { carToPixel } from '@/puzzle/carArt'

@injectable()
export class PuzzleFlowService {
  currentLevel = 1
  phase: PlayablePhase = 'tutorial'
  hintCarId: string | null = null
  private hasFirstSuccess = false
  private hintTimer: ReturnType<typeof setTimeout> | null = null
  private restartTimer: ReturnType<typeof setTimeout> | null = null

  constructor(
    @inject(DI_TOKENS.PuzzleLevelLoaderService) private readonly loader: PuzzleLevelLoaderService,
    @inject(DI_TOKENS.PuzzleGridService) private readonly grid: PuzzleGridService,
    @inject(DI_TOKENS.CarRenderService) private readonly render: CarRenderService,
    @inject(DI_TOKENS.CarInputService) private readonly input: CarInputService,
    @inject(DI_TOKENS.AudioService) private readonly audio: AudioService,
    @inject(DI_TOKENS.ParticleService) private readonly particles: ParticleService,
    @inject(DI_TOKENS.CameraCommandService) private readonly camera: CameraCommandService,
  ) {
    this.input.onMove = (req) => void this.tryMove(req.carId, req.direction)
  }

  start(): void {
    this.input.mount()
    this.startLevel(1)
  }

  startLevel(level: number): void {
    this.clearTimers()
    this.currentLevel = level
    this.phase = level === 1 ? 'tutorial' : 'playing'
    this.hintCarId = null

    this.render.clear()
    const config = this.loader.load(level)
    this.grid.loadLevel(config)
    this.input.setEnabled(true)

    this.refreshVisuals()
    getStore().dispatch(
      levelLoaded({
        level,
        phase: this.phase,
        hint: config.hintOnStuck ?? 'Попробуй другую машину!',
        optimalMoves: config.optimalMoves,
      }),
    )
    getStore().dispatch(dismissHint())

    this.hintTimer = setTimeout(() => this.showHint(), HINT_DELAY_MS)
    this.restartTimer = setTimeout(() => this.autoRestart(), RESTART_DELAY_MS)
  }

  private async tryMove(carId: string, direction: -1 | 1): Promise<void> {
    if (this.phase === 'win' || this.phase === 'animating' || this.phase === 'complete') return
    if (this.render.isAnimating()) return

    const car = this.grid.cars.find((c) => c.id === carId)
    if (!car || car.exited) return

    const steps = this.grid.canMove(carId, direction)
    if (steps === 0) return

    const fromRow = car.row
    const fromCol = car.col

    if (this.phase === 'tutorial') {
      this.phase = 'playing'
    }

    this.phase = 'animating'
    this.input.setEnabled(false)

    const result = this.grid.moveCar(carId, direction)
    if (!result.moved) {
      this.phase = 'playing'
      this.input.setEnabled(true)
      return
    }
    const movedCar = this.grid.cars.find((c) => c.id === carId)!

    await this.render.animateMove(
      carId,
      fromRow,
      fromCol,
      movedCar.row,
      movedCar.col,
      movedCar,
      this.grid.level!.rows,
      this.grid.level!.cols,
    )

    this.audio.play('slide')
    getStore().dispatch(carMoved({ moveCount: this.grid.moveCount }))

    this.refreshVisuals()
    this.input.setEnabled(true)
    this.phase = 'playing'

    if (this.grid.moveCount > (this.grid.level?.optimalMoves ?? 99) + EXTRA_MOVES_HINT) {
      this.showHint()
    }

    if (this.grid.isWin()) {
      await this.handleWin(movedCar)
    }
  }

  private async handleWin(targetCar: { row: number; col: number; id: string }): Promise<void> {
    this.phase = 'win'
    this.input.setEnabled(false)
    this.clearTimers()

    const winCar = this.grid.cars.find((c) => c.id === targetCar.id)!
    await this.render.animateTargetExit(winCar, this.grid.level!.rows, this.grid.level!.cols)

    const pos = carToPixel(winCar, this.grid.level!.rows, this.grid.level!.cols)
    this.particles.confetti(pos.x, pos.y)
    this.audio.play('win')
    this.camera.enqueueShake(10)
    if (navigator.vibrate) navigator.vibrate(50)

    if (!this.hasFirstSuccess) {
      this.hasFirstSuccess = true
      getStore().dispatch(firstSuccess())
    }

    getStore().dispatch(levelWon({ level: this.currentLevel }))

    setTimeout(() => {
      if (this.currentLevel < 3) {
        this.startLevel(this.currentLevel + 1)
      } else {
        getStore().dispatch(allLevelsComplete())
      }
    }, 1500)
  }

  private showHint(): void {
    const id = this.grid.getHintCarId()
    if (!id) return
    this.hintCarId = id
    getStore().dispatch(setHintCarId(id))
    const hint = this.grid.level?.hintOnStuck ?? 'Попробуй сдвинуть подсвеченную машину!'
    getStore().dispatch(setHint(hint))
    this.refreshVisuals()
  }

  private autoRestart(): void {
    if (this.phase === 'win') return
    this.phase = 'hintRestart'
    getStore().dispatch(levelFailed({ hint: this.grid.level?.hintOnStuck ?? 'Попробуй ещё раз!' }))
    setTimeout(() => this.startLevel(this.currentLevel), 800)
  }

  private refreshVisuals(): void {
    if (!this.grid.level) return
    this.render.rebuild(
      this.grid.cars,
      this.grid.level.rows,
      this.grid.level.cols,
      this.hintCarId,
      null,
    )
  }

  update(_dt: number): void {
    // timers use setTimeout; tick reserved for future idle animations
  }

  private clearTimers(): void {
    if (this.hintTimer) clearTimeout(this.hintTimer)
    if (this.restartTimer) clearTimeout(this.restartTimer)
    this.hintTimer = null
    this.restartTimer = null
  }
}
