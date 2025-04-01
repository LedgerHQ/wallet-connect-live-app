import { ButtonsContainer, List } from "@/components/atoms/containers/Elements";
import { GenericRow } from "@/components/atoms/GenericRow";
import { ImageWithPlaceholder } from "@/components/atoms/images/ImageWithPlaceholder";
import { WalletConnectPopin } from "@/components/atoms/popin/WalletConnectPopin";
import { RowType } from "@/components/atoms/types";
import useAnalytics from "@/hooks/useAnalytics";
import useModal from "@/hooks/useModal";
import usePendingProposals from "@/hooks/usePendingProposals";
import useSessions, { queryKey as sessionsQueryKey } from "@/hooks/useSessions";
import { sortedRecentConnectionAppsAtom } from "@/store/recentConnectionAppsAtom";
import { walletKitAtom } from "@/store/walletKit.store";
import { formatUrl, getErrorMessage } from "@/utils/helper.util";
import { Box, Button, Flex, Text } from "@ledgerhq/react-ui";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { enqueueSnackbar } from "notistack";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ProposalRow from "../ProposalRow";
import RecentlyUsedApps from "./RecentlyUsedApps";
import SuggestedApps from "./SuggestedApps";

export default function Sessions() {
  const { t } = useTranslation();
  const navigate = useNavigate({ from: "/" });
  const { openModal, closeModal, isModalOpen } = useModal();
  const queryClient = useQueryClient();
  const walletKit = useAtomValue(walletKitAtom);
  const sessions = useSessions(walletKit);
  const pendingProposals = usePendingProposals(walletKit);
  const sessionsLength = sessions.data.length;
  const isEmptyState = sessionsLength === 0;
  const hasProposals = pendingProposals.data.length > 0;
  const analytics = useAnalytics();
  const lastConnectionApps = useAtomValue(sortedRecentConnectionAppsAtom);

  // TODO look at improving the analytics here maybe
  useEffect(() => {
    analytics.page("Wallet Connect Sessions", {
      isEmptyState,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    analytics.track("equipment_connected", {
      sessionsConnected: sessionsLength,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionsLength]);

  const goToConnect = useCallback(() => {
    void navigate({ to: "/connect", search: (search) => search });
    analytics.track("button_clicked", {
      button: "Connect",
      page: "Wallet Connect Sessions",
    });
  }, [analytics, navigate]);

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
        walletKit.disconnectSession({
          topic: session.topic,
          reason: {
            code: 3,
            message: "Disconnect Session",
          },
        }),
      ),
    )
      .catch((err) => {
        enqueueSnackbar(getErrorMessage(err), {
          errorType: "Disconnect sessions error",
          variant: "errorNotification",
          anchorOrigin: {
            vertical: "top",
            horizontal: "right",
          },
        });
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
  }, [analytics, closeModal, queryClient, sessions.data, walletKit]);

  return (
    <Flex flexDirection="column" width="100%" height="100%" mt={8}>
      {hasProposals ? (
        <>
          <Text variant="h3Inter" mb={5} color="neutral.c100">
            {t("sessions.title")}
          </Text>
          <Text variant="extraSmall" color="neutral.c70">
            {t("sessions.proposals.title")}
          </Text>

          <List>
            {pendingProposals.data.map((proposal) => (
              <ProposalRow key={proposal.id} proposal={proposal} />
            ))}
          </List>
          <Flex mb={8} />
        </>
      ) : null}

      {!isEmptyState && (
        <>
          <Text variant="extraSmall" color="neutral.c70">
            {t("sessions.apps.title")}
          </Text>
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
        </>
      )}

      {!hasProposals && isEmptyState ? (
        <>
          <Flex flexDirection={"column"} rowGap={8}>
            <Text
              justifyContent="center"
              variant="h4Inter"
              color="neutral.c100"
              textAlign="center"
            >
              {t("connect.title")}
            </Text>
            <Text
              fontSize={7}
              display="flex"
              justifyContent="center"
              variant="extraSmall"
              color="neutral.c70"
              textAlign="center"
            >
              {t("sessions.apps.noAppsMessage")}
            </Text>
          </Flex>
        </>
      ) : null}

      <ButtonsContainer marginTop={2} columnGap={6}>
        {!isEmptyState ? (
          <Button variant="shade" size="medium" flex={1} onClick={openModal}>
            <Text variant="body" fontWeight="semiBold" color="neutral.c100">
              {t("sessions.disconnectAll")}
            </Text>
          </Button>
        ) : null}

        <Button variant="main" size="medium" flex={1} onClick={goToConnect}>
          <Text variant="body" fontWeight="semiBold" color="neutral.c0">
            {t("connect.cta")}
          </Text>
        </Button>
      </ButtonsContainer>

      {lastConnectionApps.length > 1 && (
        <Flex flexDirection={"column"} marginTop={6}>
          <RecentlyUsedApps />
        </Flex>
      )}
      <Flex flexDirection={"column"} marginTop={6}>
        <SuggestedApps />
      </Flex>

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
