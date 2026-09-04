import { injectable } from 'tsyringe'
import { CELL_SIZE } from '@/puzzle/constants'
import type { CarState, MoveResult, PuzzleLevel } from '@/puzzle/types'

@injectable()
export class PuzzleGridService {
  level: PuzzleLevel | null = null
  cars: CarState[] = []
  moveCount = 0

  loadLevel(level: PuzzleLevel): void {
    this.level = level
    this.cars = level.cars.map((c) => ({ ...c }))
    this.moveCount = 0
  }

  reset(): void {
    if (this.level) this.loadLevel(this.level)
  }

  getTargetCar(): CarState | undefined {
    return this.cars.find((c) => c.isTarget && !c.exited)
  }

  getCarCells(car: CarState): Array<{ row: number; col: number }> {
    const cells: Array<{ row: number; col: number }> = []
    for (let i = 0; i < car.length; i++) {
      if (car.orientation === 'horizontal') {
        cells.push({ row: car.row, col: car.col + i })
      } else {
        cells.push({ row: car.row + i, col: car.col })
      }
    }
    return cells
  }

  private isOccupied(row: number, col: number, excludeId?: string): boolean {
    for (const car of this.cars) {
      if (car.exited || car.id === excludeId) continue
      for (const cell of this.getCarCells(car)) {
        if (cell.row === row && cell.col === col) return true
      }
    }
    return false
  }

  canMove(carId: string, direction: -1 | 1): number {
    if (!this.level) return 0
    const car = this.cars.find((c) => c.id === carId && !c.exited)
    if (!car) return 0

    let steps = 0
    while (true) {
      if (car.orientation === 'horizontal') {
        if (direction > 0) {
          const frontCol = car.col + car.length + steps
          if (car.isTarget && this.level.exit.row === car.row && this.level.exit.side === 'right') {
            if (frontCol >= this.level.cols) {
              return steps + 1
            }
          }
          if (frontCol >= this.level.cols) break
          if (this.isOccupied(car.row, frontCol, car.id)) break
        } else {
          const frontCol = car.col - 1 - steps
          if (frontCol < 0) break
          if (this.isOccupied(car.row, frontCol, car.id)) break
        }
      } else {
        if (direction > 0) {
          const frontRow = car.row + car.length + steps
          if (frontRow >= this.level.rows) break
          if (this.isOccupied(frontRow, car.col, car.id)) break
        } else {
          const frontRow = car.row - 1 - steps
          if (frontRow < 0) break
          if (this.isOccupied(frontRow, car.col, car.id)) break
        }
      }
      steps++
    }
    return steps
  }

  moveCar(carId: string, direction: -1 | 1): MoveResult {
    const steps = this.canMove(carId, direction)
    if (steps === 0) return { moved: false, cells: 0, carId }

    const car = this.cars.find((c) => c.id === carId)!
    if (car.orientation === 'horizontal') {
      car.col += direction * steps
    } else {
      car.row += direction * steps
    }

    if (car.isTarget && this.level) {
      const rightEdge = car.col + car.length
      if (
        this.level.exit.side === 'right' &&
        car.row === this.level.exit.row &&
        rightEdge >= this.level.cols
      ) {
        car.exited = true
      }
    }

    this.moveCount++
    return { moved: true, cells: steps, carId }
  }

  isWin(): boolean {
    const target = this.cars.find((c) => c.isTarget)
    return target?.exited === true
  }

  getHintCarId(): string | null {
    if (!this.level) return null
    if (this.level.hintCarId) {
      const hint = this.level.hintCarId
      const car = this.cars.find((c) => c.id === hint)
      if (car && (this.canMove(hint, -1) > 0 || this.canMove(hint, 1) > 0)) return hint
    }
    for (const car of this.cars) {
      if (car.exited) continue
      if (this.canMove(car.id, -1) > 0 || this.canMove(car.id, 1) > 0) return car.id
    }
    return null
  }

  hitTestCar(row: number, col: number): string | null {
    for (const car of this.cars) {
      if (car.exited) continue
      for (const cell of this.getCarCells(car)) {
        if (cell.row === row && cell.col === col) return car.id
      }
    }
    return null
  }

  pixelToCell(
    x: number,
    y: number,
    originX: number,
    originY: number,
  ): { row: number; col: number } | null {
    if (!this.level) return null
    const col = Math.floor((x - originX) / CELL_SIZE)
    const row = Math.floor((y - originY) / CELL_SIZE)
    if (row < 0 || col < 0 || row >= this.level.rows || col >= this.level.cols) return null
    return { row, col }
  }
}
