import { truncate, getDisplayName } from "@/utils/helper.util";
import {
  Box,
  Button,
  CryptoIcon,
  Flex,
  InfiniteLoader,
  Text,
} from "@ledgerhq/react-ui";
import { useCallback, useEffect } from "react";
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
} from "@/components/atoms/containers/Elements";
import { ResponsiveContainer } from "@/styles/styles";
import useAnalytics from "@/hooks/useAnalytics";
import { useNavigate } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { walletCurrenciesByIdAtom } from "@/store/wallet-api.store";
import { SessionTypes } from "@walletconnect/types";
import { AccountBalance } from "../atoms/AccountBalance";
import { useSessionDetails } from "@/hooks/useSessionDetails";
import DetailHeader from "../atoms/DetailHeader";

const CustomList = styled(Flex)`
  flex-direction: column;
`;

type Props = {
  session: SessionTypes.Struct;
};

export default function SessionDetail({ session }: Props) {
  const { t } = useTranslation();
  const {
    sessionAccounts,
    mainAccount,
    handleSwitch,
    handleDelete,
    disconnecting,
  } = useSessionDetails(session);
  const navigate = useNavigate({ from: "/detail/$topic" });
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

  const navigateToEdit = useCallback(() => {
    return navigate({
      to: "/detail/$topic/edit",
      params: { topic: session.topic },
      search: (search) => search,
    });
  }, [navigate, session.topic]);

  const onGoBack = useCallback(() => {
    void navigateToHome();
    analytics.track("button_clicked", {
      button: "WC-Back",
      page: "Wallet Connect Session Detail",
    });
  }, [analytics, navigateToHome]);

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
            <DetailHeader session={session} onGoBack={onGoBack} />

            {sessionAccounts.length > 0 ? (
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

                  <Flex>
                    <ButtonsContainer>
                      <Button
                        variant="shade"
                        size="medium"
                        flex={1}
                        onClick={() => void navigateToEdit()}
                      >
                        <Text
                          variant="small"
                          fontWeight="semiBold"
                          color="neutral.c100"
                        >
                          {t("sessions.detail.editSession")}
                        </Text>
                      </Button>
                    </ButtonsContainer>
                  </Flex>
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
                                  rowType={RowType.Toggle}
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
