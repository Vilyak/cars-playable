import { TutorialOverlay } from '@/ui/components/TutorialOverlay'
import { ProgressBar } from '@/ui/components/ProgressBar'
import { PlayNowButton } from '@/ui/components/PlayNowButton'
import { HintToast } from '@/ui/components/HintToast'
import { LevelIndicator } from '@/ui/components/LevelIndicator'
import { MoveCounter } from '@/ui/components/MoveCounter'
import { FinalPopup } from '@/ui/components/FinalPopup'
import './PlayableHud.css'

export function PlayableHud() {
  return (
    <div className="playable-hud">
      <div className="playable-hud__title">Пробка: Выпусти машину</div>
      <LevelIndicator />
      <MoveCounter />
      <TutorialOverlay />
      <HintToast />
      <ProgressBar />
      <PlayNowButton />
      <FinalPopup />
    </div>
  )
}
