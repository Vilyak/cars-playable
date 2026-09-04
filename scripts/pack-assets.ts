import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { packAsync } from 'free-tex-packer-core'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const rawRoot = path.join(root, 'raw_assets')
const outRoot = path.join(root, 'public', 'assets')
const generatedRoot = path.join(root, 'src', 'assets', 'generated')

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp'])
const MAX_TEXTURE_SIZE = 256

function toFrameKey(relativePath: string): string {
  const withoutExt = relativePath.replace(/\.[^.]+$/, '')
  return withoutExt.split(/[\\/]/).join('_')
}

function toPropName(frameKey: string): string {
  const parts = frameKey.split('_')
  return parts
    .map((part, index) => {
      const cleaned = part.replace(/[^a-zA-Z0-9]/g, '')
      if (!cleaned) return 'frame'
      if (index === 0) {
        return /^[0-9]/.test(cleaned) ? `f${cleaned}` : cleaned
      }
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
    })
    .join('')
}

function collectImages(dir: string, base = ''): Array<{ path: string; contents: Buffer; frameKey: string }> {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const images: Array<{ path: string; contents: Buffer; frameKey: string }> = []

  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      images.push(...collectImages(full, rel))
      continue
    }
    if (!IMAGE_EXT.has(path.extname(entry.name).toLowerCase())) continue
    const frameKey = toFrameKey(rel)
    images.push({
      path: `${frameKey}${path.extname(entry.name)}`,
      contents: fs.readFileSync(full),
      frameKey,
    })
  }

  return images
}

async function resizeForAtlas(
  images: Array<{ path: string; contents: Buffer; frameKey: string }>,
  maxSize = MAX_TEXTURE_SIZE,
): Promise<Array<{ path: string; contents: Buffer; frameKey: string }>> {
  const resized: Array<{ path: string; contents: Buffer; frameKey: string }> = []
  for (const image of images) {
    const buffer = await sharp(image.contents)
      .resize({
        width: maxSize,
        height: maxSize,
        fit: 'inside',
        withoutEnlargement: false,
      })
      .png()
      .toBuffer()
    resized.push({ ...image, contents: buffer })
  }
  return resized
}

function writeGenerated(atlases: Record<string, Record<string, string>>) {
  fs.mkdirSync(generatedRoot, { recursive: true })

  const atlasLines = Object.keys(atlases)
    .sort()
    .map((name) => `  ${name}: "/assets/${name}.json",`)
    .join('\n')

  const texturesBlocks = Object.entries(atlases)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([atlas, frames]) => {
      const frameLines = Object.entries(frames)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([prop, frame]) => `    ${prop}: "${frame}",`)
        .join('\n')
      return `  ${atlas}: {\n${frameLines}\n  },`
    })
    .join('\n')

  fs.writeFileSync(
    path.join(generatedRoot, 'Atlases.ts'),
    `export const Atlases = {\n${atlasLines}\n} as const\n\nexport type AtlasName = keyof typeof Atlases\n`,
    'utf8',
  )

  fs.writeFileSync(
    path.join(generatedRoot, 'Textures.ts'),
    `export const Textures = {\n${texturesBlocks}\n} as const\n\nexport type TextureAtlas = keyof typeof Textures\n`,
    'utf8',
  )

  fs.writeFileSync(
    path.join(generatedRoot, 'index.ts'),
    `export { Atlases } from './Atlases'\nexport type { AtlasName } from './Atlases'\nexport { Textures } from './Textures'\nexport type { TextureAtlas } from './Textures'\n`,
    'utf8',
  )
}

async function packAtlas(atlasName: string, atlasDir: string) {
  const rawImages = collectImages(atlasDir)
  if (rawImages.length === 0) {
    return null
  }

  const images =
    atlasName === 'game' ? rawImages : await resizeForAtlas(rawImages, MAX_TEXTURE_SIZE)

  const files = await packAsync(
    images.map(({ path: imagePath, contents }) => ({ path: imagePath, contents })),
    {
      textureName: atlasName,
      width: 2048,
      height: 2048,
      fixedSize: false,
      padding: 2,
      allowRotation: false,
      detectIdentical: false,
      allowTrim: atlasName !== 'game',
      exporter: 'Pixi',
      removeFileExtension: true,
      prependFolderName: false,
    } as Parameters<typeof packAsync>[1],
  )

  for (const file of files) {
    fs.writeFileSync(path.join(outRoot, file.name), file.buffer)
  }

  const frames: Record<string, string> = {}
  for (const image of images) {
    frames[toPropName(image.frameKey)] = image.frameKey
  }

  return frames
}

function mimeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.json') return 'application/json'
  return 'application/octet-stream'
}

function toDataUri(filePath: string): string {
  const buffer = fs.readFileSync(filePath)
  const mime = mimeFor(filePath)
  if (mime === 'application/json') {
    return `data:${mime};charset=utf-8,${encodeURIComponent(buffer.toString('utf8'))}`
  }
  return `data:${mime};base64,${buffer.toString('base64')}`
}

function writeEmbeddedAssets(atlases: Record<string, Record<string, string>>) {
  const atlasEntries: string[] = []
  for (const atlasName of Object.keys(atlases).sort()) {
    // Skip unused demo atlas to keep single HTML smaller
    if (atlasName === 'demo') continue
    const jsonPath = path.join(outRoot, `${atlasName}.json`)
    const pngPath = path.join(outRoot, `${atlasName}.png`)
    if (!fs.existsSync(jsonPath) || !fs.existsSync(pngPath)) continue
    const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as object
    const image = toDataUri(pngPath)
    atlasEntries.push(
      `  ${JSON.stringify(atlasName)}: {\n    json: ${JSON.stringify(json)} as object,\n    image: ${JSON.stringify(image)},\n  },`,
    )
  }

  const textureEntries: string[] = []
  const gameDir = path.join(outRoot, 'game')
  if (fs.existsSync(gameDir)) {
    for (const name of fs.readdirSync(gameDir).sort()) {
      if (!/\.(png|jpg|jpeg|webp)$/i.test(name)) continue
      // board.png is unused (grid is procedural); skip to reduce size
      if (name === 'board.png') continue
      const alias = `game/${name.replace(/\.[^.]+$/, '')}`
      const dataUri = toDataUri(path.join(gameDir, name))
      textureEntries.push(`  ${JSON.stringify(alias)}: ${JSON.stringify(dataUri)},`)
    }
  }

  const content = `/* Auto-generated by scripts/pack-assets.ts — do not edit */
export const embeddedAtlases = {
${atlasEntries.join('\n')}
} as const

export const embeddedTextures = {
${textureEntries.join('\n')}
} as const
`
  fs.writeFileSync(path.join(generatedRoot, 'embeddedAssets.ts'), content, 'utf8')

  const indexPath = path.join(generatedRoot, 'index.ts')
  fs.writeFileSync(
    indexPath,
    `export { Atlases } from './Atlases'\nexport type { AtlasName } from './Atlases'\nexport { Textures } from './Textures'\nexport type { TextureAtlas } from './Textures'\nexport { embeddedAtlases, embeddedTextures } from './embeddedAssets'\n`,
    'utf8',
  )
}

async function main() {
  fs.mkdirSync(outRoot, { recursive: true })
  const preservedGameDir = path.join(outRoot, 'game')
  const preservedGameFiles: Array<{ name: string; contents: Buffer }> = []
  if (fs.existsSync(preservedGameDir)) {
    for (const name of fs.readdirSync(preservedGameDir)) {
      const full = path.join(preservedGameDir, name)
      if (fs.statSync(full).isFile()) {
        preservedGameFiles.push({ name, contents: fs.readFileSync(full) })
      }
    }
  }

  fs.rmSync(outRoot, { recursive: true, force: true })
  fs.mkdirSync(outRoot, { recursive: true })

  if (preservedGameFiles.length > 0) {
    fs.mkdirSync(preservedGameDir, { recursive: true })
    for (const file of preservedGameFiles) {
      fs.writeFileSync(path.join(preservedGameDir, file.name), file.contents)
    }
  }

  if (!fs.existsSync(rawRoot)) {
    fs.mkdirSync(rawRoot, { recursive: true })
  }

  const atlasDirs = fs
    .readdirSync(rawRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())

  const atlases: Record<string, Record<string, string>> = {}
  const manifestBundles: Array<{
    name: string
    assets: Array<string | { alias: string; src: string }>
  }> = []

  for (const dir of atlasDirs) {
    const frames = await packAtlas(dir.name, path.join(rawRoot, dir.name))
    if (!frames) continue
    atlases[dir.name] = frames
    manifestBundles.push({
      name: dir.name,
      assets: [
        {
          alias: dir.name,
          src: `/assets/${dir.name}.json`,
        },
      ],
    })
  }

  const manifest = {
    bundles: manifestBundles,
  }

  fs.writeFileSync(path.join(outRoot, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')
  writeGenerated(atlases)

  const gameStaticDir = path.join(outRoot, 'game')
  if (fs.existsSync(gameStaticDir)) {
    manifestBundles.push({
      name: 'game-static',
      assets: fs
        .readdirSync(gameStaticDir)
        .filter((name) => /\.(png|jpg|webp)$/i.test(name))
        .map((name) => ({
          alias: `game/${name.replace(/\.[^.]+$/, '')}`,
          src: `/assets/game/${name}`,
        })),
    })
    fs.writeFileSync(
      path.join(outRoot, 'manifest.json'),
      JSON.stringify({ bundles: manifestBundles }, null, 2),
      'utf8',
    )
  }

  writeEmbeddedAssets(atlases)
  console.log(`Packed ${Object.keys(atlases).length} atlas(es)`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
