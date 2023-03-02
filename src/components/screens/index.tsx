import { InputMode, NetworkConfig } from '@/types/types'
import LedgerLivePlarformSDK, { Account } from '@ledgerhq/live-app-sdk'
import { useEffect, useState } from 'react'
import { accountSelector, useAccountsStore } from '@/storage/accounts.store'
import { appSelector, useAppStore } from '@/storage/app.store'
import { sessionSelector, useSessionsStore } from '@/storage/sessions.store'
import Home from './Home'
import { useLedgerLive } from '@/hooks/useLedgerLive'
import { useV1Store, v1Selector } from '@/storage/v1.store'

const getInitialAccountV1 = (
	accounts: Account[],
	initialAccountId?: string,
	savedAccountId?: string,
): Account | undefined => {
	const initialAccount = initialAccountId
		? accounts.find((account) => account.id === initialAccountId)
		: undefined
	const savedAccount = savedAccountId
		? accounts.find((account) => account.id === savedAccountId)
		: undefined
	const defaultAccount = accounts.length > 0 ? accounts[0] : undefined

	const selectedAccount = initialAccount || savedAccount || defaultAccount

	return selectedAccount
}

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
	const sessionURI = useV1Store(v1Selector.selectSessionUri)

	const [uri, setUri] = useState<string | undefined>(
		initialURI && initialURI !== sessionURI ? initialURI : sessionURI,
	)

	const addAccounts = useAccountsStore(accountSelector.addAccounts)
	const clearAccounts = useAccountsStore(accountSelector.clearAccounts)
	const addNetworks = useAppStore(appSelector.addNetworks)
	const clearAppStore = useAppStore(appSelector.clearAppStore)
	const setLastSessionVisited = useSessionsStore(
		sessionSelector.setLastSessionVisited,
	)
	const setSelectedAccount = useV1Store(v1Selector.setSelectedAccount)
	const selectedAccount = useV1Store(v1Selector.selectedAccount)

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

		const initialAccount = getInitialAccountV1(
			accounts,
			initialAccountId,
			selectedAccount?.id,
		)

		if (initialAccount) {
			setSelectedAccount(initialAccount)
		}
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
