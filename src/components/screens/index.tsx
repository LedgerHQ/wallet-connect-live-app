import { InputMode, NetworkConfig } from '@/types/types'
import {
	Account,
	WalletAPIClient,
	WalletInfo,
} from '@ledgerhq/wallet-api-client'
import { useEffect, useState } from 'react'
import { accountSelector, useAccountsStore } from '@/storage/accounts.store'
import { appSelector, useAppStore } from '@/storage/app.store'
import { sessionSelector, useSessionsStore } from '@/storage/sessions.store'
import Home from './Home'
import { useLedgerLive } from '@/hooks/common/useLedgerLive'
import useAnalytics from 'src/shared/useAnalytics'

export type WalletConnectProps = {
	initialMode?: InputMode
	initialAccountId?: string
	initialURI?: string
	networks: NetworkConfig[]
	walletApiClient: WalletAPIClient
	accounts: Account[]
	userId: string
	walletInfo: WalletInfo['result']
}

export default function WalletConnect({
	initialURI,
	initialAccountId,
	initialMode,
	accounts,
	walletApiClient,
	networks,
	userId,
	walletInfo,
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
	const analytics = useAnalytics()
	useLedgerLive(walletApiClient)

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
	}, [walletApiClient])

	useEffect(() => {
		clearAccounts()
		addAccounts(accounts)
	}, [accounts])

	useEffect(() => {
		analytics.start(userId, walletInfo)
	}, [])

	return (
		<Home
			initialMode={initialMode}
			setUri={setUri}
			walletApiClient={walletApiClient}
			accounts={accounts}
			initialURI={uri}
			networks={networks}
			initialAccountId={initialAccountId}
			{...rest}
		/>
	)
}
