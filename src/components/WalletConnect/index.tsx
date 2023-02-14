import { InputMode, NetworkConfig } from '@/types/types'
import LedgerLivePlarformSDK, { Account } from '@ledgerhq/live-app-sdk'
import { useMemo, useState } from 'react'
import { CSSTransition } from 'react-transition-group'
import { WalletConnectV1 } from './v1'
import { Disconnected } from './v1/Disconnected'
import { WalletConnectV2 } from './v2'
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

	if (!uri) {
		return (
			<CSSTransition classNames="fade" timeout={200}>
				<Disconnected mode={initialMode} onConnect={setUri} />
			</CSSTransition>
		)
	}

	if (uri?.includes('@1?')) {
		return (
			<WalletConnectV1
				networks={networks}
				initialURI={uri}
				setUri={setUri}
				accounts={accounts}
				{...rest}
				platformSDK={platformSDK}
			/>
		)
	} else {
		return (
			<WalletConnectV2
				networks={networks}
				platformSDK={platformSDK}
				accounts={accounts}
				initialURI={uri}
				{...rest}
			/>
		)
	}
}
