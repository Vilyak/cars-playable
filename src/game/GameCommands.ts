import { injectable } from 'tsyringe'

@injectable()
export class GameCommands {
  flush(): void {
    // Playable uses direct service calls; queue reserved for future use.
  }
}
