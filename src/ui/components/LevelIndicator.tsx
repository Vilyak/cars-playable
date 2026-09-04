import { useSelector } from 'react-redux'
import type { RootState } from '@/ui/store/store'
import './LevelIndicator.css'

export function LevelIndicator() {
  const current = useSelector((s: RootState) => s.playable.currentLevel)

  return (
    <div className="level-indicator">
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`level-indicator__dot${n === current ? ' level-indicator__dot--active' : ''}${n < current ? ' level-indicator__dot--done' : ''}`}
        />
      ))}
    </div>
  )
}
