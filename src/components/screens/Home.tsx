import { startProposal } from "@/helpers/walletConnect.util"
import { ResponsiveContainer } from "@/styles/styles"
import { InputMode } from "@/types/types"
import { Account } from "@ledgerhq/wallet-api-client"
import { Flex } from "@ledgerhq/react-ui"
import { useTranslation } from "next-i18next"
import { Dispatch, SetStateAction, useState, useCallback, useMemo } from "react"
import { TransitionGroup } from "react-transition-group"
import useHydratation from "@/hooks/useHydratation"
import { useNavigation } from "@/hooks/common/useNavigation"
import { useSessionsStore, sessionSelector } from "@/storage/sessions.store"
import styled from "styled-components"
import { Connect } from "./Connect"
import Sessions from "./sessions/Sessions"
import Tabs from "./Tabs"
import useAnalytics from "@/hooks/common/useAnalytics"
import { TabsIndexes, Routes } from "@/shared/navigation"

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

export default function Home({ initialURI, initialMode, setUri }: WalletConnectProps) {
  const { initialized } = useHydratation()
  const { router } = useNavigation()
  const routerQueryData = router?.query?.data
  const initialTab = routerQueryData
    ? JSON.parse(String(routerQueryData))?.tab
    : TabsIndexes.Connect

  const sessions = useSessionsStore(sessionSelector.selectSessions)
  const analytics = useAnalytics()

  const { t } = useTranslation()

  const [activeTabIndex, setActiveTabIndex] = useState(initialTab)
  const [inputValue] = useState<string>("")

  const onSetActiveTabIndex = useCallback(
    (newActiveTabIndex: number) => {
      const newTab = newActiveTabIndex === TabsIndexes.Connect ? "Connect" : "Sessions"
      const currentTab = activeTabIndex === TabsIndexes.Connect ? "Connect" : "Sessions"
      analytics.track("tab_clicked", { tab: newTab, page: currentTab })
      setActiveTabIndex(newActiveTabIndex)
    },
    [activeTabIndex, analytics],
  )

  const handleConnect = useCallback(
    async (inputValue: string) => {
      try {
        setUri(inputValue)
        const uri = new URL(inputValue)
        if (uri.toString().includes("@1")) {
          router.push(Routes.ProtocolNotSupported)
        } else {
          await startProposal(uri.toString())
        }
      } catch (error: unknown) {
        console.error(error)
      } finally {
        setUri("")
      }
    },
    [inputValue],
  )

  const goToConnect = useCallback(() => {
    setActiveTabIndex(TabsIndexes.Connect)
  }, [])

  const TABS = useMemo(
    () => [
      {
        index: TabsIndexes.Connect,
        title: t("connect.title"),
        Component: (
          <WalletConnectInnerContainer>
            <ResponsiveContainer>
              <Connect initialURI={initialURI} mode={initialMode} onConnect={handleConnect} />
            </ResponsiveContainer>
          </WalletConnectInnerContainer>
        ),
      },
      {
        index: TabsIndexes.Sessions,
        title: t("sessions.title"),
        badge: sessions?.length ?? undefined,
        Component: (
          <WalletConnectInnerContainer>
            <ResponsiveContainer>
              <Sessions goToConnect={goToConnect} />
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
        <Tabs tabs={TABS} activeTabIndex={activeTabIndex} setActiveTabIndex={onSetActiveTabIndex}>
          <Flex flex={1} width="100%" height="100%" bg="background.main">
            {TABS[activeTabIndex].Component}
          </Flex>
        </Tabs>
      ) : null}
    </WalletConnectContainer>
  )
}
