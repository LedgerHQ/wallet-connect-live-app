import { InputMode, NetworkConfig } from '@/types/types'
import LedgerLivePlarformSDK, { Account } from '@ledgerhq/live-app-sdk'
import { useEffect, useMemo, useState } from 'react'
import { accountSelector, useAccountsStore } from 'src/store/Accounts.store'
import { appSelector, useAppStore } from 'src/store/App.store'
import Home from './Home'
import { useLedgerLive } from './v2/hooks/useLedgerLive'

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

	useEffect(() => {
		clearAppStore()
		clearAccounts()

		addAccounts(accounts)
		addNetworks(networks)
	}, [])

	useLedgerLive(platformSDK)

	// if (uri?.includes('@1?'))
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
