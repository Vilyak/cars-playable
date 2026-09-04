export type SpineAssetEntry = {
  skeleton: string
  atlas: string
  scale: number
  defaultAnimation?: string
}

export const SpineAssetConfig: Record<string, SpineAssetEntry> = {}

export type SpineSkeletonId = string

export function spineSkeletonAlias(id: SpineSkeletonId): string {
  return `spine-skeleton-${id}`
}

export function spineAtlasAlias(id: SpineSkeletonId): string {
  return `spine-atlas-${id}`
}
