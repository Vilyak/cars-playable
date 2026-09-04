import { createWorld, type World } from 'bitecs'
import { Position } from '@/ecs/components/Position'
import { Velocity } from '@/ecs/components/Velocity'
import { Camera } from '@/ecs/components/Camera'
import { Tween } from '@/ecs/components/Tween'

export type GameComponents = {
  Position: Position
  Velocity: Velocity
  Camera: Camera
  Tween: Tween
}

export type GameWorldState = {
  components: GameComponents
  time: {
    delta: number
    elapsed: number
  }
}

export type GameWorld = World & GameWorldState

export function createGameWorld(): GameWorld {
  return createWorld({
    components: {
      Position: new Position(),
      Velocity: new Velocity(),
      Camera: new Camera(),
      Tween: new Tween(),
    },
    time: {
      delta: 0,
      elapsed: 0,
    },
  }) as GameWorld
}
