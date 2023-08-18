import { Flex } from '@ledgerhq/react-ui'
import type { Account } from '@ledgerhq/wallet-api-client'
import { useTranslation } from 'next-i18next'
import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useMemo, useState } from 'react'
import { TransitionGroup } from 'react-transition-group'
import styled from 'styled-components'

import { startProposal } from '@/helpers/walletConnect.util'
import useAnalytics from '@/hooks/common/useAnalytics'
import { useNavigation } from '@/hooks/common/useNavigation'
import useHydratation from '@/hooks/useHydratation'
import { sessionSelector, useSessionsStore } from '@/storage/sessions.store'
import { ResponsiveContainer } from '@/styles/styles'
import type { InputMode } from '@/types/types'

import { Connect } from './Connect'
import Sessions from './sessions/Sessions'
import Tabs from './Tabs'
import { routes, tabsIndexes } from '@/shared/navigation'

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
  initialURI?: string
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
  const { router } = useNavigation()
  const routerQueryData = router?.query?.data
  const initialTab = routerQueryData
    ? JSON.parse(String(routerQueryData))?.tab
    : tabsIndexes.connect

  const sessions = useSessionsStore(sessionSelector.selectSessions)
  const analytics = useAnalytics()

  const { t } = useTranslation()

  const [activeTabIndex, setActiveTabIndex] = useState(initialTab)

  const onSetActiveTabIndex = useCallback(
    (newActiveTabIndex: number) => {
      const newTab =
        newActiveTabIndex === tabsIndexes.connect ? 'Connect' : 'Sessions'
      const currentTab =
        activeTabIndex === tabsIndexes.connect ? 'Connect' : 'Sessions'
      analytics.track('tab_clicked', { tab: newTab, page: currentTab })
      setActiveTabIndex(newActiveTabIndex)
    },
    [activeTabIndex, analytics],
  )

  const handleConnect = useCallback(
    async (inputValue: string) => {
      try {
        setUri(inputValue)
        const uri = new URL(inputValue)
        if (uri.toString().includes('@1')) {
          router.push(routes.protocolNotSupported)
        } else {
          await startProposal(uri.toString())
        }
      } catch (error: unknown) {
        console.error(error)
      } finally {
        setUri('')
      }
    },
    [router, setUri],
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
        badge: sessions?.length || undefined,
        Component: (
          <WalletConnectInnerContainer>
            <ResponsiveContainer>
              <Sessions goToConnect={goToConnect} />
            </ResponsiveContainer>
          </WalletConnectInnerContainer>
        ),
      },
    ],
    [t, initialURI, initialMode, handleConnect, sessions?.length, goToConnect],
  )

  return (
    <WalletConnectContainer>
      {initialized ? (
        <Tabs
          tabs={TABS}
          activeTabIndex={activeTabIndex}
          setActiveTabIndex={onSetActiveTabIndex}
        >
          <Flex flex={1} width="100%" height="100%" bg="background.main">
            {TABS[activeTabIndex].Component}
          </Flex>
        </Tabs>
      ) : null}
    </WalletConnectContainer>
  )
}
