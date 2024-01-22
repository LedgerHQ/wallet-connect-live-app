import { ButtonsContainer, List } from "@/components/atoms/containers/Elements";
import { GenericRow, RowType } from "@/components/atoms/GenericRow";
import LogoContainer from "@/components/atoms/logoContainers/LedgerLogoContainer";
import { AddAccountPlaceholder } from "@/components/screens/sessions/sessionProposal/AddAccountPlaceholder";
import { ErrorBlockchainSupport } from "@/components/screens/sessions/sessionProposal/ErrorBlockchainSupport";
import { InfoSessionProposal } from "@/components/screens/sessions/sessionProposal/InfoSessionProposal";
import {
  formatUrl,
  getColor,
  getTicker,
  truncate,
} from "@/helpers/helper.util";
import { useProposal } from "@/hooks/useProposal/useProposal";
import { ResponsiveContainer } from "@/styles/styles";
import { Proposal } from "@/types/types";
import { Flex, Button, Box, CryptoIcon, Text } from "@ledgerhq/react-ui";
import {
  WalletConnectMedium,
  CircledCrossSolidMedium,
} from "@ledgerhq/react-ui/assets/icons";
import { space } from "@ledgerhq/react-ui/styles/theme";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Logo } from "@/icons/LedgerLiveLogo";
import styled, { useTheme } from "styled-components";
import useAnalytics from "@/hooks/common/useAnalytics";
import { tryDecodeURI } from "@/shared/helpers/image";
import { sortChains } from "@/hooks/useProposal/util";
import { sessionSelector, useSessionsStore } from "@/storage/sessions.store";

export default function SessionProposal() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [hydrated, setHydrated] = useState(false);
  const proposal = useSessionsStore(sessionSelector.selectProposal);
  const {
    handleClick,
    handleClose,
    approveSession,
    rejectSession,
    formatAccountsByChain,
    accounts,
    selectedAccounts,
    proposer,
    addNewAccount,
  } = useProposal({ proposal });
  const analytics = useAnalytics();
  const dApp = proposer?.metadata?.name ?? "Dapp name undefined";
  const dAppUrl = proposer?.metadata?.url ?? "Dapp url undefined";

  useEffect(() => {
    analytics.page("Wallet Connect Session Request", {
      dapp: dApp,
      url: dAppUrl,
    });
    setHydrated(true);
  }, []);

  const onApprove = () => {
    analytics.track("button_clicked", {
      button: "WC-Connect",
      page: "Wallet Connect Session Request",
      dapp: dApp,
      url: dAppUrl,
    });
    approveSession();
  };

  const onReject = useCallback(() => {
    analytics.track("button_clicked", {
      button: "WC-Reject",
      page: "Wallet Connect Session Request",
      dapp: dApp,
      url: dAppUrl,
    });
    rejectSession();
  }, []);

  const accountsByChain = useMemo(
    () => (proposal ? formatAccountsByChain(proposal, accounts) : []),
    [proposal, accounts]
  );

  const requiredChains = accountsByChain.filter((entry) => entry.isRequired);

  const chainsNotSupported = accountsByChain.filter(
    (entry) => !entry.isSupported
  );

  const noChainsSupported = !accountsByChain.some((entry) => entry.isSupported);

  const everyRequiredChainsSupported = requiredChains.every(
    (entry) => entry.isSupported
  );

  const disabled = !requiredChains.every((entry) =>
    entry.accounts.some((account) => selectedAccounts.includes(account.id))
  );

  const iconProposer = tryDecodeURI(proposer?.metadata?.icons[0] ?? undefined);

  if (!hydrated) {
    return null;
  }

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
              <Header mt={12} mb={10}>
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
                            onClick={() => addNewAccount(entry.chain)}
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
