import AppCard from "../AppCard";
import { Text } from "@ledgerhq/react-ui";
import { t } from "i18next";
import styled from "styled-components";

const appList = [
  {
    id: "test",
    name: "Opensea.io",
    category: "NFT",
    icon: "https://cdn.live.ledger.com/icons/platform/1inch.png",
    url: "https://dapp-browser.apps.ledger.com/v2/",
  },
  {
    id: "test",
    name: "Opensea.io",
    category: "NFT",
    icon: "https://cdn.live.ledger.com/icons/platform/1inch.png",
    url: "https://dapp-browser.apps.ledger.com/v2/",
  },
  {
    id: "test",
    name: "Opensea.io",
    category: "NFT",
    icon: "https://cdn.live.ledger.com/icons/platform/1inch.png",
    url: "https://dapp-browser.apps.ledger.com/v2/",
  },
  {
    id: "test",
    name: "Opensea.io",
    category: "NFT",
    icon: "https://cdn.live.ledger.com/icons/platform/1inch.png",
    url: "https://dapp-browser.apps.ledger.com/v2/",
  },
  {
    id: "test",
    name: "Opensea.io",
    category: "NFT",
    icon: "https://cdn.live.ledger.com/icons/platform/1inch.png",
    url: "https://dapp-browser.apps.ledger.com/v2/",
  },
  {
    id: "test",
    name: "Opensea.io",
    category: "NFT",
    icon: "https://cdn.live.ledger.com/icons/platform/1inch.png",
    url: "https://dapp-browser.apps.ledger.com/v2/",
  },
];

const GridContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  gap: 10px;
  justify-items: center;
  overflow-y: scroll;
`;

export default function RecentlyUsedApps() {
  return (
    <>
      <Text variant="extraSmall" color="neutral.c70" marginBottom={8}>
        {t("sessions.apps.lastConnection")}
      </Text>

      <GridContainer>
        {appList.map((app) => (
          // eslint-disable-next-line react/jsx-key
          <AppCard app={app} />
        ))}
      </GridContainer>
    </>
  );
}
