import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const SOURCE_DIRS = [
  path.join(root, 'assets'),
  path.join(
    process.env.USERPROFILE ?? '',
    '.cursor',
    'projects',
    'd-Workspace-penguin-playable',
    'assets',
  ),
]

const RAW_GAME = path.join(root, 'raw_assets', 'game')
const PUBLIC_GAME = path.join(root, 'public', 'assets', 'game')

const CELL = 76
const CAR_PAD = 6

type CarOrientation = 'horizontal' | 'vertical'

function findSource(name: string): string {
  for (const dir of SOURCE_DIRS) {
    const full = path.join(dir, name)
    if (fs.existsSync(full)) return full
  }
  throw new Error(`Missing source asset: ${name}`)
}

function isBackgroundPixel(r: number, g: number, b: number, keyBlack: boolean): boolean {
  if (keyBlack && r < 45 && g < 45 && b < 45) return true
  if (r > 150 && b > 150 && g < 130) return true
  if (r > 200 && b > 120 && g < 90) return true
  const magentaScore = Math.abs(r - 255) + Math.abs(g - 0) + Math.abs(b - 255)
  const pinkScore = Math.abs(r - 255) + Math.abs(g - 80) + Math.abs(b - 255)
  return magentaScore < 120 || pinkScore < 140
}

async function removeBackground(input: Buffer, keyBlack = false): Promise<Buffer> {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const w = info.width
  const h = info.height

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      if (isBackgroundPixel(r, g, b, keyBlack)) {
        data[i + 3] = 0
        continue
      }

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
          const ni = (ny * w + nx) * 4
          if (isBackgroundPixel(data[ni], data[ni + 1], data[ni + 2], keyBlack) && data[i + 3] > 0) {
            const fringe = Math.abs(r - data[ni]) + Math.abs(g - data[ni + 1]) + Math.abs(b - data[ni + 2])
            if (fringe < 120) data[i + 3] = 0
          }
        }
      }
    }
  }

  return sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer()
}

async function trimAndResize(
  input: Buffer,
  width: number,
  height: number,
  orientation: CarOrientation,
  keyBlack = false,
): Promise<Buffer> {
  const keyed = await removeBackground(input, keyBlack)
  let buf = await sharp(keyed).trim({ threshold: 8 }).png().toBuffer()
  const meta = await sharp(buf).metadata()
  const isWide = (meta.width ?? 0) > (meta.height ?? 0)

  if (orientation === 'vertical' && isWide) {
    buf = await sharp(buf).rotate(90).png().toBuffer()
  } else if (orientation === 'horizontal' && !isWide) {
    buf = await sharp(buf).rotate(90).png().toBuffer()
  }

  return sharp(buf)
    .resize(width, height, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize(width, height, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()
}

async function main() {
  fs.mkdirSync(RAW_GAME, { recursive: true })
  fs.mkdirSync(PUBLIC_GAME, { recursive: true })

  const bgSrc = findSource('bg_parking.png')
  const boardSrc = findSource('parking_board.png')

  await sharp(bgSrc)
    .resize(720, 960, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(path.join(PUBLIC_GAME, 'bg.png'))

  await sharp(boardSrc)
    .resize(CELL * 6 + 100, CELL * 6 + 100, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(path.join(PUBLIC_GAME, 'board_frame.png'))

  await sharp(boardSrc)
    .extract({ left: 95, top: 23, width: 860, height: 972 })
    .resize(CELL * 6, CELL * 6, { fit: 'fill' })
    .png()
    .toFile(path.join(PUBLIC_GAME, 'board_grid.png'))

  const carJobs: Array<{
    src: string
    out: string
    w: number
    h: number
    orientation: CarOrientation
  }> = [
    {
      src: 'car_red_h2.png',
      out: 'car_red_h2.png',
      w: CELL * 2 - CAR_PAD,
      h: CELL - CAR_PAD,
      orientation: 'horizontal',
    },
    {
      src: 'car_blue_v2.png',
      out: 'car_blue_v2.png',
      w: CELL - CAR_PAD,
      h: CELL * 2 - CAR_PAD,
      orientation: 'vertical',
    },
    {
      src: 'car_yellow_h2.png',
      out: 'car_yellow_h2.png',
      w: CELL * 2 - CAR_PAD,
      h: CELL - CAR_PAD,
      orientation: 'horizontal',
    },
    {
      src: 'car_purple_h3.png',
      out: 'car_purple_h3.png',
      w: CELL * 3 - CAR_PAD,
      h: CELL - CAR_PAD,
      orientation: 'horizontal',
    },
    {
      src: 'car_purple_h3.png',
      out: 'car_purple_h2.png',
      w: CELL * 2 - CAR_PAD,
      h: CELL - CAR_PAD,
      orientation: 'horizontal',
    },
    {
      src: 'car_orange_v2.png',
      out: 'car_orange_v2.png',
      w: CELL - CAR_PAD,
      h: CELL * 2 - CAR_PAD,
      orientation: 'vertical',
    },
    {
      src: 'car_cyan_h3.png',
      out: 'car_cyan_h3.png',
      w: CELL * 3 - CAR_PAD,
      h: CELL - CAR_PAD,
      orientation: 'horizontal',
    },
    {
      src: 'car_green_h2.png',
      out: 'car_green_v2.png',
      w: CELL - CAR_PAD,
      h: CELL * 2 - CAR_PAD,
      orientation: 'vertical',
    },
  ]

  for (const job of carJobs) {
    const src = findSource(job.src)
    const buf = await trimAndResize(fs.readFileSync(src), job.w, job.h, job.orientation)
    fs.writeFileSync(path.join(RAW_GAME, job.out), buf)
  }

  const exitSrc = findSource('exit_arrow.png')
  const exitBuf = await trimAndResize(fs.readFileSync(exitSrc), 52, 48, 'horizontal', true)
  fs.writeFileSync(path.join(RAW_GAME, 'exit_arrow.png'), exitBuf)

  console.log('Processed game assets into raw_assets/game and public/assets/game')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
