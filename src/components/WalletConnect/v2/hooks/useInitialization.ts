import {
	createWeb3Wallet,
	web3wallet,
} from '@/components/WalletConnect/v2/utils/WalletConnectUtil'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSessionsStore, sessionSelector } from 'src/store/Sessions.store'

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
