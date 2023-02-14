import { NetworkConfig } from '@/types/types'
import LedgerLivePlarformSDK, { Account } from '@ledgerhq/live-app-sdk'
import { useState, useEffect } from 'react'

export let platformSDK: LedgerLivePlarformSDK
export let accounts: Account[]
export let networks: NetworkConfig[]

export function useLedgerLive(
	ledgerPlatformSDK: LedgerLivePlarformSDK,
	ledgerAccounts: Account[],
	ledgerNetworks: NetworkConfig[],
) {
	const [initialized, setInitialized] = useState(false)

	useEffect(() => {
		if (!initialized) {
			platformSDK = ledgerPlatformSDK
			accounts = ledgerAccounts
			networks = ledgerNetworks
			setInitialized(true)
		}
	}, [initialized])
}
