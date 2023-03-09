import React, { useEffect, useRef, useState } from 'react'
import {
	Account,
	WalletInfo,
	WindowMessageTransport,
	WalletAPIClient,
} from '@ledgerhq/wallet-api-client'
import { NetworkConfig } from './types/types'

type WalletApiClientProviderProps = {
	networks: NetworkConfig[]
	children: (
		walletApiClient: WalletAPIClient,
		accounts: Account[],
		userId: string,
		walletInfo: WalletInfo['result'],
	) => React.ReactElement
}

function filterAccountsForNetworks(
	accounts: Account[],
	networks: NetworkConfig[],
): Account[] {
	const supportedCurrencies = networks.map((network) => network.currency)

	return accounts.filter((account) => {
		return supportedCurrencies.includes(account.currency)
	})
}

export function WalletApiClientProvider({
	networks,
	children,
}: WalletApiClientProviderProps) {
	const walletApiClientRef = useRef<WalletAPIClient | null>(null)

	const [accounts, setAccounts] = useState<Account[] | undefined>(undefined)
	const [userId, setUserId] = useState<string | undefined>(undefined)
	const [walletInfo, setWalletInfo] = useState<
		WalletInfo['result'] | undefined
	>(undefined)

	useEffect(() => {
		const transport = new WindowMessageTransport()
		transport.connect()
		const walletApiClient = new WalletAPIClient(transport)
		walletApiClient.account.list().then((allAccounts) => {
			const filteredAccounts = filterAccountsForNetworks(
				allAccounts,
				networks,
			)
			setAccounts(filteredAccounts)
		})

		walletApiClient.wallet.userId().then((userId) => setUserId(userId))

		walletApiClient.wallet.info().then((info) => setWalletInfo(info))

		walletApiClientRef.current = walletApiClient

		return () => {
			transport.disconnect()
		}
	}, [])

	if (walletApiClientRef.current && accounts && userId && walletInfo) {
		return children(
			walletApiClientRef.current,
			accounts,
			userId,
			walletInfo,
		)
	}
	return null
}
