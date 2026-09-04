import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/ui/store/store'
import { setProgress } from '@/ui/store/playableSlice'
import { PROGRESS_BAR_DURATION_MS } from '@/puzzle/constants'
import './ProgressBar.css'

export function ProgressBar() {
  const show = useSelector((s: RootState) => s.playable.showProgress)
  const value = useSelector((s: RootState) => s.playable.progressValue)
  const currentLevel = useSelector((s: RootState) => s.playable.currentLevel)
  const dispatch = useDispatch()
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    if (!show) {
      setAnimated(false)
      return
    }
    if (animated) return
    setAnimated(true)
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / PROGRESS_BAR_DURATION_MS)
      dispatch(setProgress(Math.round(t * 33)))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [show, animated, dispatch])

  useEffect(() => {
    if (!show) return
    const target = Math.min(100, Math.round((currentLevel / 3) * 100))
    dispatch(setProgress(target))
  }, [currentLevel, show, dispatch])

  if (!show) return null

  return (
    <div className="progress-bar">
      <div className="progress-bar__track">
        <div className="progress-bar__fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
