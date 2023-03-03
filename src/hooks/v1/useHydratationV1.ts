import { useState, useEffect } from 'react'
import useInitializationV1 from './useInitializationV1'
import useWalletConnectEventsManagerV1 from './useWalletConnectEventsManagerV1'

export default function useHydratationV1(initialURI?: string) {
	const [hydratedV1, setHydrated] = useState(false)
	const initializedV1 = useInitializationV1(initialURI)
	useWalletConnectEventsManagerV1(initializedV1)
	useEffect(() => {
		// This forces a rerender, so the component is rendered
		// the second time but not the first
		setHydrated(true)
	}, [])

	return {
		hydratedV1,
		initializedV1,
	}
}
