import { Account } from "@ledgerhq/wallet-api-client";
import { Flex, Text } from "@ledgerhq/react-ui";
import { CloseMedium } from "@ledgerhq/react-ui/assets/icons";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import useAnalytics from "@/hooks/useAnalytics";
import styled from "styled-components";
import { SUPPORTED_NETWORK_NAMES } from "@/data/network.config";

const LogoContainer = styled(Flex)`
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  background-color: ${(p) => p.theme.colors.error.c50};
  height: 50px;
  width: 50px;
`;

type Props = {
  appName: string;
  chains: {
    chain: string;
    isSupported: boolean;
    isRequired: boolean;
    accounts: Account[];
  }[];
};

export function ErrorBlockchainSupport({ appName, chains }: Props) {
  const { t } = useTranslation();
  const analytics = useAnalytics();

  useEffect(() => {
    analytics.page("Wallet Connect Error Unsupported Blockchains", {
      dapp: appName,
      chains: chains.map((chain) => ({
        chain: chain.chain,
        isSupported: chain.isSupported,
        isRequired: chain.isRequired,
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      flex={1}
    >
      <LogoContainer>
        <CloseMedium size={32} color="background.main" />
      </LogoContainer>
      <Text
        variant="h4"
        fontWeight="medium"
        color="neutral.c100"
        mt={10}
        textAlign="center"
        data-testid="error-title-blockchain-support"
      >
        {t("sessionProposal.error.title", { appName })}
      </Text>
      <Text
        variant="bodyLineHeight"
        fontWeight="medium"
        color="neutral.c80"
        mt={10}
        textAlign="center"
      >
        {t("sessionProposal.error.info")}
        {SUPPORTED_NETWORK_NAMES.join(", ")}
      </Text>
    </Flex>
  );
}
