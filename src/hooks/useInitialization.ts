import { useSessionsStore, sessionSelector } from '@/store/Sessions.store'
import { useState, useRef, useCallback, useEffect } from 'react'
import { createWeb3Wallet, web3wallet } from '@/helpers/walletConnect.util'

export default function useInitialization() {
	const [initialized, setInitialized] = useState(false)
	const prevRelayerURLValue = useRef<string>('')

	const relayerRegionURL = 'wss://relay.walletconnect.com'
	const addSessions = useSessionsStore(sessionSelector.addSessions)
	const clearSessions = useSessionsStore(sessionSelector.clearSessions)
	const onInitialize = useCallback(async () => {
		try {
			prevRelayerURLValue.current = relayerRegionURL
			clearSessions()
			await createWeb3Wallet(relayerRegionURL)

			addSessions(Object.values(web3wallet.getActiveSessions()))

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
