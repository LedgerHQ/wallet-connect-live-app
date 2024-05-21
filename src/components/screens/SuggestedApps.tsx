import { device } from "@/styles/breakpoints";
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
  display: grid;
  gap: 10px;
  justify-items: center;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));

  @media ${device.mobile} {
    grid-template-columns: repeat(2, 1fr);
  }

  @media ${device.desktop} {
    grid-template-columns: repeat(4, 1fr);
  }
`;

export default function SuggestedApps() {
  return (
    <>
      <Text variant="extraSmall" color="neutral.c70" marginBottom={6}>
        {t("sessions.apps.dontKnow")}
      </Text>

      <GridContainer>
        {appList.map((app) => (
          // eslint-disable-next-line react/jsx-key
          <AppCard
            name={app.name}
            category={app.category}
            icon={app.icon}
            url={app.url}
          />
        ))}
      </GridContainer>
    </>
  );
}
