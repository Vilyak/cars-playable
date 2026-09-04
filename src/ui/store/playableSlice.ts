import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { PlayablePhase } from '@/puzzle/types'

export type PlayableState = {
  phase: PlayablePhase
  currentLevel: number
  showCTA: boolean
  showProgress: boolean
  progressValue: number
  hintText: string | null
  hintCarId: string | null
  moveCount: number
  optimalMoves: number
  hasMoved: boolean
  showFinalPopup: boolean
}

const initialState: PlayableState = {
  phase: 'tutorial',
  currentLevel: 1,
  showCTA: false,
  showProgress: false,
  progressValue: 0,
  hintText: null,
  hintCarId: null,
  moveCount: 0,
  optimalMoves: 1,
  hasMoved: false,
  showFinalPopup: false,
}

export const playableSlice = createSlice({
  name: 'playable',
  initialState,
  reducers: {
    levelLoaded(
      state,
      action: PayloadAction<{
        level: number
        phase: PlayablePhase
        hint: string
        optimalMoves: number
      }>,
    ) {
      state.currentLevel = action.payload.level
      state.phase = action.payload.phase
      state.hintText = null
      state.hintCarId = null
      state.moveCount = 0
      state.optimalMoves = action.payload.optimalMoves
      state.hasMoved = false
      state.showFinalPopup = false
    },
    carMoved(state, action: PayloadAction<{ moveCount: number }>) {
      state.moveCount = action.payload.moveCount
      state.hasMoved = true
      state.hintText = null
    },
    firstSuccess(state) {
      state.showCTA = true
      state.showProgress = true
      state.progressValue = 0
    },
    setProgress(state, action: PayloadAction<number>) {
      state.progressValue = action.payload
    },
    levelWon(state, action: PayloadAction<{ level: number }>) {
      state.phase = 'win'
      state.progressValue = Math.min(100, Math.round((action.payload.level / 3) * 100))
    },
    levelFailed(state, action: PayloadAction<{ hint: string }>) {
      state.phase = 'hintRestart'
      state.hintText = action.payload.hint
    },
    setHint(state, action: PayloadAction<string>) {
      state.hintText = action.payload
    },
    setHintCarId(state, action: PayloadAction<string>) {
      state.hintCarId = action.payload
    },
    dismissHint(state) {
      state.hintText = null
    },
    allLevelsComplete(state) {
      state.showFinalPopup = true
      state.phase = 'complete'
      state.showProgress = true
      state.progressValue = 100
    },
    openStore() {},
  },
})

export const {
  levelLoaded,
  carMoved,
  firstSuccess,
  setProgress,
  levelWon,
  levelFailed,
  setHint,
  setHintCarId,
  dismissHint,
  allLevelsComplete,
  openStore,
} = playableSlice.actions

export const playableReducer = playableSlice.reducer
