import { InputMode } from '@/types/types'
import { useCallback, useState, Dispatch, SetStateAction, useMemo } from 'react'
import LedgerLivePlarformSDK, { Account } from '@ledgerhq/live-app-sdk'
import styled from 'styled-components'
import { TransitionGroup } from 'react-transition-group'
import { useTranslation } from 'next-i18next'
import { startProposal } from './v2/utils/WalletConnectUtil'
import { Connect } from './Connect'
import { NetworkConfig } from '@/types/types'
import { ResponsiveContainer } from '@/styles/styles'
import Sessions from './Sessions'
import Tabs from './Tabs'
import { Flex } from '@ledgerhq/react-ui'
import { sessionSelector, useSessionsStore } from 'src/store/Sessions.store'
import useNavigation from './v2/hooks/useNavigation'
import useHydratation from './v2/hooks/useHydratation'
import { useV1Store, v1Selector } from 'src/store/v1.store'

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
	setUri,
}: WalletConnectProps) {
	const { initialized } = useHydratation()
	const { router, tabsIndexes } = useNavigation()
	const routerQueryData = router?.query?.data
	const initialTab = routerQueryData
		? JSON.parse(String(routerQueryData))?.tab
		: tabsIndexes.connect

	const v1Session = useV1Store(v1Selector.selectSession)
	const sessions = useSessionsStore(sessionSelector.selectSessions)

	const { t } = useTranslation()

	const [activeTabIndex, setActiveTabIndex] = useState(initialTab)
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
					await startProposal(uri.toString())
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
