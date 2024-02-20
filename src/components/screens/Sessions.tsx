import { List, ButtonsContainer } from "@/components/atoms/containers/Elements";
import { GenericRow } from "@/components/atoms/GenericRow";
import { RowType } from "@/components/atoms/types";
import { ImageWithPlaceholder } from "@/components/atoms/images/ImageWithPlaceholder";
import { WalletConnectPopin } from "@/components/atoms/popin/WalletConnectPopin";
import { formatUrl } from "@/utils/helper.util";
import { Flex, Button, Box, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect } from "react";
import useModal from "@/hooks/useModal";
import useAnalytics from "@/hooks/useAnalytics";
import { useNavigate } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { web3walletAtom } from "@/store/web3wallet.store";
import useSessions, { queryKey as sessionsQueryKey } from "@/hooks/useSessions";
import { useQueryClient } from "@tanstack/react-query";
import usePendingProposals from "@/hooks/usePendingProposals";

export default function Sessions() {
  const { t } = useTranslation();
  const navigate = useNavigate({ from: "/" });
  const { openModal, closeModal, isModalOpen } = useModal();
  const queryClient = useQueryClient();
  const web3wallet = useAtomValue(web3walletAtom);
  const sessions = useSessions(web3wallet);
  const pendingProposals = usePendingProposals(web3wallet);
  const sessionsLength = sessions.data.length;
  const isEmptyState = sessionsLength === 0;
  const hasProposals = pendingProposals.data.length > 0;
  const analytics = useAnalytics();

  // TODO look at improving the analytics here maybe
  useEffect(() => {
    analytics.page("Wallet Connect Sessions", {
      isEmptyState,
    });
    analytics.track("equipment_connected", {
      sessionsConnected: sessionsLength,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToConnect = useCallback(() => {
    void navigate({ to: "/connect", search: (search) => search });
    analytics.track("button_clicked", {
      button: "Connect",
      page: "Wallet Connect Sessions",
    });
  }, [analytics, navigate]);

  const goToSessionProposal = useCallback(
    (id: number) => {
      void navigate({
        to: "/proposal/$id",
        params: { id: id.toString() },
        search: (search) => search,
      });
      analytics.track("button_clicked", {
        button: "Session Proposal",
        page: "Wallet Connect Sessions",
      });
    },
    [analytics, navigate],
  );

  const goToDetailSession = useCallback(
    (topic: string) => {
      void navigate({
        to: "/detail/$topic",
        params: { topic },
        search: (search) => search,
      });
      analytics.track("button_clicked", {
        button: "Session Detail",
        page: "Wallet Connect Sessions",
      });
    },
    [analytics, navigate],
  );

  const disconnect = useCallback(() => {
    void Promise.all(
      sessions.data.map((session) =>
        web3wallet.disconnectSession({
          topic: session.topic,
          reason: {
            code: 3,
            message: "Disconnect Session",
          },
        }),
      ),
    )
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        closeModal();
        analytics.track("button_clicked", {
          button: "WC-Disconnect All Sessions",
          page: "Wallet Connect Sessions",
        });
        void queryClient.invalidateQueries({
          queryKey: sessionsQueryKey,
        });
      });
  }, [analytics, closeModal, queryClient, sessions.data, web3wallet]);

  return (
    <Flex flexDirection="column" width="100%" height="100%" mt={8}>
      {hasProposals ? (
        <>
          <Text variant="h3" mb={5} color="neutral.c100">
            {t("sessions.proposals.title")}
          </Text>

          <List>
            {pendingProposals.data.map((proposal) => (
              <Box key={proposal.id} mt={3}>
                <GenericRow
                  key={proposal.id}
                  title={proposal.proposer.metadata.name}
                  subtitle={formatUrl(proposal.proposer.metadata.url)}
                  LeftIcon={
                    <ImageWithPlaceholder
                      icon={proposal.proposer.metadata.icons[0] ?? null}
                    />
                  }
                  rowType={RowType.Detail}
                  onClick={() => goToSessionProposal(proposal.id)}
                />
              </Box>
            ))}
          </List>
          <Flex mb={8} />
        </>
      ) : null}

      <Flex>
        <Text variant="h3" mb={5} color="neutral.c100">
          {t("sessions.title")}
        </Text>
        <Flex flex={1} />
        <Button onClick={goToConnect} variant="main" size="small">
          {t("sessions.goToConnect")}
        </Button>
      </Flex>

      <List>
        {sessions.data.map((session) => (
          <Box key={session.topic} mt={3}>
            <GenericRow
              key={session.topic}
              title={session.peer.metadata.name}
              subtitle={formatUrl(session.peer.metadata.url)}
              LeftIcon={
                <ImageWithPlaceholder
                  icon={session.peer.metadata.icons[0] ?? null}
                />
              }
              rowType={RowType.Detail}
              onClick={() => goToDetailSession(session.topic)}
            />
          </Box>
        ))}
      </List>

      <ButtonsContainer my={6}>
        <Button variant="shade" size="large" flex={1} onClick={openModal}>
          <Text variant="body" fontWeight="semiBold" color="neutral.c100">
            {t("sessions.disconnectAll")}
          </Text>
        </Button>
      </ButtonsContainer>

      <WalletConnectPopin isOpen={isModalOpen} onClose={closeModal}>
        <Flex flexDirection="column" mx={6}>
          <Text variant="h4" color="neutral.c100" mb={10}>
            {t("sessions.modal.title")}
          </Text>

          <Text variant="bodyLineHeight" color="neutral.c70" mb={3}>
            {t("sessions.modal.desc")}
          </Text>

          <ButtonsContainer>
            <Button variant="shade" flex={0.9} mr={6} onClick={closeModal}>
              <Text variant="body" fontWeight="semiBold" color="neutral.c100">
                {t("sessions.modal.cancel")}
              </Text>
            </Button>

            <Button variant="main" flex={0.9} onClick={disconnect}>
              <Text variant="body" fontWeight="semiBold" color="neutral.c00">
                {t("sessions.modal.continue")}
              </Text>
            </Button>
          </ButtonsContainer>
        </Flex>
      </WalletConnectPopin>
    </Flex>
  );
}
