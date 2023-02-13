import { InputMode, NetworkConfig } from '@/types/types'
import LedgerLivePlarformSDK, { Account } from '@ledgerhq/live-app-sdk'
import { useMemo, useState } from 'react'
import { CSSTransition } from 'react-transition-group'
import { WalletConnectV1 } from './v1'
import { Disconnected } from './v1/Disconnected'
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
	accounts,
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
				<Disconnected mode={initialMode} onConnect={setUri} />
			</CSSTransition>
		)
	}

	if (uri?.includes('@1?')) {
		return (
			<WalletConnectV1
				initialURI={uri}
				setUri={setUri}
				accounts={accounts}
				{...rest}
			/>
		)
	} else {
		localStorage.setItem('accounts', JSON.stringify(accounts))
		return <WalletConnectV2 initialURI={uri} setUri={setUri} {...rest} />
	}
}
