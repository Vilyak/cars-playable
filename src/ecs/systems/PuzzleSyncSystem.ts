import { inject, injectable } from 'tsyringe'
import { DI_TOKENS } from '@/di/tokens'
import type { ISystem } from '@/ecs/systems/ISystem'
import { PuzzleFlowService } from '@/services/PuzzleFlowService'

@injectable()
export class PuzzleSyncSystem implements ISystem {
  constructor(
    @inject(DI_TOKENS.PuzzleFlowService) private readonly flow: PuzzleFlowService,
  ) {}

  update(dt: number): void {
    this.flow.update(dt)
  }
}
