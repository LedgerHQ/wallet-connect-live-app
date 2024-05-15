import { Account } from "@ledgerhq/wallet-api-client";
import { Flex, Text } from "@ledgerhq/react-ui";
import { CloseMedium } from "@ledgerhq/react-ui/assets/icons";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo } from "react";
import useAnalytics from "@/hooks/useAnalytics";
import styled from "styled-components";
import { SUPPORTED_NETWORK_NAMES } from "@/data/network.config";
import LogoHeader from "./LogoHeader";

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
  iconProposer: string | null;
  chains: {
    chain: string;
    isSupported: boolean;
    isRequired: boolean;
    accounts: Account[];
  }[];
};

export function ErrorMissingRequiredAccount({
  appName,
  iconProposer,
  chains,
}: Props) {
  const { t } = useTranslation();
  const analytics = useAnalytics();

  const requiredChains = useMemo(
    () => chains.filter((entry) => entry.isRequired),
    [chains],
  );

  const requiredChainsWhereNoAccounts = useMemo(
    () => requiredChains.filter((entry) => entry.accounts.length === 0),
    [requiredChains],
  );
  // NOTE: analytics

  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      flex={1}
    >
      <LogoHeader iconProposer={iconProposer} error={true} />
      <Text
        variant="h4"
        fontWeight="medium"
        color="neutral.c100"
        mt={10}
        textAlign="center"
        data-testid="error-title-blockchain-support"
      >
        {t("sessionProposal.missingRequired.title", { appName })}
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
