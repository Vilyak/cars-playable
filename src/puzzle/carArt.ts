import { Container, Graphics, Sprite, type Texture } from 'pixi.js'
import {
  BOARD_FRAME_OUTSET,
  BOARD_PADDING,
  CAR_SPRITE_PAD,
  CELL_SIZE,
  COLORS,
  DESIGN_WIDTH,
} from '@/puzzle/constants'
import type { CarDef, PuzzleLevel } from '@/puzzle/types'

export function boardPixelSize(rows: number, cols: number): { width: number; height: number } {
  return {
    width: cols * CELL_SIZE,
    height: rows * CELL_SIZE,
  }
}

export function boardOrigin(rows: number, cols: number): { x: number; y: number } {
  const { width } = boardPixelSize(rows, cols)
  return {
    x: (DESIGN_WIDTH - width) / 2,
    y: BOARD_PADDING + 60,
  }
}

export function cellToPixel(
  row: number,
  col: number,
  rows: number,
  cols: number,
): { x: number; y: number } {
  const origin = boardOrigin(rows, cols)
  return {
    x: origin.x + col * CELL_SIZE + CELL_SIZE / 2,
    y: origin.y + row * CELL_SIZE + CELL_SIZE / 2,
  }
}

export function carToPixel(
  car: CarDef,
  rows: number,
  cols: number,
): { x: number; y: number } {
  const origin = boardOrigin(rows, cols)
  if (car.orientation === 'horizontal') {
    return {
      x: origin.x + car.col * CELL_SIZE + (car.length * CELL_SIZE) / 2,
      y: origin.y + car.row * CELL_SIZE + CELL_SIZE / 2,
    }
  }
  return {
    x: origin.x + car.col * CELL_SIZE + CELL_SIZE / 2,
    y: origin.y + car.row * CELL_SIZE + (car.length * CELL_SIZE) / 2,
  }
}

function drawGridOverlay(rows: number, cols: number): Graphics {
  const { width, height } = boardPixelSize(rows, cols)
  const g = new Graphics()

  g.roundRect(0, 0, width, height, 6)
  g.fill({ color: 0x3f4248 })

  g.roundRect(0, 0, width, height, 6)
  g.stroke({ width: 2, color: 0x2a2c30, alpha: 0.9 })

  for (let r = 1; r < rows; r++) {
    const y = r * CELL_SIZE
    for (let x = 8; x < width - 8; x += 12) {
      g.rect(x, y - 1, 7, 2)
      g.fill({ color: 0xffd54f, alpha: 0.9 })
    }
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * CELL_SIZE
      const y = row * CELL_SIZE
      const mark = 11
      const inset = 6
      g.moveTo(x + inset, y + inset + mark)
      g.lineTo(x + inset, y + inset)
      g.lineTo(x + inset + mark, y + inset)
      g.stroke({ width: 2.5, color: 0xffffff, alpha: 0.7 })
    }
  }

  for (let c = 1; c < cols; c++) {
    const x = c * CELL_SIZE
    g.moveTo(x, 6)
    g.lineTo(x, height - 6)
    g.stroke({ width: 1.5, color: 0xffffff, alpha: 0.18 })
  }

  return g
}

export function createParkingBoard(
  level: PuzzleLevel,
  frameTexture: Texture,
  _gridTexture: Texture,
  exitTexture: Texture,
): Container {
  const container = new Container()
  const { rows, cols } = level
  const { width, height } = boardPixelSize(rows, cols)
  const origin = boardOrigin(rows, cols)

  const shadow = new Graphics()
  shadow.roundRect(
    origin.x + 6,
    origin.y + 10,
    width + BOARD_FRAME_OUTSET,
    height + BOARD_FRAME_OUTSET,
    20,
  )
  shadow.fill({ color: 0x000000, alpha: 0.3 })

  const frame = new Sprite(frameTexture)
  frame.anchor.set(0.5)
  frame.x = origin.x + width / 2
  frame.y = origin.y + height / 2
  frame.width = width + BOARD_FRAME_OUTSET
  frame.height = height + BOARD_FRAME_OUTSET

  const overlay = drawGridOverlay(rows, cols)
  overlay.x = origin.x
  overlay.y = origin.y

  container.addChild(shadow, frame, overlay)
  container.addChild(createExitZone(level, exitTexture))
  return container
}

export function createExitZone(level: PuzzleLevel, exitTexture: Texture): Container {
  const container = new Container()
  const { rows, cols, exit } = level
  const origin = boardOrigin(rows, cols)
  const { width } = boardPixelSize(rows, cols)
  const exitY = origin.y + exit.row * CELL_SIZE + CELL_SIZE / 2

  const glow = new Graphics()
  if (exit.side === 'right') {
    glow.roundRect(origin.x + width - 4, exitY - CELL_SIZE / 2 + 6, 40, CELL_SIZE - 12, 6)
    glow.fill({ color: COLORS.exitGlow, alpha: 0.22 })
  } else {
    glow.roundRect(origin.x - 36, exitY - CELL_SIZE / 2 + 6, 40, CELL_SIZE - 12, 6)
    glow.fill({ color: COLORS.exitGlow, alpha: 0.22 })
  }

  const arrow = new Sprite(exitTexture)
  arrow.anchor.set(0.5)
  arrow.width = 48
  arrow.height = 44
  arrow.x = exit.side === 'right' ? origin.x + width + 24 : origin.x - 24
  arrow.y = exitY

  container.addChild(glow, arrow)
  return container
}

export function carPixelSize(car: CarDef): { width: number; height: number } {
  if (car.orientation === 'horizontal') {
    return {
      width: car.length * CELL_SIZE - CAR_SPRITE_PAD,
      height: CELL_SIZE - CAR_SPRITE_PAD,
    }
  }
  return {
    width: CELL_SIZE - CAR_SPRITE_PAD,
    height: car.length * CELL_SIZE - CAR_SPRITE_PAD,
  }
}

export function carRenderDepth(car: CarDef): number {
  const tailRow = car.orientation === 'vertical' ? car.row + car.length - 1 : car.row
  const tailCol = car.orientation === 'horizontal' ? car.col + car.length - 1 : car.col
  return tailRow * 100 + tailCol
}

export function createCarSprite(
  car: CarDef,
  texture: Texture,
  highlighted = false,
  hint = false,
): Container {
  const container = new Container()
  const sprite = new Sprite(texture)
  sprite.anchor.set(0.5)
  const { width, height } = carPixelSize(car)
  sprite.width = width
  sprite.height = height
  sprite.label = 'body'

  if (hint || highlighted) {
    const ring = new Graphics()
    ring.roundRect(-width / 2 - 5, -height / 2 - 5, width + 10, height + 10, 10)
    ring.stroke({
      width: 4,
      color: hint ? COLORS.hint : 0xffffff,
      alpha: 0.95,
    })
    if (hint) {
      ring.roundRect(-width / 2 - 7, -height / 2 - 7, width + 14, height + 14, 12)
      ring.stroke({ width: 2, color: 0xffffff, alpha: 0.35 })
    }
    container.addChild(ring)
  }

  container.addChild(sprite)
  return container
}
