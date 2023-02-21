import { InputMode, NetworkConfig } from '@/types/types'
import LedgerLivePlarformSDK, { Account } from '@ledgerhq/live-app-sdk'
import { useMemo, useState } from 'react'
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
	useLedgerLive(platformSDK, accounts, networks)

	// if (uri?.includes('@1?'))
	return (
		<Home
			initialMode={initialMode}
			setUri={setUri}
			networks={networks}
			platformSDK={platformSDK}
			accounts={accounts}
			initialURI={uri}
			{...rest}
		/>
	)
}
