import styled from "styled-components";
import { Input, Button, Text, Flex } from "@ledgerhq/react-ui";
import { useCallback, useEffect, useState } from "react";
import { PasteMedium, QrCodeMedium } from "@ledgerhq/react-ui/assets/icons";
import { QRScanner } from "../QRScanner";
import { useTranslation } from "react-i18next";
import useAnalytics from "@/hooks/useAnalytics";
import { useNavigate } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { coreAtom } from "@/storage/web3wallet.store";
import { InputMode } from "@/types/types";

const QRScannerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  height: 280px;
  width: 280px;
  border: ${(p) => `1px solid ${p.theme.colors.neutral.c100}`};
  border-radius: ${(p) => p.theme.space[8]}px;
`;

const QrCodeButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 8px;
  margin-right: 8px;
  &:disabled {
    color: ${(p) => p.theme.colors.neutral.c50};
    cursor: unset;
  }
`;

type Props = {
  mode?: InputMode;
  initialURI?: string;
};

export function Connect({ mode, initialURI }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState<string>("");
  const [errorValue, setErrorValue] = useState<string | undefined>(undefined);
  const [scanner, setScanner] = useState(mode === "scan");
  const analytics = useAnalytics();

  const isRunningInAndroidWebview =
    navigator.userAgent?.includes("; wv") &&
    navigator.userAgent?.includes("Android");

  const core = useAtomValue(coreAtom);

  const startProposal = useCallback(
    (uri: string) => {
      try {
        const url = new URL(uri);

        switch (url.protocol) {
          // handle usual wallet connect URIs
          case "wc:": {
            return core.pairing.pair({ uri });
          }

          // handle Ledger Live specific URIs
          case "ledgerlive:": {
            const uriParam = url.searchParams.get("uri");

            if (url.pathname === "//wc" && uriParam) {
              return startProposal(uriParam);
            }
            break;
          }
        }
      } catch (error) {
        // bad urls are just ignored
        if (error instanceof TypeError) {
          return;
        }
        throw error;
      }
    },
    [core]
  );

  const onConnect = useCallback(
    async (inputValue: URL) => {
      try {
        const uri = inputValue.toString();
        await navigate({
          params: (params) => params,
          search: (search) => ({ ...search, uri: inputValue }),
        });
        if (uri.includes("@1")) {
          await navigate({
            to: "/protocol-not-supported",
            search: (search) => search,
          });
        } else {
          await startProposal(uri);
        }
      } catch (error: unknown) {
        console.error(error);
      } finally {
        await navigate({
          params: (params) => params,
          search: (search) => ({ ...search, uri: undefined }),
        });
      }
    },
    [navigate, startProposal]
  );

  const handleConnect = useCallback(() => {
    try {
      const uri = new URL(inputValue);
      setInputValue("");

      void onConnect(uri);
      analytics.track("button_clicked", {
        button: "WC-Connect",
        page: "Connect",
      });
    } catch (error) {
      setErrorValue(t("error.invalidUri"));
    }
  }, [inputValue, onConnect, analytics, t]);

  const startScanning = useCallback(() => {
    setScanner(true);
    analytics.track("button_clicked", {
      button: "WC-Scan QR Code",
      page: "Connect",
    });
  }, [analytics]);

  useEffect(() => {
    if (initialURI) {
      try {
        const uri = new URL(initialURI);

        void onConnect(uri);
      } catch (error) {
        setErrorValue(t("error.invalidUri"));
      }
    }
    analytics.page("Wallet Connect");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialURI]);

  const handlePasteClick = useCallback(() => {
    navigator.clipboard.readText().then((text) => {
      setInputValue(text);
      analytics.track("button_clicked", {
        button: "WC-Paste Url",
        page: "Connect",
      });
    }, console.error);
  }, [analytics]);

  // TODO improve looks like we have some duplication of logic
  const tryConnect = useCallback(
    (rawURI: string) => {
      try {
        const url = new URL(rawURI);

        switch (url.protocol) {
          // handle usual wallet connect URIs
          case "wc:": {
            void onConnect(url);
            break;
          }

          // handle Ledger Live specific URIs
          case "ledgerlive:": {
            const uriParam = url.searchParams.get("uri");

            if (url.pathname === "//wc" && uriParam) {
              tryConnect(uriParam);
            }
            break;
          }
        }
      } catch (error) {
        // bad urls are just ignored
        if (error instanceof TypeError) {
          return;
        }
        throw error;
      }
    },
    [onConnect]
  );

  return (
    <Flex
      flexDirection="column"
      width="100%"
      height="100%"
      justifyContent="space-between"
    >
      <Flex justifyContent="center" width="100%" my={14}>
        <QRScannerContainer>
          {scanner ? (
            <QRScanner onQRScan={tryConnect} />
          ) : (
            <>
              <QrCodeMedium size={32} color="neutral.c100" />
              <Flex position="absolute" bottom={6}>
                <Button
                  onClick={startScanning}
                  data-testid="scan-button"
                  variant="main"
                  size="medium"
                >
                  <Text
                    fontSize="body"
                    fontWeight="semiBold"
                    color="neutral.c00"
                  >
                    {t("connect.scanQRCode")}
                  </Text>
                </Button>
              </Flex>
            </>
          )}
        </QRScannerContainer>
      </Flex>
      <Flex flexDirection="column" width="100%" mb={6}>
        <Text
          variant="paragraph"
          fontWeight="medium"
          color="neutral.c100"
          mb={6}
          textAlign="center"
        >
          {t("connect.useWalletConnectUrl")}
        </Text>
        <Input
          value={inputValue}
          onChange={setInputValue}
          error={errorValue}
          data-testid="input-uri"
          renderRight={
            !isRunningInAndroidWebview ? (
              <QrCodeButton onClick={handlePasteClick} data-test="copy-button">
                <PasteMedium size={18} color="neutral.c100" />
              </QrCodeButton>
            ) : null
          }
          placeholder={t("connect.pasteUrl")}
        />
        <Button
          mt={6}
          onClick={handleConnect}
          data-testid="connect-button"
          variant="main"
          size="large"
          disabled={!inputValue}
        >
          <Text
            fontSize="body"
            fontWeight="semiBold"
            color={!inputValue ? "neutral.c50" : "neutral.c00"}
          >
            {t("connect.cta")}
          </Text>
        </Button>
      </Flex>
    </Flex>
  );
}
