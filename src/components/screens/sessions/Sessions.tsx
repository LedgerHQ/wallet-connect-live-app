import { List, ButtonsContainer } from "@/components/atoms/containers/Elements";
import { GenericRow, RowType } from "@/components/atoms/GenericRow";
import { ImageWithPlaceholder } from "@/components/atoms/images/ImageWithPlaceholder";
import { WalletConnectPopin } from "@/components/atoms/popin/WalletConnectPopin";
import { formatUrl } from "@/helpers/helper.util";
import { web3wallet } from "@/helpers/walletConnect.util";
import { Flex, Button, Box, Text } from "@ledgerhq/react-ui";

import { useTranslation } from "next-i18next";
import { useCallback, useEffect, useMemo } from "react";
import useWalletConnectPopin from "@/hooks/useWalletConnectPopin";

import styled from "styled-components";
import { useSessionsStore, sessionSelector } from "@/storage/sessions.store";
import useAnalytics from "@/hooks/common/useAnalytics";
import { useNavigation } from "@/hooks/common/useNavigation";
import { Routes } from "@/shared/navigation";

export type SessionsProps = {
  goToConnect: () => void;
};

const CustomList = styled(List)``;

export default function Sessions({ goToConnect }: SessionsProps) {
  const { t } = useTranslation();
  const { navigate } = useNavigation();
  const { openModal, closeModal, isModalOpen } = useWalletConnectPopin();
  const clearSessions = useSessionsStore(sessionSelector.clearSessions);
  const sessions = useSessionsStore(sessionSelector.selectSessions);
  const analytics = useAnalytics();

  useEffect(() => {
    analytics.page("Wallet Connect Sessions", {
      isEmptyState,
    });
  }, []);

  useEffect(() => {
    analytics.track("equipment_connected", {
      sessionsConnected: sessions?.length ?? 0,
    });
    analytics.identify();
  }, [sessions?.length]);

  const isEmptyState = useMemo(() => sessions.length === 0, [sessions]);

  const goToDetailSession = (topic: string) => {
    navigate(Routes.SessionDetails, topic);
    analytics.track("button_clicked", {
      button: "Session Detail",
      page: "Wallet Connect Sessions",
    });
  };

  const onGoToConnect = () => {
    analytics.track("button_clicked", {
      button: "Connect",
      page: "Wallet Connect Sessions",
    });
    goToConnect();
  };

  const disconnect = useCallback(async () => {
    await Promise.all(
      sessions.map((session) =>
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
        clearSessions();
        closeModal();
      });
    analytics.track("button_clicked", {
      button: "WC-Disconnect All Sessions",
      page: "Wallet Connect Sessions",
    });
  }, [sessions]);

  if (isEmptyState) {
    return (
      <Flex
        flexDirection="column"
        width="100%"
        height="100%"
        alignItems="center"
        justifyContent="center"
        my={6}
      >
        <Text variant="h2" fontWeight="medium" textAlign="center">
          {t("sessions.emptyState.title")}
        </Text>
        <Text
          variant="bodyLineHeight"
          fontWeight="medium"
          color="neutral.c80"
          mt={6}
          textAlign="center"
        >
          {t("sessions.emptyState.desc")}
        </Text>
        <Button variant="main" size="large" mt={10} onClick={onGoToConnect}>
          <Text variant="body" fontWeight="semiBold" color="neutral.c00">
            {t("sessions.emptyState.goToConnect")}
          </Text>
        </Button>
      </Flex>
    );
  }

  return (
    <Flex flexDirection="column" width="100%" height="100%" mt={6}>
      <CustomList>
        {sessions.map((session) => (
          <Box key={session.topic} mt={3}>
            <GenericRow
              key={session.topic}
              title={session.peer.metadata.name}
              subtitle={formatUrl(session.peer.metadata.url)}
              LeftIcon={<ImageWithPlaceholder icon={session.peer.metadata.icons[0] ?? null} />}
              rowType={RowType.Detail}
              onClick={() => goToDetailSession(session.topic)}
            />
          </Box>
        ))}
      </CustomList>

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
