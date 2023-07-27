import { InputMode } from '@/types/types'
import { Account, WalletInfo } from '@ledgerhq/wallet-api-client'
import { useEffect, useState } from 'react'
import { accountSelector, useAccountsStore } from '@/storage/accounts.store'
import { sessionSelector, useSessionsStore } from '@/storage/sessions.store'
import Home from './Home'
import useAnalytics from 'src/shared/useAnalytics'

export type WalletConnectProps = {
	initialMode?: InputMode
	initialAccountId?: string
	initialURI?: string
	accounts: Account[]
	userId: string
	walletInfo: WalletInfo['result']
}

export default function WalletConnect({
	initialURI,
	initialAccountId,
	initialMode,
	accounts,
	userId,
	walletInfo,

	...rest
}: WalletConnectProps) {
	const [uri, setUri] = useState<string | undefined>(initialURI)

	const addAccounts = useAccountsStore(accountSelector.addAccounts)
	const clearAccounts = useAccountsStore(accountSelector.clearAccounts)
	const setLastSessionVisited = useSessionsStore(
		sessionSelector.setLastSessionVisited,
	)
	const analytics = useAnalytics()

	useEffect(() => {
		clearAccounts()
		setLastSessionVisited(null)
		if (accounts.length > 0) {
			addAccounts(accounts)
		}
	}, [])

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
			accounts={accounts}
			initialURI={uri}
			initialAccountId={initialAccountId}
			{...rest}
		/>
	)
}
