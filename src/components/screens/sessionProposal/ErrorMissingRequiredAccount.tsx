import { Account } from "@ledgerhq/wallet-api-client";
import { Flex, Text } from "@ledgerhq/react-ui";
import { CloseMedium } from "@ledgerhq/react-ui/assets/icons";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo } from "react";
import useAnalytics from "@/hooks/useAnalytics";
import styled from "styled-components";
import { SUPPORTED_NETWORK_NAMES } from "@/data/network.config";
import LogoHeader from "./LogoHeader";
import ChainBadge from "@/components/atoms/ChainBadge";
import { AddAccountPlaceholder } from "./AddAccountPlaceholder";
import { AccountsInChain } from "@/hooks/useProposal/util";

type Props = {
  appName: string;
  iconProposer: string | null;
  addNewAccounts: (currencies: string[]) => Promise<void>;
  chains: AccountsInChain[];
};

export function ErrorMissingRequiredAccount({
  appName,
  addNewAccounts,
  iconProposer,
  chains,
}: Props) {
  const { t } = useTranslation();
  const analytics = useAnalytics();

  const requiredChains = useMemo(
    () => chains.filter((entry) => entry.isRequired),
    [chains],
  );
  // NOTE: assuming all entries are supported here

  const requiredChainsWhereNoAccounts = useMemo(
    () => requiredChains.filter((entry) => entry.accounts.length === 0),
    [requiredChains],
  );
  // NOTE: analytics
  console.log({requiredChainsWhereNoAccounts})

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
      <Flex justifyContent={"center"} marginY={8} flexDirection={"row"} rowGap={4} columnGap={4}             flexWrap={"wrap"}
>
      {requiredChains.map((entry) => (
        <ChainBadge
          key={entry.chain}
          chain={entry}
          success={entry.accounts.length > 0}
        />
      ))}
      </Flex>

      <AddAccountPlaceholder
        chains={[requiredChainsWhereNoAccounts[0]]}
        addNewAccounts={addNewAccounts}
        // onClick={() => void addNewAccount(entry.chain)}
        // onClick={() => {}}
      />
    </Flex>
  );
}
