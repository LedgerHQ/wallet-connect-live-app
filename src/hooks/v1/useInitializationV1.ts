import { useCallback, useEffect } from 'react'
import { useV1Store, v1Selector } from '@/storage/v1.store'
import { createClient, restoreClient } from '@/helpers/walletConnectV1.util'
import { appSelector, useAppStore } from '@/storage/app.store'
import { isV1 } from '@/helpers/walletConnect.util'
import { wc } from '@/helpers/walletConnectV1.util'

let initialized = false
export default function useInitializationV1(initialURI?: string) {
	const setWalletConnectClient = useV1Store(v1Selector.setWalletConnectClient)
	const setSession = useV1Store(v1Selector.setSession)
	const session = useV1Store(v1Selector.selectSession)
	const selectedAccount = useV1Store(v1Selector.selectedAccount)
	const sessionURI = useV1Store(v1Selector.selectSessionUri)
	const networks = useAppStore(appSelector.selectNetworks)

	const onInitialize = useCallback(async () => {
		try {
			if (initialURI && initialURI !== sessionURI && isV1(initialURI)) {
				createClient(initialURI, setWalletConnectClient)
				return
			}

			if (session) {
				await restoreClient(
					session,
					networks,
					selectedAccount,
					setWalletConnectClient,
					setSession,
				)
			}

			initialized = true
		} catch (err: unknown) {
			console.log(err)
		}
	}, [])

	useEffect(() => {
		if (!initialized) {
			onInitialize()
		}
	}, [])

	useEffect(() => {
		if (selectedAccount && wc && wc.connected) {
			const networkConfig = networks.find(
				(networkConfig) =>
					networkConfig.currency === selectedAccount.currency,
			)

			if (networkConfig) {
				wc.updateSession({
					chainId: networkConfig.chainId,
					accounts: [selectedAccount.address],
				})
				setWalletConnectClient(wc)
				setSession(wc.session)
			}
		}
	}, [selectedAccount, selectedAccount?.id])

	return initialized
}
