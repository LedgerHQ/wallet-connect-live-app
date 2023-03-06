import { InputMode, NetworkConfig } from '@/types/types'
import LedgerLivePlarformSDK, { Account } from '@ledgerhq/live-app-sdk'
import { useEffect, useState } from 'react'
import { accountSelector, useAccountsStore } from '@/storage/accounts.store'
import { appSelector, useAppStore } from '@/storage/app.store'
import { sessionSelector, useSessionsStore } from '@/storage/sessions.store'
import Home from './Home'
import { useLedgerLive } from '@/hooks/common/useLedgerLive'

export type WalletConnectProps = {
	initialMode?: InputMode
	initialAccountId?: string
	initialURI?: string
	networks: NetworkConfig[]
	platformSDK: LedgerLivePlarformSDK
	accounts: Account[]
}

export default function WalletConnect({
	initialURI,
	initialAccountId,
	initialMode,
	accounts,
	platformSDK,
	networks,
	...rest
}: WalletConnectProps) {
	const [uri, setUri] = useState<string | undefined>(initialURI)

	const addAccounts = useAccountsStore(accountSelector.addAccounts)
	const clearAccounts = useAccountsStore(accountSelector.clearAccounts)
	const addNetworks = useAppStore(appSelector.addNetworks)
	const clearAppStore = useAppStore(appSelector.clearAppStore)
	const setLastSessionVisited = useSessionsStore(
		sessionSelector.setLastSessionVisited,
	)

	useEffect(() => {
		clearAppStore()
		clearAccounts()
		setLastSessionVisited(null)
		if (accounts.length > 0) {
			addAccounts(accounts)
		}
		if (networks.length > 0) {
			addNetworks(networks)
		}
	}, [platformSDK])

	useEffect(() => {
		clearAccounts()
		addAccounts(accounts)
	}, [accounts])

	useLedgerLive(platformSDK)

	return (
		<Home
			initialMode={initialMode}
			setUri={setUri}
			platformSDK={platformSDK}
			accounts={accounts}
			initialURI={uri}
			networks={networks}
			initialAccountId={initialAccountId}
			{...rest}
		/>
	)
}
