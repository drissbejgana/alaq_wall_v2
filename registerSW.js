import { registerSW } from 'virtual:pwa-register'

export const updateSW = registerSW({
  onNeedRefresh() {
    console.log('New content available')
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})