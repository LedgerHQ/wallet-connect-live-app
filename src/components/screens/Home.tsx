import { startProposal } from "@/helpers/walletConnect.util";
import { ResponsiveContainer } from "@/styles/styles";
import { InputMode } from "@/types/types";
import { Flex } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { Dispatch, SetStateAction, useCallback, useMemo } from "react";
import { useSessionsStore, sessionSelector } from "@/storage/sessions.store";
import styled from "styled-components";
import { Connect } from "./Connect";
import Sessions from "./sessions/Sessions";
import Tabs from "./Tabs";
import useAnalytics from "@/hooks/common/useAnalytics";
import { TabsIndexes } from "@/shared/navigation";
import { useNavigate } from "@tanstack/react-router";
import { indexRoute } from "src/routes";

const WalletConnectContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  user-select: none;
  background: ${({ theme }) => theme.colors.background.main};
  padding-top: ${(p) => p.theme.space[5]}px;
`;

const WalletConnectInnerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.colors.background.main};
`;

export type WalletConnectProps = {
  initialURI?: string;
  initialMode?: InputMode;
  setUri: Dispatch<SetStateAction<string | undefined>>;
};

export default function Home({
  initialURI,
  initialMode,
  setUri,
}: WalletConnectProps) {
  const navigate = useNavigate();
  const search = indexRoute.useSearch();

  const sessions = useSessionsStore(sessionSelector.selectSessions);
  const analytics = useAnalytics();

  const { t } = useTranslation();

  const onSetActiveTabIndex = useCallback(
    (newActiveTabIndex: number) => {
      const newTab =
        newActiveTabIndex === TabsIndexes.Connect ? "Connect" : "Sessions";
      const currentTab =
        search.tab === TabsIndexes.Connect ? "Connect" : "Sessions";
      analytics.track("tab_clicked", { tab: newTab, page: currentTab });
      void navigate({
        params: (params) => params,
        search: { tab: newActiveTabIndex },
      });
    },
    [search.tab, analytics]
  );

  const handleConnect = async (inputValue: string) => {
    try {
      // setUri(inputValue)
      // NOTE: useEffect in Connect would retrigger onConnect with that same value
      const uri = new URL(inputValue);
      if (uri.toString().includes("@1")) {
        await navigate({ to: "/protocol-not-supported" });
      } else {
        await startProposal(uri.toString());
      }
    } catch (error: unknown) {
      console.error(error);
    } finally {
      setUri("");
    }
  };

  const goToConnect = () =>
    void navigate({
      params: (params) => params,
      search: { tab: TabsIndexes.Connect },
    });

  const TABS = useMemo(
    () => [
      {
        index: TabsIndexes.Connect,
        title: t("connect.title"),
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
        index: TabsIndexes.Sessions,
        title: t("sessions.title"),
        badge: sessions?.length,
        Component: (
          <WalletConnectInnerContainer>
            <ResponsiveContainer>
              <Sessions goToConnect={goToConnect} />
            </ResponsiveContainer>
          </WalletConnectInnerContainer>
        ),
      },
    ],
    [t, sessions]
  );

  return (
    <WalletConnectContainer>
      <Tabs
        tabs={TABS}
        activeTabIndex={search.tab}
        setActiveTabIndex={onSetActiveTabIndex}
      >
        <Flex flex={1} width="100%" height="100%" bg="background.main">
          {TABS[search.tab].Component}
        </Flex>
      </Tabs>
    </WalletConnectContainer>
  );
}
