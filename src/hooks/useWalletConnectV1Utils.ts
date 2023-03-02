import { wc } from '@/helpers/walletConnectV1.util'
import { appSelector, useAppStore } from '@/storage/app.store'
import { useV1Store } from '@/storage/v1.store'
import { useCallback } from 'react'
import { platformSDK } from './useLedgerLive'
import useNavigation from './useNavigation'

export default function useWalletConnectV1Utils() {
	const networks = useAppStore(appSelector.selectNetworks)
	const { navigate, routes } = useNavigation()
	const {
		setSelectedAccount,
		setProposal,
		setSessionUri,
		clearStore,
		selectedAccount,
		walletConnectClient,
		setWalletConnectClient,
	} = useV1Store()

	/******************************************************************************
	 * Util functions
	 *****************************************************************************/
	const cleanup = useCallback(() => {
		// cleaning everything and reverting to initial state

		const tempAcc = selectedAccount
		setSessionUri(undefined)
		clearStore()
		setSelectedAccount(tempAcc)
	}, [])

	const handleAccept = useCallback(() => {
		console.log('HANDLE ACCEPT', wc, selectedAccount)
		if (wc && selectedAccount) {
			console.log(wc, 'azccept')
			const networkConfig = networks.find(
				(networkConfig) =>
					networkConfig.currency === selectedAccount.currency,
			)
			if (networkConfig) {
				wc.approveSession({
					chainId: networkConfig.chainId,
					accounts: [selectedAccount.address],
				})
				navigate(routes.sessionDetailsV1)
			}
		}
	}, [])

	const handleDecline = useCallback(() => {
		if (wc) {
			wc.rejectSession({
				message: 'DECLINED_BY_USER',
			})

			setProposal(undefined)
			setWalletConnectClient(undefined)
		}
		navigate(routes.home)
	}, [])

	const handleDisconnect = useCallback(() => {
		if (walletConnectClient) {
			walletConnectClient.killSession()
		}
		setWalletConnectClient(undefined)
	}, [])

	const handleSwitchAccount = useCallback(async (currencies?: string[]) => {
		const enabledCurrencies = networks.map(
			(networkConfig) => networkConfig.currency,
		)
		try {
			const newSelectedAccount = await platformSDK.requestAccount({
				currencies: currencies || enabledCurrencies,
			})

			setSelectedAccount(newSelectedAccount)
		} catch (error) {
			console.log('request account canceled by user')
		}
	}, [])

	return {
		cleanup,
		handleAccept,
		handleDecline,
		handleDisconnect,
		handleSwitchAccount,
	}
}
