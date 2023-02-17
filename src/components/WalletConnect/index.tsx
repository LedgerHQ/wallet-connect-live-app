import { InputMode, NetworkConfig } from '@/types/types'
import LedgerLivePlarformSDK, { Account } from '@ledgerhq/live-app-sdk'
import { useMemo, useState } from 'react'
import { CSSTransition } from 'react-transition-group'
import { WalletConnectV1 } from './v1'
import { Connect } from './Connect'
import { WalletConnectV2 } from './v2'

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
	...rest
}: WalletConnectProps) {
	const sessionURI = useMemo(() => {
		return localStorage.getItem('sessionURI') ?? undefined
	}, [])
	const [uri, setUri] = useState<string | undefined>(
		initialURI && initialURI !== sessionURI ? initialURI : sessionURI,
	)

	if (!uri) {
		return (
			<CSSTransition classNames="fade" timeout={200}>
				<Connect mode={initialMode} onConnect={setUri} />
			</CSSTransition>
		)
	}

	if (uri?.includes('@1?')) {
		return <WalletConnectV1 initialURI={uri} setUri={setUri} {...rest} />
	} else {
		return (
			<WalletConnectV2
				initialMode={initialMode}
				// initialURI={uri}
				setUri={setUri}
				{...rest}
			/>
		)
	}
}
