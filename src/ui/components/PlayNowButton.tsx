import { useDispatch, useSelector } from 'react-redux'
import { openStore } from '@/ui/store/playableSlice'
import type { RootState } from '@/ui/store/store'
import './PlayNowButton.css'

export function PlayNowButton() {
  const show = useSelector((s: RootState) => s.playable.showCTA)
  const finalPopup = useSelector((s: RootState) => s.playable.showFinalPopup)
  const dispatch = useDispatch()

  if (!show || finalPopup) return null

  return (
    <button
      type="button"
      className="play-now"
      onClick={() => dispatch(openStore())}
    >
      Play Now
    </button>
  )
}
