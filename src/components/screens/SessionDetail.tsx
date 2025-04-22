import { formatUrl, truncate, getDisplayName } from "@/utils/helper.util";
import {
  Box,
  Button,
  CryptoIcon,
  Flex,
  InfiniteLoader,
  Text,
} from "@ledgerhq/react-ui";
import { ArrowLeftMedium } from "@ledgerhq/react-ui/assets/icons";
import { useCallback, useEffect, useMemo } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Account } from "@ledgerhq/wallet-api-client";
import { GenericRow } from "@/components/atoms/GenericRow";
import { RowType } from "@/components/atoms/types";
import { InfoSessionProposal } from "@/components/screens/sessionProposal/InfoSessionProposal";
import {
  ButtonsContainer,
  List,
  ListItem,
  Row,
} from "@/components/atoms/containers/Elements";
import { ResponsiveContainer } from "@/styles/styles";
import { ImageWithPlaceholder } from "@/components/atoms/images/ImageWithPlaceholder";
import useAnalytics from "@/hooks/useAnalytics";
import { useNavigate } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import useAccounts from "@/hooks/useAccounts";
import {
  walletAPIClientAtom,
  walletCurrenciesByIdAtom,
} from "@/store/wallet-api.store";
import { SessionTypes } from "@walletconnect/types";
import { AccountBalance } from "../atoms/AccountBalance";
import { formatAccountsByChain } from "@/hooks/useProposal/util";
import { AccountRow } from "./sessionProposal/AccountRow";
import { ChainRow } from "./sessionProposal/ChainRow";
import { useSessionDetails } from "@/hooks/useSessionDetails";

const DetailContainer = styled(Flex)`
  border-radius: 12px;
  background-color: ${(props) => props.theme.colors.neutral.c20};
  padding: 12px;
  flex-direction: column;
`;
const BackButton = styled(Flex)`
  cursor: pointer;
  &:hover {
    opacity: 0.7;
  }
`;

const CustomList = styled(Flex)`
  flex-direction: column;
`;

type Props = {
  session: SessionTypes.Struct;
};

export default function SessionDetail({ session }: Props) {
  const { t } = useTranslation();
  const {
    handleClick,
    confirmEdition,
    selectedAccounts,
    sessionAccounts,
    editingSession,
    setEditingSession,
    mainAccount,
    handleSwitch,
    updating,
    handleDelete,
    disconnecting,
  } = useSessionDetails(session);
  const navigate = useNavigate({ from: "/detail/$topic" });
  const client = useAtomValue(walletAPIClientAtom);
  const accounts = useAccounts(client);
  const analytics = useAnalytics();
  const currenciesById = useAtomValue(walletCurrenciesByIdAtom);

  useEffect(() => {
    analytics.page("Wallet Connect Session Detail", {
      dapp: session.peer.metadata.name,
      url: session.peer.metadata.url,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigateToHome = useCallback(() => {
    return navigate({
      to: "/",
      search: (search) => search,
    });
  }, [navigate]);

  const onGoBack = useCallback(() => {
    void navigateToHome();
    analytics.track("button_clicked", {
      button: "WC-Back",
      page: "Wallet Connect Session Detail",
    });
  }, [analytics, navigateToHome]);

  const metadata = session.peer.metadata;

  const accountsByChain = useMemo(
    () => formatAccountsByChain(session, accounts.data),
    [session, accounts],
  );

  const entries = useMemo(() => {
    return accountsByChain
      .filter((entry) => entry.isSupported)
      .filter((entry) => entry.accounts.length > 0);
  }, [accountsByChain]);

  return (
    <Flex
      flex={1}
      alignItems="center"
      justifyContent="center"
      width="100%"
      height="auto"
    >
      <ResponsiveContainer>
        <Flex
          width="100%"
          height="100%"
          flex={1}
          flexDirection="column"
          alignItems="center"
          justifyContent="space-between"
        >
          <Flex flexDirection="column" width="100%">
            <Flex mt={8} mb={8} alignItems="center">
              <BackButton onClick={onGoBack}>
                <ArrowLeftMedium size={24} color="neutral.c100" />
              </BackButton>

              <Text variant="h3" ml={5} color="neutral.c100">
                {t("sessions.detail.title")}
              </Text>
            </Flex>

            <DetailContainer>
              <Row justifyContent="space-between" alignItems="center">
                <Flex
                  flexDirection="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <ImageWithPlaceholder icon={metadata.icons[0]} />

                  <Flex flexDirection="column" ml={5}>
                    <Text
                      variant="body"
                      fontWeight="semiBold"
                      color="neutral.c100"
                    >
                      {metadata.name}
                    </Text>

                    <Text
                      variant="small"
                      fontWeight="medium"
                      color="neutral.c70"
                      mt={1}
                    >
                      {formatUrl(metadata.url)}
                    </Text>
                  </Flex>
                </Flex>
              </Row>

              <Row mt={10} justifyContent="space-between" alignItems="center">
                <Text variant="small" fontWeight="medium" color="neutral.c100">
                  {t("sessions.detail.connected")}
                </Text>

                <Text variant="small" fontWeight="medium" color="neutral.c70">
                  {new Date().toDateString()}
                </Text>
              </Row>
              <Row mt={6} justifyContent="space-between" alignItems="center">
                <Text variant="small" fontWeight="medium" color="neutral.c100">
                  {t("sessions.detail.expires")}
                </Text>
                <Text variant="small" fontWeight="medium" color="neutral.c70">
                  {
                    //https://stackoverflow.com/a/37001827
                    new Date(session.expiry * 1000).toDateString()
                  }
                </Text>
              </Row>
            </DetailContainer>

            {editingSession &&
              entries.map((entry) => {
                return (
                  <Box key={entry.chain} mb={8}>
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

            {!editingSession && sessionAccounts.length > 0 && (
              <>
                <Flex
                  flexDirection="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mt={4}
                >
                  <Text variant="h4" color="neutral.c100">
                    {t("sessions.detail.accounts")}
                  </Text>
                  {!editingSession && (
                    <Flex>
                      <ButtonsContainer>
                        <Button
                          variant="shade"
                          size="medium"
                          flex={1}
                          onClick={() => setEditingSession(true)}
                        >
                          <Text
                            variant="small"
                            fontWeight="semiBold"
                            color="neutral.c100"
                          >
                            Edit session
                          </Text>
                        </Button>
                      </ButtonsContainer>
                    </Flex>
                  )}
                </Flex>

                <CustomList>
                  {sessionAccounts.map(([chain, accounts]) => {
                    return (
                      <Box key={chain} mb={6} flex={1}>
                        <Box mb={6}>
                          <Text variant="subtitle" color="neutral.c70">
                            {getDisplayName(chain)}
                          </Text>
                        </Box>

                        <List>
                          {accounts.map((account: Account) => {
                            const currency = currenciesById[account.currency];

                            return (
                              <ListItem key={account.id}>
                                <GenericRow
                                  isSelected={mainAccount?.id === account.id}
                                  onClick={() => void handleSwitch(account)}
                                  title={account.name}
                                  subtitle={truncate(account.address, 10)}
                                  rightElement={AccountBalance({
                                    account,
                                    currency,
                                  })}
                                  RightIcon={
                                    <CryptoIcon
                                      name={currency.ticker}
                                      circleIcon
                                      size={12}
                                      color={currency.color}
                                    />
                                  }
                                  rowType={RowType.Switch}
                                />
                              </ListItem>
                            );
                          })}
                        </List>
                      </Box>
                    );
                  })}

                  <Box mt={6}>
                    <InfoSessionProposal isInSessionDetails />
                  </Box>
                </CustomList>
              </>
            )}
          </Flex>

          {!editingSession && (
            <ButtonsContainer mt={5}>
              <Button
                variant="shade"
                size="large"
                flex={1}
                onClick={handleDelete}
                disabled={disconnecting}
              >
                {disconnecting ? (
                  <InfiniteLoader size={20} />
                ) : (
                  <Text
                    variant="body"
                    fontWeight="semiBold"
                    color="neutral.c100"
                  >
                    {t("sessions.detail.disconnect")}
                  </Text>
                )}
              </Button>
            </ButtonsContainer>
          )}

          {editingSession && (
            <BlurRow>
              <ButtonsContainer>
                <Button
                  variant="neutral"
                  size="large"
                  flex={0.3}
                  mr={6}
                  onClick={() => setEditingSession(false)}
                >
                  <Text
                    variant="body"
                    fontWeight="semiBold"
                    color="neutral.c100"
                  >
                    {t("sessions.modal.cancel")}
                  </Text>
                </Button>
                <Button
                  variant="main"
                  size="large"
                  flex={0.9}
                  onClick={() => void confirmEdition()}
                >
                  {updating ? (
                    <InfiniteLoader size={20} />
                  ) : (
                    <Text
                      variant="body"
                      fontWeight="semiBold"
                      color={"neutral.c00"}
                    >
                      Confirm
                    </Text>
                  )}
                </Button>
              </ButtonsContainer>
            </BlurRow>
          )}
        </Flex>
      </ResponsiveContainer>
    </Flex>
  );
}

const BlurRow = styled(Flex)`
  width: 100%;
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
