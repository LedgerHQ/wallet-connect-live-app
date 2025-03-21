import {
  getCurrencyByChainId,
  formatUrl,
  truncate,
  getDisplayName,
} from "@/utils/helper.util";
import {
  Box,
  Button,
  CryptoIcon,
  Flex,
  InfiniteLoader,
  Text,
} from "@ledgerhq/react-ui";
import { enqueueSnackbar } from "notistack";
import { ArrowLeftMedium } from "@ledgerhq/react-ui/assets/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { walletKitAtom } from "@/store/walletKit.store";
import { queryKey as sessionsQueryKey } from "@/hooks/useSessions";
import useAccounts from "@/hooks/useAccounts";
import {
  walletAPIClientAtom,
  walletCurrenciesByIdAtom,
} from "@/store/wallet-api.store";
import { useQueryClient } from "@tanstack/react-query";
import { SessionTypes } from "@walletconnect/types";
import { getErrorMessage } from "@/utils/helper.util";
import { AccountBalance } from "../atoms/AccountBalance";

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

const getAccountsFromAddresses = (addresses: string[], accounts: Account[]) => {
  const accountsByChain = new Map<string, Account[]>();

  addresses.forEach((addr) => {
    const addrSplitted = addr.split(":");
    const chain = getCurrencyByChainId(`${addrSplitted[0]}:${addrSplitted[1]}`);
    let chainInLedgerLive = chain;

    if (chain.startsWith("mvx")) {
      chainInLedgerLive = "elrond";
    }

    if (chain.startsWith("xrpl")) {
      chainInLedgerLive = "ripple";
    }

    const existingEntry = accountsByChain.get(chainInLedgerLive);

    const account = accounts.find(
      (a) => a.address === addrSplitted[2] && chainInLedgerLive === a.currency,
    );

    if (account) {
      accountsByChain.set(
        chain,
        existingEntry ? [...existingEntry, account] : [account],
      );
    }
  });
  return Array.from(accountsByChain);
};

type Props = {
  session: SessionTypes.Struct;
};

export default function SessionDetail({ session }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate({ from: "/detail/$topic" });
  const queryClient = useQueryClient();
  const client = useAtomValue(walletAPIClientAtom);
  const accounts = useAccounts(client);
  const walletKit = useAtomValue(walletKitAtom);
  const analytics = useAnalytics();
  const currenciesById = useAtomValue(walletCurrenciesByIdAtom);
  const [disconnecting, setDisconnecting] = useState(false);

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

  const handleDelete = useCallback(() => {
    setDisconnecting(true);
    void walletKit
      .disconnectSession({
        topic: session.topic,
        reason: {
          code: 3,
          message: "Disconnect Session",
        },
      })
      .then(() => {
        analytics.track("button_clicked", {
          button: "WC-Disconnect Session",
          page: "Wallet Connect Session Detail",
        });
        void queryClient
          .invalidateQueries({ queryKey: sessionsQueryKey })
          .then(() => navigateToHome());
      })
      .catch((error) => {
        setDisconnecting(false);
        enqueueSnackbar(getErrorMessage(error), {
          errorType: "Disconnect session error",
          variant: "errorNotification",
          anchorOrigin: {
            vertical: "top",
            horizontal: "right",
          },
        });
        console.error(error);
        void queryClient.invalidateQueries({
          queryKey: sessionsQueryKey,
        });
      });
  }, [analytics, navigateToHome, queryClient, session, walletKit]);

  const onGoBack = useCallback(() => {
    void navigateToHome();
    analytics.track("button_clicked", {
      button: "WC-Back",
      page: "Wallet Connect Session Detail",
    });
  }, [analytics, navigateToHome]);

  const metadata = session.peer.metadata;
  const fullAddresses = useMemo(
    () =>
      Object.entries(session.namespaces).reduce(
        (acc, elem) => acc.concat(elem[1].accounts),
        [] as string[],
      ),
    [session],
  );

  const sessionAccounts = useMemo(
    () => getAccountsFromAddresses(fullAddresses, accounts.data),
    [accounts.data, fullAddresses],
  );

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

            {sessionAccounts.length > 0 ? (
              <>
                <Text variant="h4" mt={8} mb={6} color="neutral.c100">
                  {t("sessions.detail.accounts")}
                </Text>
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
                                  rowType={RowType.Default}
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
            ) : null}
          </Flex>
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
                <Text variant="body" fontWeight="semiBold" color="neutral.c100">
                  {t("sessions.detail.disconnect")}
                </Text>
              )}
            </Button>
          </ButtonsContainer>
        </Flex>
      </ResponsiveContainer>
    </Flex>
  );
}
