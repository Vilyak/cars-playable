import 'reflect-metadata'
import { container } from 'tsyringe'
import { DI_TOKENS } from '@/di/tokens'
import { GameApplication } from '@/game/GameApplication'
import { GameLoop } from '@/game/GameLoop'
import { SceneRoot } from '@/game/SceneRoot'
import { GameCommands } from '@/game/GameCommands'
import { AssetService } from '@/assets/AssetService'
import { createGameWorld, type GameWorld } from '@/ecs/world'
import { SpriteStore } from '@/ecs/SpriteStore'
import { TweenRuntimeStore } from '@/ecs/TweenRuntimeStore'
import { CameraBootstrapService } from '@/services/CameraBootstrapService'
import { CameraCommandService } from '@/services/CameraCommandService'
import { TweenService } from '@/services/TweenService'
import { TweenSystem } from '@/ecs/systems/TweenSystem'
import { CameraSystem } from '@/ecs/systems/CameraSystem'
import { RenderSystem } from '@/ecs/systems/RenderSystem'
import { PuzzleGridService } from '@/services/PuzzleGridService'
import { PuzzleLevelLoaderService } from '@/services/PuzzleLevelLoaderService'
import { PuzzleFlowService } from '@/services/PuzzleFlowService'
import { CarRenderService } from '@/services/CarRenderService'
import { CarInputService } from '@/services/CarInputService'
import { ParticleService } from '@/services/ParticleService'
import { AudioService } from '@/services/AudioService'
import { PuzzleSyncSystem } from '@/ecs/systems/PuzzleSyncSystem'
import { BackgroundRenderService } from '@/services/BackgroundRenderService'
import type { ISystem } from '@/ecs/systems/ISystem'

let bootstrapped = false

export function bootstrapContainer() {
  if (bootstrapped) return container

  container.registerSingleton(DI_TOKENS.GameApplication, GameApplication)
  container.registerSingleton(DI_TOKENS.SceneRoot, SceneRoot)
  container.registerSingleton(DI_TOKENS.AssetService, AssetService)
  container.registerSingleton(DI_TOKENS.SpriteStore, SpriteStore)
  container.registerSingleton(DI_TOKENS.TweenRuntimeStore, TweenRuntimeStore)
  container.registerSingleton(DI_TOKENS.TweenService, TweenService)
  container.registerSingleton(DI_TOKENS.CameraBootstrapService, CameraBootstrapService)
  container.registerSingleton(DI_TOKENS.CameraCommandService, CameraCommandService)
  container.registerSingleton(DI_TOKENS.GameCommands, GameCommands)
  container.registerSingleton(DI_TOKENS.GameLoop, GameLoop)
  container.registerSingleton(DI_TOKENS.TweenSystem, TweenSystem)
  container.registerSingleton(DI_TOKENS.CameraSystem, CameraSystem)
  container.registerSingleton(DI_TOKENS.RenderSystem, RenderSystem)
  container.registerSingleton(DI_TOKENS.PuzzleGridService, PuzzleGridService)
  container.registerSingleton(DI_TOKENS.PuzzleLevelLoaderService, PuzzleLevelLoaderService)
  container.registerSingleton(DI_TOKENS.PuzzleFlowService, PuzzleFlowService)
  container.registerSingleton(DI_TOKENS.CarRenderService, CarRenderService)
  container.registerSingleton(DI_TOKENS.CarInputService, CarInputService)
  container.registerSingleton(DI_TOKENS.ParticleService, ParticleService)
  container.registerSingleton(DI_TOKENS.AudioService, AudioService)
  container.registerSingleton(DI_TOKENS.BackgroundRenderService, BackgroundRenderService)
  container.registerSingleton(DI_TOKENS.PuzzleSyncSystem, PuzzleSyncSystem)

  container.registerInstance(DI_TOKENS.GameWorld, createGameWorld())

  container.register(DI_TOKENS.Systems, {
    useFactory: (c) =>
      [
        c.resolve<PuzzleSyncSystem>(DI_TOKENS.PuzzleSyncSystem),
        c.resolve<TweenSystem>(DI_TOKENS.TweenSystem),
        c.resolve<CameraSystem>(DI_TOKENS.CameraSystem),
        c.resolve<RenderSystem>(DI_TOKENS.RenderSystem),
      ] satisfies ISystem[],
  })

  bootstrapped = true
  return container
}

export function resolveGameApplication(): GameApplication {
  return container.resolve<GameApplication>(DI_TOKENS.GameApplication)
}

export function resolveSceneRoot(): SceneRoot {
  return container.resolve<SceneRoot>(DI_TOKENS.SceneRoot)
}

export function resolveAssetService(): AssetService {
  return container.resolve<AssetService>(DI_TOKENS.AssetService)
}

export function resolveGameLoop(): GameLoop {
  return container.resolve<GameLoop>(DI_TOKENS.GameLoop)
}

export function resolveCameraBootstrapService(): CameraBootstrapService {
  return container.resolve<CameraBootstrapService>(DI_TOKENS.CameraBootstrapService)
}

export function resolveBackgroundRenderService(): BackgroundRenderService {
  return container.resolve<BackgroundRenderService>(DI_TOKENS.BackgroundRenderService)
}

export function resolvePuzzleFlowService(): PuzzleFlowService {
  return container.resolve<PuzzleFlowService>(DI_TOKENS.PuzzleFlowService)
}

export function resolveGameWorld(): GameWorld {
  return container.resolve<GameWorld>(DI_TOKENS.GameWorld)
}
