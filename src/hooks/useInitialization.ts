import { useCallback, useEffect, useState } from 'react'
import { useSessionsStore, sessionSelector } from '@/storage/sessions.store'
import { createWeb3Wallet, web3wallet } from '@/helpers/walletConnect.util'
import { useErrors } from './useErrors'

export default function useInitialization() {
	const [initialized, setInitialized] = useState(false)
	const { captureError } = useErrors()
	const relayerRegionURL = 'wss://relay.walletconnect.com'
	const addSessions = useSessionsStore(sessionSelector.addSessions)
	const clearSessions = useSessionsStore(sessionSelector.clearSessions)
	const onInitialize = useCallback(async () => {
		clearSessions()
		await createWeb3Wallet(relayerRegionURL)
			.catch((err: Error) => captureError(err))
			.then(() => {
				addSessions(Object.values(web3wallet.getActiveSessions()))
				setInitialized(true)
			})
	}, [relayerRegionURL])

	useEffect(() => {
		if (!initialized) {
			onInitialize()
		}
	}, [initialized, onInitialize, relayerRegionURL])

	return initialized
}
