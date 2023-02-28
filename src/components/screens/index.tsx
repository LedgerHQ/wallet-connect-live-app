import { InputMode, NetworkConfig } from '@/types/types'
import LedgerLivePlarformSDK, { Account } from '@ledgerhq/live-app-sdk'
import { useEffect, useMemo, useState } from 'react'
import { accountSelector, useAccountsStore } from '@/storage/accounts.store'
import { appSelector, useAppStore } from '@/storage/app.store'
import { sessionSelector, useSessionsStore } from '@/storage/sessions.store'
import Home from './Home'
import { useLedgerLive } from '@/hooks/useLedgerLive'
import useWalletConnectV1Logic from '@/hooks/useWalletConnectV1Logic'

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
	initialMode,
	accounts,
	platformSDK,
	networks,
	initialAccountId,
	...rest
}: WalletConnectProps) {
	const sessionURI = useMemo(() => {
		return localStorage.getItem('sessionURI') ?? undefined
	}, [])
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

	useLedgerLive(platformSDK)
	useWalletConnectV1Logic({
		initialAccountId,
		initialURI,
		platformSDK,
		accounts,
		setUri,
	})

	return (
		<Home
			initialMode={initialMode}
			setUri={setUri}
			platformSDK={platformSDK}
			accounts={accounts}
			initialURI={uri}
			networks={networks}
			{...rest}
		/>
	)
}
