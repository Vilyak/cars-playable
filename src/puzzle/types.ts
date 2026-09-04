export type Orientation = 'horizontal' | 'vertical'
export type ExitSide = 'left' | 'right'

export type CarDef = {
  id: string
  row: number
  col: number
  length: 2 | 3
  orientation: Orientation
  isTarget?: boolean
  color: string
}

export type PuzzleLevel = {
  id: number
  rows: number
  cols: number
  exit: { row: number; side: ExitSide }
  cars: CarDef[]
  optimalMoves: number
  hintCarId?: string
  hintOnStuck?: string
}

export type PlayablePhase = 'tutorial' | 'playing' | 'win' | 'animating' | 'hintRestart' | 'complete'

export type CarState = CarDef & {
  exited?: boolean
}

export type MoveResult = {
  moved: boolean
  cells: number
  carId: string
}
