import { ResponsiveContainer } from "@/styles/styles";
import { Flex } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { useCallback, useMemo } from "react";
import { web3walletAtom } from "@/storage/web3wallet.store";
import styled from "styled-components";
import { Connect } from "./Connect";
import Sessions from "./Sessions";
import Tabs from "../Tabs";
import useAnalytics from "@/hooks/useAnalytics";
import { TabsIndexes } from "@/routes";
import { useNavigate } from "@tanstack/react-router";
import { indexRoute } from "src/routes";
import { useAtomValue } from "jotai";
import useSessions from "@/hooks/useSessions";

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

export default function App() {
  const navigate = useNavigate();
  const { tab } = indexRoute.useSearch();

  const web3wallet = useAtomValue(web3walletAtom);
  const sessions = useSessions(web3wallet);
  const sessionsLength = sessions.length;

  const analytics = useAnalytics();

  const { t } = useTranslation();

  const onSetActiveTabIndex = useCallback(
    (newActiveTabIndex: TabsIndexes) => {
      const newTab =
        newActiveTabIndex === TabsIndexes.Connect ? "Connect" : "Sessions";
      const currentTab = tab === TabsIndexes.Connect ? "Connect" : "Sessions";
      analytics.track("tab_clicked", { tab: newTab, page: currentTab });
      void navigate({
        to: "/",
        search: (search) => ({ ...search, tab: newActiveTabIndex }),
      });
    },
    [tab, analytics, navigate]
  );

  const tabs = useMemo(
    () => [
      {
        index: TabsIndexes.Connect,
        title: t("connect.title"),
        Component: (
          <WalletConnectInnerContainer>
            <ResponsiveContainer>
              <Connect />
            </ResponsiveContainer>
          </WalletConnectInnerContainer>
        ),
      },
      {
        index: TabsIndexes.Sessions,
        title: t("sessions.title"),
        badge: sessionsLength,
        Component: (
          <WalletConnectInnerContainer>
            <ResponsiveContainer>
              <Sessions />
            </ResponsiveContainer>
          </WalletConnectInnerContainer>
        ),
      },
    ],
    [t, sessionsLength]
  );

  return (
    <WalletConnectContainer>
      <Tabs
        tabs={tabs}
        activeTabIndex={tab}
        setActiveTabIndex={onSetActiveTabIndex}
      >
        <Flex flex={1} width="100%" height="100%" bg="background.main">
          {tabs[tab].Component}
        </Flex>
      </Tabs>
    </WalletConnectContainer>
  );
}
