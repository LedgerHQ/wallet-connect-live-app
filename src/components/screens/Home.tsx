import { startProposal } from '@/helpers/walletConnect.util'
import { ResponsiveContainer } from '@/styles/styles'
import { NetworkConfig, InputMode } from '@/types/types'
import LedgerLivePlarformSDK, { Account } from '@ledgerhq/live-app-sdk'
import { Flex } from '@ledgerhq/react-ui'
import { useTranslation } from 'next-i18next'
import { Dispatch, SetStateAction, useState, useCallback, useMemo } from 'react'
import { TransitionGroup } from 'react-transition-group'
import useHydratation from '@/hooks/useHydratation'
import useNavigation from '@/hooks/useNavigation'
import { useSessionsStore, sessionSelector } from '@/storage/sessions.store'
import { useV1Store, v1Selector } from '@/storage/v1.store'
import styled from 'styled-components'
import { Connect } from './Connect'
import Sessions from './sessions/Sessions'
import Tabs from './Tabs'
import useWalletConnectV1Logic from '@/hooks/useWalletConnectV1Logic'

const WalletConnectContainer = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;
	user-select: none;
	background: ${({ theme }) => theme.colors.background.main};
	padding-top: ${(p) => p.theme.space[5]}px;
`

const WalletConnectInnerContainer = styled(TransitionGroup)`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	background: ${({ theme }) => theme.colors.background.main};
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

export default function Home({
	initialURI,
	initialMode,
	initialAccountId,
	setUri,
}: WalletConnectProps) {
	const { initialized } = useHydratation()
	const { router, tabsIndexes } = useNavigation()
	const routerQueryData = router?.query?.data
	const initialTab = routerQueryData
		? JSON.parse(String(routerQueryData))?.tab
		: tabsIndexes.connect

	const walletConnectClient = useV1Store(v1Selector.selectWalletConnectClient)
	const v1Session = walletConnectClient?.session
	const sessions = useSessionsStore(sessionSelector.selectSessions)

	const { t } = useTranslation()

	const [activeTabIndex, setActiveTabIndex] = useState(initialTab)
	const [inputValue] = useState<string>('')
	const [, setErrorValue] = useState<string | undefined>(undefined)

	const walletConnectV1Logic = useWalletConnectV1Logic({
		initialAccountId,
		initialURI,
	})

	const handleConnect = useCallback(
		async (inputValue: string) => {
			if (!inputValue) {
				setErrorValue(t('error.noInput'))
			} else {
				try {
					setUri(inputValue)
					const uri = new URL(inputValue)
					await startProposal(
						uri.toString(),
						walletConnectV1Logic.createClient,
					)
				} catch (error: unknown) {
					setErrorValue(t('error.invalidUri'))
				} finally {
					setUri('')
				}
			}
		},
		[inputValue],
	)

	const goToConnect = useCallback(() => {
		setActiveTabIndex(tabsIndexes.connect)
	}, [])

	const TABS = useMemo(
		() => [
			{
				index: tabsIndexes.connect,
				title: t('connect.title'),
				Component: (
					<WalletConnectInnerContainer>
						<ResponsiveContainer>
							<Connect
								initialURI={initialURI}
								mode={initialMode}
								onConnect={handleConnect}
							/>
						</ResponsiveContainer>
					</WalletConnectInnerContainer>
				),
			},
			{
				index: tabsIndexes.sessions,
				title: t('sessions.title'),
				badge:
					sessions?.length || (v1Session && v1Session.peerMeta)
						? (sessions.length || 0) +
						  (v1Session && v1Session.peerMeta ? 1 : 0)
						: undefined,
				Component: (
					<WalletConnectInnerContainer>
						<ResponsiveContainer>
							<Sessions
								sessions={sessions}
								goToConnect={goToConnect}
							/>
						</ResponsiveContainer>
					</WalletConnectInnerContainer>
				),
			},
		],
		[t, sessions],
	)

	return (
		<WalletConnectContainer>
			{initialized ? (
				<Tabs
					tabs={TABS}
					activeTabIndex={activeTabIndex}
					setActiveTabIndex={setActiveTabIndex}
				>
					<Flex
						flex={1}
						width="100%"
						height="100%"
						bg="background.main"
					>
						{TABS[activeTabIndex].Component}
					</Flex>
				</Tabs>
			) : null}
		</WalletConnectContainer>
	)
}
