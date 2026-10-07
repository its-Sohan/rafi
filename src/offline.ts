export type OfflineStatus = 'ready' | 'preparing' | 'unavailable' | 'development'

function report(status: OfflineStatus) {
  document.documentElement.dataset.offline = status
  window.dispatchEvent(new Event('hisab-offline-status'))
}

export function initializeOffline() {
  if (!import.meta.env.PROD) { report('development'); return }
  if (!('serviceWorker' in navigator)) { report('unavailable'); return }
  report('preparing')
  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      const worker = registration.installing
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'redundant' && !registration.active) report('unavailable')
      })
      await navigator.serviceWorker.ready
      const update = () => report(navigator.serviceWorker.controller ? 'ready' : 'preparing')
      navigator.serviceWorker.addEventListener('controllerchange', update)
      update()
    } catch (error) {
      report('unavailable')
      console.error('Offline cache could not be initialized', error)
    }
  }
  if (document.readyState === 'complete') void register()
  else window.addEventListener('load', register, { once: true })
}
