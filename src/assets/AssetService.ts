import { injectable } from 'tsyringe'
import { Assets, Spritesheet, Texture } from 'pixi.js'
import { type AtlasName } from '@/assets/generated/Atlases'
import { Textures, type TextureAtlas as GeneratedTextureAtlas } from '@/assets/generated/Textures'
import { embeddedAtlases, embeddedTextures } from '@/assets/generated/embeddedAssets'

@injectable()
export class AssetService {
  private loaded = false

  async loadAll(): Promise<void> {
    if (this.loaded) return

    await Assets.init({})

    for (const [alias, src] of Object.entries(embeddedTextures)) {
      Assets.add({ alias, src })
    }
    const textureAliases = Object.keys(embeddedTextures)
    if (textureAliases.length > 0) {
      await Assets.load(textureAliases)
    }

    for (const [alias, pack] of Object.entries(embeddedAtlases)) {
      const texture = (await Assets.load(pack.image)) as Texture
      const sheet = new Spritesheet(texture, pack.json as never)
      await sheet.parse()
      Assets.cache.set(alias, sheet)
    }

    this.loaded = true
  }

  getTexture(atlas: AtlasName | GeneratedTextureAtlas, frame: string): Texture {
    const sheet = Assets.get<Spritesheet>(atlas)
    if (!(sheet instanceof Spritesheet) || !sheet.textures[frame]) {
      throw new Error(`Texture not found: ${atlas}/${frame}`)
    }
    return sheet.textures[frame]
  }

  getGeneratedTexture<A extends GeneratedTextureAtlas>(
    atlas: A,
    frame: keyof (typeof Textures)[A] & string,
  ): Texture {
    const frameName = Textures[atlas][frame] as string
    return this.getTexture(atlas, frameName)
  }

  getStandalone(alias: string): Texture {
    const texture = Assets.get<Texture>(alias)
    if (!texture) {
      throw new Error(`Standalone texture not found: ${alias}`)
    }
    return texture
  }
}
