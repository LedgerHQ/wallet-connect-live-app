import { startProposal } from "@/helpers/walletConnect.util";
import { ResponsiveContainer } from "@/styles/styles";
import { Flex } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { useCallback, useMemo } from "react";
import { useSessionsStore, sessionSelector } from "@/storage/sessions.store";
import styled from "styled-components";
import { Connect } from "./Connect";
import Sessions from "./Sessions";
import Tabs from "../Tabs";
import useAnalytics from "@/hooks/useAnalytics";
import { TabsIndexes } from "@/routes";
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

export default function Home() {
  const navigate = useNavigate();
  const search = indexRoute.useSearch();

  const sessions = useSessionsStore(sessionSelector.selectSessions);
  const analytics = useAnalytics();

  const { t } = useTranslation();

  const onSetActiveTabIndex = useCallback(
    (newActiveTabIndex: TabsIndexes) => {
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
      await navigate({
        params: (params) => params,
        search: (search) => ({ ...search, uri: inputValue }),
      });
      const uri = new URL(inputValue);
      if (uri.toString().includes("@1")) {
        await navigate({ to: "/protocol-not-supported" });
      } else {
        await startProposal(uri.toString());
      }
    } catch (error: unknown) {
      console.error(error);
    } finally {
      await navigate({
        params: (params) => params,
        search: (search) => ({ ...search, uri: undefined }),
      });
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
                initialURI={search.uri}
                mode={search.mode}
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
