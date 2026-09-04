import { useEffect, useRef, useState } from 'react'
import { PlayableHud } from '@/ui/components/PlayableHud'
import {
  resolveAssetService,
  resolveBackgroundRenderService,
  resolveCameraBootstrapService,
  resolveGameApplication,
  resolveGameLoop,
  resolvePuzzleFlowService,
  resolveSceneRoot,
} from '@/di/container'
import './App.css'

export default function App() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let cancelled = false
    let onResize: (() => void) | null = null

    const start = async () => {
      try {
        const game = resolveGameApplication()
        const assets = resolveAssetService()
        const scene = resolveSceneRoot()
        const cameraBootstrap = resolveCameraBootstrapService()
        const loop = resolveGameLoop()
        const puzzle = resolvePuzzleFlowService()

        await game.init(host)
        await assets.loadAll()
        scene.mount()
        resolveBackgroundRenderService().mount()
        cameraBootstrap.bootstrap()
        puzzle.start()
        onResize = () => cameraBootstrap.syncViewport()
        window.addEventListener('resize', onResize)
        if (cancelled) return
        loop.start()
        setReady(true)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to start game')
        }
      }
    }

    void start()

    return () => {
      cancelled = true
      if (onResize) window.removeEventListener('resize', onResize)
      resolveGameLoop().stop()
    }
  }, [])

  return (
    <div className="app">
      <div ref={hostRef} id="game-root" className="game-root" />
      {ready && <PlayableHud />}
      {error && <div className="app__error">{error}</div>}
    </div>
  )
}
