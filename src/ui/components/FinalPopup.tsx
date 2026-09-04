import { useDispatch, useSelector } from 'react-redux'
import { openStore } from '@/ui/store/playableSlice'
import type { RootState } from '@/ui/store/store'
import './FinalPopup.css'

export function FinalPopup() {
  const show = useSelector((s: RootState) => s.playable.showFinalPopup)
  const dispatch = useDispatch()

  if (!show) return null

  return (
    <div className="final-popup" role="dialog" aria-modal="true" aria-label="Уровни пройдены">
      <div className="final-popup__backdrop" />
      <div className="final-popup__card">
        <div className="final-popup__title">Отлично!</div>
        <div className="final-popup__subtitle">Все уровни пройдены</div>
        <div className="final-popup__stars" aria-label="3 звезды">
          <span className="final-popup__star final-popup__star--1">★</span>
          <span className="final-popup__star final-popup__star--2">★</span>
          <span className="final-popup__star final-popup__star--3">★</span>
        </div>
        <button
          type="button"
          className="final-popup__cta"
          onClick={() => dispatch(openStore())}
        >
          Скачать в Play Market
        </button>
      </div>
    </div>
  )
}
