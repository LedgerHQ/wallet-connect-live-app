import { useCallback, useEffect, useState } from 'react'

import { createWeb3Wallet, web3wallet } from '@/helpers/walletConnect.util'
import { sessionSelector, useSessionsStore } from '@/storage/sessions.store'

export default function useInitialization() {
  const [initialized, setInitialized] = useState(false)

  const relayerRegionURL = 'wss://relay.walletconnect.com'
  const addSessions = useSessionsStore(sessionSelector.addSessions)
  const clearSessions = useSessionsStore(sessionSelector.clearSessions)
  const onInitialize = useCallback(async () => {
    try {
      clearSessions()
      await createWeb3Wallet(relayerRegionURL)

      addSessions(Object.values(web3wallet.getActiveSessions()))

      setInitialized(true)
    } catch (err: unknown) {
      console.error(err)
    }
  }, [addSessions, clearSessions])

  useEffect(() => {
    if (!initialized) {
      onInitialize()
    }
  }, [initialized, onInitialize, relayerRegionURL])

  return initialized
}
