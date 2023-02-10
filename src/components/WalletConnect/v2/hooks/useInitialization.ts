import { createWeb3Wallet } from '@/components/WalletConnect/v2/utils/WalletConnectUtil'
import { useCallback, useEffect, useRef, useState } from 'react'

export default function useInitialization() {
  const [initialized, setInitialized] = useState(false)
  const prevRelayerURLValue = useRef<string>('')

  const relayerRegionURL = 'wss://relay.walletconnect.com'

  const onInitialize = useCallback(async () => {
    try {
      prevRelayerURLValue.current = relayerRegionURL

      await createWeb3Wallet(relayerRegionURL)

      setInitialized(true)
    } catch (err: unknown) {
      alert(err)
    }
  }, [relayerRegionURL])

  useEffect(() => {
    if (!initialized) {
      onInitialize()
    }
    if (prevRelayerURLValue.current !== relayerRegionURL) {
      setInitialized(false)
      onInitialize()
    }
  }, [initialized, onInitialize, relayerRegionURL])

  return initialized
}