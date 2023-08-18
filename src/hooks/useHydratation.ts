import { useEffect, useState } from 'react'

import useInitialization from './useInitialization'
import useWalletConnectEventsManager from './useWalletConnectEventsManager'

export default function useHydratation() {
  const [hydrated, setHydrated] = useState(false)
  const initialized = useInitialization()
  useWalletConnectEventsManager(initialized)
  useEffect(() => {
    // This forces a rerender, so the component is rendered
    // the second time but not the first
    setHydrated(true)
  }, [])

  return {
    hydrated,
    initialized,
  }
}
