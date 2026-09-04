import { useSelector } from 'react-redux'
import type { RootState } from '@/ui/store/store'
import './HintToast.css'

export function HintToast() {
  const hint = useSelector((s: RootState) => s.playable.hintText)

  if (!hint) return null

  return (
    <div className="hint-toast">
      <p>{hint}</p>
    </div>
  )
}
