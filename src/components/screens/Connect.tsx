import styled from "styled-components";
import {
  Input,
  Button,
  Text,
  Flex,
  BoxedIcon,
  Icons,
  InfiniteLoader,
} from "@ledgerhq/react-ui";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeftMedium,
  PasteMedium,
  QrCodeMedium,
} from "@ledgerhq/react-ui/assets/icons";
import { QRScanner } from "../QRScanner";
import { useTranslation } from "react-i18next";
import useAnalytics from "@/hooks/useAnalytics";
import { useNavigate } from "@tanstack/react-router";
import { WalletConnectContainer } from "../atoms/containers/Elements";
import { Dot, DotContainer, ResponsiveContainer } from "@/styles/styles";
import { useConnect } from "@/hooks/useConnect";
import { InputMode } from "@/types/types";
import { useAtomValue } from "jotai";
import {
  relayerConnectionStatusAtom,
  web3walletAtom,
} from "@/store/web3wallet.store";
import usePendingProposals from "@/hooks/usePendingProposals";
import useSessions from "@/hooks/useSessions";
import "./status.css";
import { StatusDot } from "../atoms/statusDot/StatusDot";

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

const BackButton = styled(Flex)`
  cursor: pointer;
  &:hover {
    opacity: 0.7;
  }
`;

const isRunningInAndroidWebview =
  navigator.userAgent.includes("; wv") &&
  navigator.userAgent.includes("Android");

type Props = {
  mode?: InputMode;
};

export function Connect({ mode }: Props) {
  const navigate = useNavigate({ from: "/connect" });
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState<string>("");
  const [errorValue, setErrorValue] = useState<string | undefined>(undefined);
  const [scanner, setScanner] = useState(mode === "scan");
  const analytics = useAnalytics();
  const web3wallet = useAtomValue(web3walletAtom);
  const relayerConnectionStatus = useAtomValue(relayerConnectionStatusAtom);
  const pendingProposals = usePendingProposals(web3wallet);
  const sessions = useSessions(web3wallet);
  const showBackButton = pendingProposals.data.length || sessions.data.length;

  const { onConnect } = useConnect();

  // useEffect(() => {
  //   console.log({ web3wallet });
  //   web3wallet.core.relayer.on("connect", () => {
  //     console.log("[Connect.tsx] useEffect - Connected");
  //   });

  //   web3wallet.core.relayer.on("disconnect", () => {
  //     console.log("[Connect.tsx] useEffect - Disconnected");
  //   });

  //   web3wallet.core.relayer.on("relayer_connect", () => {
  //     // connection to the relay server is established
  //     console.log("[Connect.tsx] useEffect - relayer_connect");
  //   });

  //   web3wallet.core.relayer.on("relayer_disconnect", () => {
  //     // connection to the relay server is established
  //     console.log("[Connect.tsx] useEffect - relayer_disconnect");
  //   });
  // }, []);

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

  const handlePasteClick = useCallback(() => {
    navigator.clipboard.readText().then((text) => {
      setInputValue(text);
      analytics.track("button_clicked", {
        button: "WC-Paste Url",
        page: "Connect",
      });
    }, console.error);
  }, [analytics]);

  // TODO improve looks like we have some duplication of logic with onConnect
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
    [onConnect],
  );

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

  return (
    <WalletConnectContainer>
      <ResponsiveContainer>
        <Flex mt={8} width="100%" alignItems="center">
          {showBackButton ? (
            <BackButton onClick={onGoBack}>
              <ArrowLeftMedium size={24} color="neutral.c100" />
            </BackButton>
          ) : null}

          <Text
            display="flex"
            flexGrow={1}
            justifyContent="center"
            variant="h3"
            color="neutral.c100"
            // Add margin to center the text when the back button is present
            mr={showBackButton ? 8 : undefined}
          >
            {t("connect.title")}
          </Text>
        </Flex>
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
          <Text
            variant="paragraph"
            fontWeight="medium"
            color="neutral.c100"
            mb={6}
            textAlign="center"
          >
            Connected ? {JSON.stringify(web3wallet.core.relayer.connected)}
          </Text>
          <Text
            variant="paragraph"
            fontWeight="medium"
            color="neutral.c100"
            mb={6}
            textAlign="center"
          >
            Connectingo ? {JSON.stringify(web3wallet.core.relayer.connecting)}
          </Text>
          <InfiniteLoader size={10} color="warning.c20" />
          <DotContainer>
            <InfiniteLoader
              size={10}
              style={{ marginRight: "5px" }}
              color="warning.c50"
            />
            <Text
              variant="paragraph"
              fontWeight="medium"
              color="warning.c50"
              textAlign="center"
            >
              Connecting
            </Text>
          </DotContainer>
          <DotContainer>
            <Flex style={{ display: "flex", alignItems: "center" }}>
              <Text
                fontWeight="small"
                fontSize={"8px"}
                color="error.c50"
                marginRight={2}
              >
                ●
              </Text>
              <Dot />
              <Text
                variant="paragraph"
                fontWeight="medium"
                color="error.c50"
                textAlign="center"
              >
                Disconnected
              </Text>
            </Flex>
          </DotContainer>
          <DotContainer>
            {web3wallet.core.relayer.connecting ? (
              <InfiniteLoader size={10} color="warning.c20" />
            ) : (
              <Dot />
            )}
            TOTO
          </DotContainer>
          <ul>
            <li className="status open">
              <Text>Connectedo</Text>
            </li>
            <li className="status in-progress">In Progress</li>
            <li className="status dead">Dead</li>
          </ul>
          {web3wallet.core.relayer.connected ? (
            <StatusDot status="success">Connected</StatusDot>
          ) : web3wallet.core.relayer.connecting ? (
            <StatusDot status="loading">
              Connecting to wallet connect servers
            </StatusDot>
          ) : (
            <StatusDot status="error">No internet connection</StatusDot>
          )}

          <BoxedIcon
            Icon={Icons.NetworkWarning}
            iconColor={"white"}
            size={64}
            variant="circle"
            borderColor="transparent"
          />
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
                  <QrCodeButton
                    onClick={handlePasteClick}
                    data-test="copy-button"
                  >
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
      </ResponsiveContainer>
    </WalletConnectContainer>
  );
}
