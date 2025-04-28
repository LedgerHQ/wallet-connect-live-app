import { Box, Button, Flex, InfiniteLoader, Text } from "@ledgerhq/react-ui";
import { useCallback, useEffect, useMemo } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { ButtonsContainer, List } from "@/components/atoms/containers/Elements";
import DetailHeader from "@/components/atoms/DetailHeader";
import { ResponsiveContainer } from "@/styles/styles";
import useAnalytics from "@/hooks/useAnalytics";
import { useNavigate } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import useAccounts from "@/hooks/useAccounts";
import {
  walletAPIClientAtom,
  walletCurrenciesByIdAtom,
} from "@/store/wallet-api.store";
import { SessionTypes } from "@walletconnect/types";
import { formatAccountsByChain } from "@/hooks/useProposal/util";
import { AccountRow } from "./sessionProposal/AccountRow";
import { ChainRow } from "./sessionProposal/ChainRow";
import { useSessionDetails } from "@/hooks/useSessionDetails";

type Props = {
  session: SessionTypes.Struct;
};

export default function DetailEdit({ session }: Props) {
  const { t } = useTranslation();
  const { handleClick, confirmEdition, selectedAccounts, updating } =
    useSessionDetails(session);
  const navigate = useNavigate({ from: "/detail/$topic/edit" });
  const client = useAtomValue(walletAPIClientAtom);
  const accounts = useAccounts(client);
  const analytics = useAnalytics();
  const currenciesById = useAtomValue(walletCurrenciesByIdAtom);

  useEffect(() => {
    analytics.page("Wallet Connect Session Detail Edit", {
      dapp: session.peer.metadata.name,
      url: session.peer.metadata.url,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onGoBack = useCallback(() => {
    void navigate({
      to: "/detail/$topic",
      params: { topic: session.topic },
      search: (search) => search,
    });
  }, [navigate, session.topic]);

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
            <DetailHeader session={session} onGoBack={onGoBack} />

            {entries.map((entry) => {
              return (
                <Box key={entry.chain} mb={8}>
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
          </Flex>

          <BlurRow>
            <ButtonsContainer>
              <Button
                variant="neutral"
                size="large"
                flex={0.3}
                mr={6}
                onClick={onGoBack}
              >
                <Text variant="body" fontWeight="semiBold" color="neutral.c100">
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
                    {t("sessions.detail.confirm")}
                  </Text>
                )}
              </Button>
            </ButtonsContainer>
          </BlurRow>
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
