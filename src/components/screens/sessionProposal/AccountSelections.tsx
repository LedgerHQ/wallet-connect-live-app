import { ButtonsContainer, List } from "@/components/atoms/containers/Elements";
import { AddAccountPlaceholder } from "@/components/screens/sessionProposal/AddAccountPlaceholder";
import { InfoSessionProposal } from "@/components/screens/sessionProposal/InfoSessionProposal";
import useAnalytics from "@/hooks/useAnalytics";
import {
  AccountsInChain,
  formatAccountsByChain,
  sortChains,
} from "@/hooks/useProposal/util";
import { walletCurrenciesByIdAtom } from "@/store/wallet-api.store";
import { VerificationStatus } from "@/types/types";
import { formatUrl } from "@/utils/helper.util";
import { Box, Button, Flex, InfiniteLoader, Text } from "@ledgerhq/react-ui";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import VerificationCard from "../../verification/VerificationCard";
import VerificationLabel from "../../verification/VerificationLabel";
import { AccountRow } from "./AccountRow";
import { ChainRow } from "./ChainRow";
import LogoHeader from "./LogoHeader";

type Props = {
  dApp: string;
  dAppUrl: string;
  iconProposer: string | null;
  entries: AccountsInChain[];
  selectedAccounts: string[];
  onApprove: () => void;
  onReject: () => void;
  addNewAccounts: (currencies: string[]) => Promise<void>;
  createAccountDisplayed: boolean;
  chainsWhereNoAccounts: AccountsInChain[];
  verificationStatus: VerificationStatus;
  handleClick: (account: string) => void;
  requiredChains: AccountsInChain[];
  disabled: boolean;
  rejecting: boolean;
  approving: boolean;
};

export default function AccountSelections({
  dApp,
  dAppUrl,
  requiredChains,
  entries,
  iconProposer,
  createAccountDisplayed,
  chainsWhereNoAccounts,
  selectedAccounts,
  verificationStatus,
  rejecting,
  disabled,
  approving,
  onApprove,
  onReject,
  handleClick,
  addNewAccounts,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const currenciesById = useAtomValue(walletCurrenciesByIdAtom);

  return (
    <Flex
      width="100%"
      height="300px"
      flex={1}
      justifyContent="space-between"
      paddingBottom={12}
      flexDirection="column"
    >
      <Flex flexDirection="column">
        <Header mb={10}>
          <LogoHeader iconProposer={iconProposer} error={false} />
          <Text
            variant="h4"
            mt={3}
            mb={3}
            uppercase={false}
            textAlign="center"
            fontWeight="medium"
          >
            {t("sessionProposal.connectTo", {
              name: dApp,
            })}
          </Text>

          <Text
            variant="body"
            fontWeight="medium"
            textAlign="center"
            color={colors.neutral.c80}
            uppercase={false}
          >
            {formatUrl(dAppUrl)}
          </Text>

          <VerificationLabel marginTop={5} verification={verificationStatus} />

          {requiredChains.length === 0 && (
            <Text
              mt={6}
              variant="small"
              textAlign="center"
              color={colors.neutral.c90}
              uppercase={false}
            >
              {t("sessionProposal.noRequiredChains")}
            </Text>
          )}
        </Header>
        <ListChains>
          {entries.map((entry) => {
            return (
              <Box key={entry.chain}>
                <ChainRow entry={entry} selectedAccounts={selectedAccounts} />
                <List>
                  {entry.accounts.map((account) => {
                    const currency = currenciesById[account.currency];

                    return (
                      <AccountRow
                        key={account.id}
                        account={account}
                        currency={currency}
                        selectedAccounts={selectedAccounts}
                        handleClick={handleClick}
                      />
                    );
                  })}
                </List>
              </Box>
            );
          })}
          {createAccountDisplayed && (
            <AddAccountPlaceholder
              chains={chainsWhereNoAccounts}
              addNewAccounts={addNewAccounts}
            />
          )}
          <Box mt={6}>
            <InfoSessionProposal />
          </Box>
        </ListChains>
      </Flex>

      <Flex flexDirection={"column"} paddingY={4}>
        <VerificationCard verification={verificationStatus} />
      </Flex>

      <BlurRow>
        <ButtonsContainer>
          <Button
            variant="neutral"
            size="large"
            flex={0.3}
            mr={6}
            onClick={onReject}
            disabled={rejecting}
          >
            {rejecting ? (
              <InfiniteLoader size={20} />
            ) : (
              <Text variant="body" fontWeight="semiBold" color="neutral.c100">
                {t("sessionProposal.reject")}
              </Text>
            )}
          </Button>
          <Button
            variant="main"
            size="large"
            flex={0.9}
            onClick={onApprove}
            disabled={disabled}
          >
            {approving ? (
              <InfiniteLoader size={20} />
            ) : (
              <Text
                variant="body"
                fontWeight="semiBold"
                color={disabled ? "neutral.c50" : "neutral.c00"}
              >
                {t("sessionProposal.connect")}
              </Text>
            )}
          </Button>
        </ButtonsContainer>
      </BlurRow>
    </Flex>
  );
}

const ListChains = styled(Flex)`
  flex-direction: column;
`;

const Header = styled(Flex)`
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const BlurRow = styled(Flex)`
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1));
    backdrop-filter: blur(10px);
  }
  position: sticky;
  bottom: 0px;
`;
