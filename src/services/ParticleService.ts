import { inject, injectable } from 'tsyringe'
import gsap from 'gsap'
import { Container, Graphics } from 'pixi.js'
import { DI_TOKENS } from '@/di/tokens'
import { SceneRoot } from '@/game/SceneRoot'

@injectable()
export class ParticleService {
  private readonly container = new Container()

  constructor(@inject(DI_TOKENS.SceneRoot) scene: SceneRoot) {
    this.container.zIndex = 30
    scene.root.addChild(this.container)
  }

  confetti(x: number, y: number, count = 24): void {
    const colors = [0xff4444, 0xffd166, 0x44cc66, 0x4488ff, 0xff8844]
    for (let i = 0; i < count; i++) {
      const spark = new Graphics()
      spark.rect(-5, -5, 10, 10)
      spark.fill(colors[i % colors.length]!)
      spark.x = x
      spark.y = y
      spark.rotation = Math.random() * Math.PI
      this.container.addChild(spark)
      const angle = (Math.PI * 2 * i) / count + Math.random()
      const dist = 80 + Math.random() * 120
      gsap.to(spark, {
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist + 60,
        alpha: 0,
        rotation: spark.rotation + Math.PI * 2,
        duration: 0.7 + Math.random() * 0.4,
        ease: 'power2.out',
        onComplete: () => spark.destroy(),
      })
    }
  }
}
