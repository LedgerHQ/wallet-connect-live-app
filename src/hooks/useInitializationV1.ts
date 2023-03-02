import { useCallback, useEffect, useState } from 'react'
import { useV1Store, v1Selector } from '@/storage/v1.store'
import { restoreClient } from '@/helpers/walletConnectV1.util'
import { appSelector, useAppStore } from '@/storage/app.store'

export default function useInitializationV1() {
	const [initialized, setInitialized] = useState(false)

	const session = useV1Store(v1Selector.selectSession)
	const selectedAccount = useV1Store(v1Selector.selectAccount)
	const networks = useAppStore(appSelector.selectNetworks)

	const onInitialize = useCallback(async () => {
		try {
			if (session) {
				await restoreClient(session, networks, selectedAccount)
			}

			setInitialized(true)
		} catch (err: unknown) {
			alert(err)
		}
	}, [])

	useEffect(() => {
		if (!initialized) {
			onInitialize()
		}
	}, [initialized, onInitialize])

	return initialized
}
