import { InputMode } from '@/types/types'
import { useCallback, useState, Dispatch, SetStateAction, useMemo } from 'react'
import LedgerLivePlarformSDK, { Account } from '@ledgerhq/live-app-sdk'
import styled from 'styled-components'
import { TransitionGroup } from 'react-transition-group'
import { useTranslation } from 'next-i18next'
import { Tabs } from '@ledgerhq/react-ui'
import useInitialization from './hooks/useInitialization'
import useWalletConnectEventsManager from './hooks/useWalletConnectEventsManager'
import { pair } from './utils/WalletConnectUtil'
import { Connect } from '../Connect'
import { NetworkConfig } from '@/types/types'

const WalletConnectContainer = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	position: relative;
	width: 100%;
	height: 100%;
	user-select: none;
`

const WalletConnectInnerContainer = styled(TransitionGroup)`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 100%;
	background: ${({ theme }) => theme.colors.neutral.c20};
`

export type WalletConnectProps = {
	initialAccountId?: string
	initialURI?: string
	networks: NetworkConfig[]
	platformSDK: LedgerLivePlarformSDK
	accounts: Account[]
	initialMode?: InputMode
	setUri: Dispatch<SetStateAction<string | undefined>>
}

export function WalletConnectV2({
	platformSDK,
	accounts,
	initialMode,
	setUri,
}: WalletConnectProps) {
	const initialized = useInitialization()
	useWalletConnectEventsManager(initialized)

	const { t } = useTranslation()

	const [inputValue, setInputValue] = useState<string>('')
	const [errorValue, setErrorValue] = useState<string | undefined>(undefined)

	const handleConnect = useCallback(
		async (inputValue: string) => {
			if (!inputValue) {
				setErrorValue(t('error.noInput'))
			} else {
				try {
					setUri(inputValue)
					const uri = new URL(inputValue)
					await pair({ uri: uri.toString() })
				} catch (error: unknown) {
					setErrorValue(t('error.invalidUri'))
				} finally {
					setUri('')
				}
			}
		},
		[inputValue],
	)

	const TABS = useMemo(
		() => [
			{
				index: 0,
				title: t('connect.title'),
				Component: (
					<WalletConnectInnerContainer>
						<Connect mode={initialMode} onConnect={handleConnect} />
					</WalletConnectInnerContainer>
				),
			},
			{
				index: 1,
				title: t('sessions.title'),
				badge: 2,
				Component: (
					<div
						style={{
							width: '100%',
							height: '100%',
							backgroundColor: '#00f',
						}}
					>
						This is the sessions component
					</div>
				),
			},
		],
		[t],
	)

	return (
		<WalletConnectContainer>
			<div
				style={{
					width: '100%',
					height: '100%',
					backgroundColor: '#f00',
				}}
			>
				<Tabs tabs={TABS} />
			</div>
		</WalletConnectContainer>
	)
}
