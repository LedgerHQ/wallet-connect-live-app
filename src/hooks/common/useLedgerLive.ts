import { WalletAPIClient } from '@ledgerhq/wallet-api-client'
import { useState, useEffect } from 'react'

export let walletApiClient: WalletAPIClient

export function useLedgerLive(walletApiClient: WalletAPIClient) {
	const [initialized, setInitialized] = useState(false)

	useEffect(() => {
		if (!initialized) {
			walletApiClient = walletApiClient
			setInitialized(true)
		}
	}, [initialized])
}
