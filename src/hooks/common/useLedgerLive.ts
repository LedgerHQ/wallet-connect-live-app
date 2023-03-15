import { WalletAPIClient } from '@ledgerhq/wallet-api-client'
import { useState, useEffect } from 'react'

export let walletApiClient: WalletAPIClient

export function useLedgerLive(walletApiClientParam: WalletAPIClient) {
	const [initialized, setInitialized] = useState(false)

	useEffect(() => {
		if (!initialized) {
			walletApiClient = walletApiClientParam
			setInitialized(true)
		}
	}, [initialized])
}
