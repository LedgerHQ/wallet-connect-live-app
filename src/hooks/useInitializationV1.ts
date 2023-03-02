import { useCallback, useEffect, useState } from 'react'
import { useV1Store, v1Selector } from '@/storage/v1.store'
import { createClient, restoreClient } from '@/helpers/walletConnectV1.util'
import { appSelector, useAppStore } from '@/storage/app.store'
import { isV1 } from '@/helpers/walletConnect.util'
import { Account } from '@ledgerhq/live-app-sdk'
import { accountSelector, useAccountsStore } from '@/storage/accounts.store'
import { wc } from '@/helpers/walletConnectV1.util'

const getInitialAccount = (
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

export default function useInitializationV1(
	initialURI?: string,
	initialAccountId?: string,
) {
	const [initialized, setInitialized] = useState(false)

	const walletConnectClient = useV1Store(v1Selector.selectWalletConnectClient)
	const setWalletConnectClient = useV1Store(v1Selector.setWalletConnectClient)
	const selectedAccount = useV1Store(v1Selector.selectAccount)
	const setSelectedAccount = useV1Store(v1Selector.setSelectedAccount)
	const sessionURI = useV1Store(v1Selector.selectSessionUri)

	const networks = useAppStore(appSelector.selectNetworks)
	const accounts = useAccountsStore(accountSelector.selectAccounts)

	const onInitialize = useCallback(async () => {
		try {
			const initialAccount = getInitialAccount(
				accounts,
				initialAccountId,
				selectedAccount?.id,
			)

			if (initialURI && initialURI !== sessionURI && isV1(initialURI)) {
				createClient(initialURI, setWalletConnectClient)
				return
			}

			console.log('RESTORE ?', walletConnectClient)

			if (walletConnectClient?.session) {
				await restoreClient(
					walletConnectClient.session,
					networks,
					initialAccount || selectedAccount,
					setWalletConnectClient,
				)
			}

			if (initialAccountId) {
				setSelectedAccount(initialAccount)
			}

			setInitialized(true)
		} catch (err: unknown) {
			console.log(err)
		}
	}, [])

	useEffect(() => {
		if (!initialized) {
			onInitialize()
		}
	}, [initialized, onInitialize])

	useEffect(() => {
		console.log('use effect => account id', selectedAccount?.id)

		if (selectedAccount && wc && wc.connected) {
			const networkConfig = networks.find(
				(networkConfig) =>
					networkConfig.currency === selectedAccount.currency,
			)
			console.log(
				'network config',
				networkConfig,
				selectedAccount.address,
			)
			if (networkConfig) {
				wc.updateSession({
					chainId: networkConfig.chainId,
					accounts: [selectedAccount.address],
				})
				setWalletConnectClient(wc)
			}
		}
	}, [selectedAccount, selectedAccount?.id])

	return initialized
}
