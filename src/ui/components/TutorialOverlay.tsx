import { useSelector } from 'react-redux'
import type { RootState } from '@/ui/store/store'
import './TutorialOverlay.css'

export function TutorialOverlay() {
  const phase = useSelector((s: RootState) => s.playable.phase)
  const level = useSelector((s: RootState) => s.playable.currentLevel)
  const hasMoved = useSelector((s: RootState) => s.playable.hasMoved)

  const visible = level === 1 && !hasMoved && (phase === 'tutorial' || phase === 'playing')

  if (!visible) return null

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-overlay__content">
        <div className="tutorial-overlay__hand" aria-hidden>
          👆
        </div>
        <div className="tutorial-overlay__swipe tutorial-overlay__swipe--horizontal" aria-hidden />
        <p className="tutorial-overlay__text">Сдвинь машину!</p>
      </div>
    </div>
  )
}
