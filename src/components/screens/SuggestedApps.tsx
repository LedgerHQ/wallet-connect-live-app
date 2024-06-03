import { device } from "@/styles/breakpoints";
import AppCard from "../AppCard";
import { Text } from "@ledgerhq/react-ui";
import { t } from "i18next";
import styled from "styled-components";

const appList = [
  {
    id: "stader-eth",
    name: "Stader Labs - Ethereum Staking",
    category: "stake",
    icon: "https://www.staderlabs.com/assets/images/stader-icon.svg",
    url: "https://www.staderlabs.com/eth/stake/",
  },
  {
    id: "1inch",
    name: "1inch",
    category: "deFi",
    icon: "https://cdn.live.ledger.com/icons/platform/1inch.png",
    url: "https://app.1inch.io/#/1/simple/swap/ETH",
  },
  {
    id: "p2p",
    name: "P2P.org - ETH Staking",
    category: "stake",
    icon: "https://cdn.live.ledger.com/icons/platform/p2p.png",
    url: "https://eth.p2p.org/auth",
  },

  {
    id: "kiln",
    name: "Kiln",
    category: "stake",
    "icon": "https://cdn.live.ledger.com/icons/platform/kiln.png",
    url: "https://stake.kiln.fi/dedicated/stake",
  },  
  {
    id: "paraswap",
    name: "ParaSwap",
    category: "deFi",
    icon: "https://cdn.live.ledger.com/icons/platform/paraswap.png",
    url: "https://app.paraswap.io/#/0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE-0x6b175474e89094c44da98b954eedeac495271d0f/1/SELL?version=5&network=ethereum",
  },
  {
    id: "squid",
    name: "Squid",
    category: "deFi",
    icon: "https://cdn.live.ledger.com/icons/platform/squid.png",
    url: "https://app.squidrouter.com/",
  },
  {
    id: "thorswap",
    name: "THORSwap",
    category: "deFi",
    icon: "https://www.thorswap.finance/logo.png",
    url: "https://app.thorswap.finance/swap",
  },
  {
    id: "lido",
    name: "Lido",
    category: "stake",
    icon: "https://cdn.live.ledger.com/icons/platform/lido.png",
    url: "https://stake.lido.fi/",
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
          <AppCard
            key={app.name}
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
