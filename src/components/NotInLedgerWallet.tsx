import { Button, Flex, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { useCallback } from "react";
import styled from "styled-components";
import { Logo } from "@/icons/LedgerLiveLogo";
import { DOWNLOAD_URL, getOpenInLedgerWalletUrl } from "@/utils/ledgerWallet";

const LogoContainer = styled(Flex)`
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  background-color: ${(p) => p.theme.colors.neutral.c100};
  color: ${(p) => p.theme.colors.neutral.c00};
  height: 50px;
  width: 50px;
`;

// NOTE: must not use `useAnalytics` here, it waits on wallet-api infos that never resolve outside Ledger Wallet
export function NotInLedgerWallet() {
  const { t } = useTranslation();

  const openInLedgerWallet = useCallback(() => {
    window.location.assign(getOpenInLedgerWalletUrl(window.location.search));
  }, []);

  const download = useCallback(() => {
    window.open(DOWNLOAD_URL, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      flex={1}
      data-testid="not-in-ledger-wallet-container"
    >
      <LogoContainer data-testid="not-in-ledger-wallet-logo">
        <Logo size={24} color="currentColor" />
      </LogoContainer>
      <Text
        variant="h4"
        fontWeight="medium"
        color="neutral.c100"
        mt={10}
        textAlign="center"
        data-testid="not-in-ledger-wallet-title"
      >
        {t("notInLedgerWallet.title")}
      </Text>
      <Text
        variant="bodyLineHeight"
        fontWeight="medium"
        color="neutral.c80"
        mt={10}
        textAlign="center"
        data-testid="not-in-ledger-wallet-subtitle"
      >
        {t("notInLedgerWallet.desc")}
      </Text>
      <Flex flexDirection="column" width="100%" maxWidth="400px" mt={12}>
        <Button
          variant="main"
          size="large"
          onClick={openInLedgerWallet}
          data-testid="not-in-ledger-wallet-open"
        >
          {t("notInLedgerWallet.open")}
        </Button>
        <Button
          variant="shade"
          outline
          size="large"
          mt={4}
          onClick={download}
          data-testid="not-in-ledger-wallet-download"
        >
          {t("notInLedgerWallet.download")}
        </Button>
      </Flex>
    </Flex>
  );
}
