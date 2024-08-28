import { ButtonsContainer, List } from "@/components/atoms/containers/Elements";
import { AddAccountPlaceholder } from "@/components/screens/sessionProposal/AddAccountPlaceholder";
import { ErrorBlockchainSupport } from "@/components/screens/sessionProposal/ErrorBlockchainSupport";
import { InfoSessionProposal } from "@/components/screens/sessionProposal/InfoSessionProposal";
import { formatUrl } from "@/utils/helper.util";
import { useProposal } from "@/hooks/useProposal/useProposal";
import { ResponsiveContainer } from "@/styles/styles";
import { Flex, Button, Box, Text } from "@ledgerhq/react-ui";
import { ArrowLeftMedium } from "@ledgerhq/react-ui/assets/icons";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useMemo } from "react";
import styled, { useTheme } from "styled-components";
import useAnalytics from "@/hooks/useAnalytics";
import { tryDecodeURI } from "@/utils/image";
import { formatAccountsByChain, sortChains } from "@/hooks/useProposal/util";
import { ProposalTypes } from "@walletconnect/types";
import { AccountRow } from "./sessionProposal/AccountRow";
import { ErrorMissingRequiredAccount } from "./sessionProposal/ErrorMissingRequiredAccount";
import LogoHeader from "./sessionProposal/LogoHeader";
import { ChainRow } from "./sessionProposal/ChainRow";
import { walletCurrenciesByIdAtom } from "@/store/wallet-api.store";
import { useAtomValue } from "jotai";
import VerificationLabel from "../verification/VerificationLabel";
import VerificationCard from "../verification/VerificationCard";

const BackButton = styled(Flex)`
  cursor: pointer;
  &:hover {
    opacity: 0.7;
  }
`;

type Props = {
  proposal: ProposalTypes.Struct;
};

export default function SessionProposal({ proposal }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const {
    getValidation,
    handleClick,
    handleClose,
    approveSession,
    rejectSession,
    accounts,
    selectedAccounts,
    addNewAccounts,
    navigateToHome,
  } = useProposal(proposal);
  const analytics = useAnalytics();
  const dApp = proposal.proposer.metadata.name;
  const dAppUrl = proposal.proposer.metadata.url;
  const currenciesById = useAtomValue(walletCurrenciesByIdAtom);

  useEffect(() => {
    analytics.page("Wallet Connect Session Request", {
      dapp: dApp,
      url: dAppUrl,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onGoBack = useCallback(() => {
    void navigateToHome();
    analytics.track("button_clicked", {
      button: "WC-Back",
      page: "Wallet Connect Session Request",
    });
  }, [analytics, navigateToHome]);

  const onApprove = useCallback(() => {
    analytics.track("button_clicked", {
      button: "WC-Connect",
      page: "Wallet Connect Session Request",
      dapp: dApp,
      url: dAppUrl,
    });
    void approveSession();
  }, [analytics, approveSession, dApp, dAppUrl]);

  const onReject = useCallback(() => {
    analytics.track("button_clicked", {
      button: "WC-Reject",
      page: "Wallet Connect Session Request",
      dapp: dApp,
      url: dAppUrl,
    });
    void rejectSession();
  }, [analytics, dApp, dAppUrl, rejectSession]);

  const accountsByChain = useMemo(
    () => formatAccountsByChain(proposal, accounts),
    [proposal, accounts],
  );

  const requiredChains = useMemo(
    () => accountsByChain.filter((entry) => entry.isRequired),
    [accountsByChain],
  );

  const requiredChainsWhereNoAccounts = useMemo(
    () => requiredChains.filter((entry) => entry.accounts.length === 0),
    [requiredChains],
  );

  const noChainsSupported = useMemo(
    () => !accountsByChain.some((entry) => entry.isSupported),
    [accountsByChain],
  );

  const everyRequiredChainsSupported = useMemo(
    () => requiredChains.every((entry) => entry.isSupported),
    [requiredChains],
  );

  const everyRequiredChainsSelected = useMemo(
    () =>
      requiredChains.every((entry) =>
        entry.accounts.some((account) => selectedAccounts.includes(account.id)),
      ),
    [requiredChains, selectedAccounts],
  );

  const disabled = useMemo(
    () => !(everyRequiredChainsSelected && selectedAccounts.length > 0),
    [everyRequiredChainsSelected, selectedAccounts],
  );

  const iconProposer = useMemo(
    () => tryDecodeURI(proposal.proposer.metadata.icons[0]),
    [proposal.proposer.metadata.icons],
  );

  const chainsWhereNoAccounts = useMemo(
    () =>
      accountsByChain
        .filter((entry) => entry.isSupported)
        .filter((entry) => entry.accounts.length === 0),
    [accountsByChain],
  );

  const createAccountDisplayed = useMemo(
    () => chainsWhereNoAccounts.length > 0,
    [chainsWhereNoAccounts],
  );

  const entries = useMemo(() => {
    return sortChains(accountsByChain)
      .filter((entry) => entry.isSupported)
      .filter((entry) => entry.accounts.length > 0);
  }, [accountsByChain]);

  return (
    <Flex
      flex={1}
      alignItems="center"
      justifyContent="center"
      width="100%"
      height={
        noChainsSupported || !everyRequiredChainsSupported ? "100%" : "auto"
      }
    >
      <ResponsiveContainer>
        <BackButton onClick={onGoBack} alignSelf="flex-start">
          <Flex mt={8}>
            <ArrowLeftMedium size={24} color="neutral.c100" />
          </Flex>
        </BackButton>

        {noChainsSupported ||
        !everyRequiredChainsSupported ||
        requiredChainsWhereNoAccounts.length > 0 ? (
          <Flex flex={1} flexDirection="column" height="100%">
            {noChainsSupported || !everyRequiredChainsSupported ? (
              <ErrorBlockchainSupport appName={dApp} chains={accountsByChain} />
            ) : (
              <ErrorMissingRequiredAccount
                appName={dApp}
                addNewAccounts={addNewAccounts}
                iconProposer={iconProposer}
                chains={accountsByChain}
              />
            )}

            <ButtonsContainer>
              <Button
                variant="main"
                size="large"
                flex={1}
                onClick={handleClose}
              >
                <Text variant="body" fontWeight="semiBold" color="neutral.c00">
                  {t("sessionProposal.close")}
                </Text>
              </Button>
            </ButtonsContainer>
          </Flex>
        ) : (
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

                {
                  <VerificationLabel
                    marginTop={5}
                    verification={getValidation()}
                  />
                }

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
                      <ChainRow
                        entry={entry}
                        selectedAccounts={selectedAccounts}
                      />
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

            <Flex flexDirection={"column"}>
              {<VerificationCard verification={getValidation()} />}

              <Flex
                style={{
                  backdropFilter: "blur(7px)",
                  position: "sticky",
                  bottom: "0px",
                }}
              >
                <ButtonsContainer>
                  <Button size="large" flex={0.3} mr={6} onClick={onReject}>
                    <Text
                      variant="body"
                      fontWeight="semiBold"
                      color="neutral.c100"
                    >
                      {t("sessionProposal.reject")}
                    </Text>
                  </Button>
                  <Button
                    variant="main"
                    size="large"
                    flex={0.9}
                    onClick={onApprove}
                    disabled={disabled}
                  >
                    <Text
                      variant="body"
                      fontWeight="semiBold"
                      color={disabled ? "neutral.c50" : "neutral.c00"}
                    >
                      {t("sessionProposal.connect")}
                    </Text>
                  </Button>
                </ButtonsContainer>
              </Flex>
            </Flex>
          </Flex>
        )}
      </ResponsiveContainer>
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
