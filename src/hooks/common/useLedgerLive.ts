import LedgerLivePlarformSDK from '@ledgerhq/live-app-sdk'
import { useState, useEffect } from 'react'

export let platformSDK: LedgerLivePlarformSDK

export function useLedgerLive(ledgerPlatformSDK: LedgerLivePlarformSDK) {
	const [initialized, setInitialized] = useState(false)

	useEffect(() => {
		if (!initialized) {
			platformSDK = ledgerPlatformSDK
			setInitialized(true)
		}
	}, [initialized])
}
