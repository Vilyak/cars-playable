import { createListenerMiddleware } from '@reduxjs/toolkit'
import { openStore } from '@/ui/store/playableSlice'
import { PLAY_STORE_URL } from '@/puzzle/constants'

export const listenerMiddleware = createListenerMiddleware()

listenerMiddleware.startListening({
  actionCreator: openStore,
  effect: () => {
    window.open(PLAY_STORE_URL, '_blank')
  },
})
