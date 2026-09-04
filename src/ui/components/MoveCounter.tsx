import { useSelector } from 'react-redux'
import type { RootState } from '@/ui/store/store'
import './MoveCounter.css'

export function MoveCounter() {
  const moves = useSelector((s: RootState) => s.playable.moveCount)
  const optimal = useSelector((s: RootState) => s.playable.optimalMoves)
  const hasMoved = useSelector((s: RootState) => s.playable.hasMoved)

  if (!hasMoved && moves === 0) return null

  const stars = moves <= optimal ? ' ★' : ''

  return (
    <div className="move-counter">
      Ходы: {moves}
      {stars}
    </div>
  )
}
