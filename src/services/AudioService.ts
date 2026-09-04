import { injectable } from 'tsyringe'
import { Howl } from 'howler'
import { inject } from 'tsyringe'
import { DI_TOKENS } from '@/di/tokens'
import { CarInputService } from '@/services/CarInputService'

function synthTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15,
): string {
  const sampleRate = 22050
  const samples = Math.floor(sampleRate * duration)
  const buffer = new ArrayBuffer(44 + samples * 2)
  const view = new DataView(buffer)

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + samples * 2, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, samples * 2, true)

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate
    const env = Math.min(1, i / (sampleRate * 0.01)) * Math.max(0, 1 - t / duration)
    let sample = 0
    if (type === 'sine') sample = Math.sin(2 * Math.PI * frequency * t)
    else if (type === 'square') sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1
    else sample = (Math.random() * 2 - 1) * 0.5
    const val = Math.max(-1, Math.min(1, sample * env * volume))
    view.setInt16(44 + i * 2, val * 0x7fff, true)
  }

  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return `data:audio/wav;base64,${btoa(binary)}`
}

@injectable()
export class AudioService {
  private initialized = false
  private sounds: Record<string, Howl> = {}
  private ambient: Howl | null = null

  constructor(@inject(DI_TOKENS.CarInputService) input: CarInputService) {
    input.onFirstPointer = () => this.init()
  }

  init(): void {
    if (this.initialized) return
    this.initialized = true
    this.sounds = {
      slide: new Howl({ src: [synthTone(180, 0.08, 'square', 0.12)], volume: 0.5 }),
      win: new Howl({ src: [synthTone(520, 0.35, 'sine', 0.18)], volume: 0.7 }),
    }
    this.ambient = new Howl({
      src: [synthTone(80, 2.5, 'sine', 0.04)],
      volume: 0.15,
      loop: true,
    })
    this.ambient.play()
  }

  play(name: 'slide' | 'win'): void {
    if (!this.initialized) this.init()
    this.sounds[name]?.play()
  }
}
