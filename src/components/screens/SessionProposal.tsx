import { ButtonsContainer, List } from "@/components/atoms/containers/Elements";
import { GenericRow } from "@/components/atoms/GenericRow";
import { RowType } from "@/components/atoms/types";
import LogoContainer from "@/components/atoms/logoContainers/LedgerLogoContainer";
import { AddAccountPlaceholder } from "@/components/screens/sessionProposal/AddAccountPlaceholder";
import { ErrorBlockchainSupport } from "@/components/screens/sessionProposal/ErrorBlockchainSupport";
import { InfoSessionProposal } from "@/components/screens/sessionProposal/InfoSessionProposal";
import { formatUrl, getColor, getTicker, truncate } from "@/utils/helper.util";
import { useProposal } from "@/hooks/useProposal/useProposal";
import { ResponsiveContainer } from "@/styles/styles";
import { Flex, Button, Box, CryptoIcon, Text } from "@ledgerhq/react-ui";
import {
  WalletConnectMedium,
  CircledCrossSolidMedium,
  ArrowLeftMedium,
} from "@ledgerhq/react-ui/assets/icons";
import { space } from "@ledgerhq/react-ui/styles/theme";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useMemo } from "react";
import { Logo } from "@/icons/LedgerLiveLogo";
import styled, { useTheme } from "styled-components";
import useAnalytics from "@/hooks/useAnalytics";
import { tryDecodeURI } from "@/utils/image";
import { formatAccountsByChain, sortChains } from "@/hooks/useProposal/util";
import { ProposalTypes } from "@walletconnect/types";

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
    handleClick,
    handleClose,
    approveSession,
    rejectSession,
    accounts,
    selectedAccounts,
    addNewAccount,
    navigateToHome,
  } = useProposal(proposal);
  const analytics = useAnalytics();
  const dApp = proposal.proposer.metadata.name;
  const dAppUrl = proposal.proposer.metadata.url;

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
    [proposal, accounts]
  );

  const requiredChains = useMemo(
    () => accountsByChain.filter((entry) => entry.isRequired),
    [accountsByChain]
  );

  const chainsNotSupported = useMemo(
    () => accountsByChain.filter((entry) => !entry.isSupported),
    [accountsByChain]
  );

  const noChainsSupported = useMemo(
    () => !accountsByChain.some((entry) => entry.isSupported),
    [accountsByChain]
  );

  const everyRequiredChainsSupported = useMemo(
    () => requiredChains.every((entry) => entry.isSupported),
    [requiredChains]
  );

  const disabled = useMemo(
    () =>
      !requiredChains.every((entry) =>
        entry.accounts.some((account) => selectedAccounts.includes(account.id))
      ),
    [requiredChains, selectedAccounts]
  );

  const iconProposer = useMemo(
    () => tryDecodeURI(proposal.proposer.metadata.icons[0]),
    [proposal.proposer.metadata.icons]
  );

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

        {noChainsSupported || !everyRequiredChainsSupported ? (
          <Flex flex={1} flexDirection="column" height="100%">
            <ErrorBlockchainSupport appName={dApp} chains={accountsByChain} />
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
            height="100%"
            flex={1}
            justifyContent="space-between"
            flexDirection="column"
          >
            <Flex flexDirection="column">
              <Header mb={10}>
                {iconProposer ? (
                  <Container>
                    <LogoContainer>
                      <Logo size={30} />
                    </LogoContainer>

                    <DAppContainer borderColor={colors.background.main}>
                      <LogoContainer>
                        <img
                          src={iconProposer}
                          alt="Picture of the proposer"
                          width={60}
                          style={{
                            borderRadius: "50%",
                            borderLeft: `3px solid ${colors.background.main}`,
                          }}
                          height={60}
                        />
                      </LogoContainer>
                    </DAppContainer>
                  </Container>
                ) : (
                  <LogoContainer>
                    <WalletConnectMedium size={30} />
                  </LogoContainer>
                )}

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
              </Header>
              <ListChains>
                {sortChains(accountsByChain)
                  .filter((entry) => entry.isSupported)
                  .map((entry) => {
                    return (
                      <Box key={entry.chain} mb={6}>
                        <Box mb={6}>
                          <Text variant="subtitle" color={colors.neutral.c70}>
                            {entry.displayName}
                            {entry.isRequired ? (
                              <Text color="error.c80" ml={1}>
                                *
                              </Text>
                            ) : null}
                          </Text>
                        </Box>
                        {entry.accounts.length > 0 ? (
                          <List>
                            {entry.accounts.map((account, index: number) => (
                              <li
                                key={account.id}
                                style={{
                                  marginBottom:
                                    index !== entry.accounts.length - 1
                                      ? space[3]
                                      : 0,
                                }}
                              >
                                <GenericRow
                                  title={account.name}
                                  subtitle={truncate(account.address, 30)}
                                  isSelected={selectedAccounts.includes(
                                    account.id
                                  )}
                                  onClick={() => handleClick(account.id)}
                                  LeftIcon={
                                    <CryptoIcon
                                      name={getTicker(entry.chain)}
                                      circleIcon
                                      size={24}
                                      color={getColor(entry.chain)}
                                    />
                                  }
                                  rowType={RowType.Select}
                                />
                              </li>
                            ))}
                          </List>
                        ) : (
                          <AddAccountPlaceholder
                            onClick={() => void addNewAccount(entry.chain)}
                          />
                        )}
                      </Box>
                    );
                  })}
                {chainsNotSupported && chainsNotSupported.length > 0 ? (
                  <GenericRow
                    title={
                      chainsNotSupported.length > 1
                        ? t("sessionProposal.notSupported_plural")
                        : t("sessionProposal.notSupported")
                    }
                    subtitle={chainsNotSupported
                      .map((entry) => entry.chain)
                      .join(", ")
                      .concat(".")}
                    LeftIcon={
                      <Flex p={3} bg="error.c100a025" borderRadius="50%">
                        <CircledCrossSolidMedium size={16} color="error.c100" />
                      </Flex>
                    }
                    rowType={RowType.Default}
                  />
                ) : null}
                <Box mt={6}>
                  <InfoSessionProposal />
                </Box>
              </ListChains>
            </Flex>

            <Flex>
              <ButtonsContainer>
                <Button
                  variant="shade"
                  size="large"
                  flex={0.9}
                  mr={6}
                  onClick={onReject}
                >
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
        )}
      </ResponsiveContainer>
    </Flex>
  );
}

const DAppContainer = styled(Flex).attrs(
  (p: { size: number; borderColor: string; backgroundColor: string }) => ({
    position: "absolute",
    right: "-55px",
    alignItems: "center",
    justifyContent: "center",
    heigth: p.size,
    width: p.size,
    borderRadius: 50.0,
    border: `3px solid ${p.borderColor}`,
    backgroundColor: p.backgroundColor,
    zIndex: 0,
  })
)<{ size: number }>``;

const Container = styled(Flex).attrs((p: { size: number }) => ({
  heigth: p.size,
  width: p.size,
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  left: "-25px",
}))<{ size: number }>``;

const ListChains = styled(Flex)`
  flex-direction: column;
`;

const Header = styled(Flex)`
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;
