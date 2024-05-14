import { ButtonsContainer, List } from "@/components/atoms/containers/Elements";
import { GenericRow } from "@/components/atoms/GenericRow";
import { RowType } from "@/components/atoms/types";
import LogoContainer from "@/components/atoms/logoContainers/LedgerLogoContainer";
import { AddAccountPlaceholder } from "@/components/screens/sessionProposal/AddAccountPlaceholder";
import { ErrorBlockchainSupport } from "@/components/screens/sessionProposal/ErrorBlockchainSupport";
import { InfoSessionProposal } from "@/components/screens/sessionProposal/InfoSessionProposal";
import { formatUrl } from "@/utils/helper.util";
import { useProposal } from "@/hooks/useProposal/useProposal";
import { ResponsiveContainer } from "@/styles/styles";
import { Flex, Button, Box, Text } from "@ledgerhq/react-ui";
import {
  WalletConnectMedium,
  CircledCrossSolidMedium,
  ArrowLeftMedium,
} from "@ledgerhq/react-ui/assets/icons";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useMemo } from "react";
import { Logo } from "@/icons/LedgerLiveLogo";
import styled, { useTheme } from "styled-components";
import useAnalytics from "@/hooks/useAnalytics";
import { tryDecodeURI } from "@/utils/image";
import { formatAccountsByChain, sortChains } from "@/hooks/useProposal/util";
import { ProposalTypes } from "@walletconnect/types";
import { AccountRow } from "./sessionProposal/AccountRow";

const BackButton = styled(Flex)`
  cursor: pointer;
  &:hover {
    opacity: 0.7;
  }
`;

type Props = {
  proposal: ProposalTypes.Struct;
};

const mocked = {
  many: {
    id: 1715633947547625,
    pairingTopic:
      "b6f7fd86d634476e571b5b6ee9792d4220483eb7797e14d3b1b9baafe5f7fccd",
    expiryTimestamp: 1715634247,
    requiredNamespaces: {},
    optionalNamespaces: {
      eip155: {
        chains: [
          "eip155:1",
          "eip155:8453",
          "eip155:137",
          "eip155:10",
          "eip155:43114",
          "eip155:42161",
          "eip155:56",
          "eip155:11155111",
          "eip155:84532",
          "eip155:80001",
          "eip155:11155420",
          "eip155:421614",
        ],
        methods: [
          "eth_chainId",
          "eth_signTypedData",
          "eth_signTransaction",
          "eth_sign",
          "personal_sign",
          "eth_sendTransaction",
          "eth_signTypedData_v4",
          "wallet_switchEthereumChain",
          "wallet_addEthereumChain",
        ],
        events: [
          "chainChanged",
          "accountsChanged",
          "message",
          "disconnect",
          "connect",
        ],
        rpcMap: {
          "1": "https://eth-mainnet.g.alchemy.com/v2/bw196jc7__ncQce8l-n27L9LoWTLT5S-",
          "10": "https://opt-mainnet.g.alchemy.com/v2/Nq1-A87vX8deq3H-zMWwPdjbQS2wCBOi",
          "56": "https://bsc-dataseed1.binance.org",
          "137":
            "https://polygon-mainnet.g.alchemy.com/v2/ZBTMhxiptG_nvQFO2InPpj4fw6jaTQGa",
          "8453":
            "https://base-mainnet.g.alchemy.com/v2/jTatj4jSAZZI3RghkpYiL06GchVrTSwJ",
          "42161":
            "https://arb-mainnet.g.alchemy.com/v2/uq861nHJfZa05zkM9llonMTTQP11l0PJ",
          "43114": "https://api.avax.network/ext/bc/C/rpc",
          "80001":
            "https://polygon-mumbai.g.alchemy.com/v2/TcFHV1YnGTZ6OnN4QkYrJMl0ptcg65oE",
          "84532":
            "https://base-sepolia.g.alchemy.com/v2/T0erRNuLlKa-uvmeSF85cpR1brIII-3j",
          "421614": "https://sepolia-rollup.arbitrum.io/rpc",
          "11155111":
            "https://eth-sepolia.g.alchemy.com/v2/LH--1-HF_fROhqXeETMDJ1sWyN4Mx7_W",
          "11155420": "https://sepolia.optimism.io",
        },
      },
    },
    relays: [
      {
        protocol: "irn",
      },
    ],
    proposer: {
      publicKey:
        "b811bd41f52a0a0522953b9b09ad3dac5306f4d133379c4d75de3eafb3966e64",
      metadata: {
        description:
          "Web3 login for everyone. Simple onboarding flows for all your users and powerful developer tools to match.",
        url: "https://demo.dynamic.xyz",
        icons: [
          "https://demo.dynamic.xyz/favicon.ico",
          "https://demo.dynamic.xyz/apple-touch-icon.png",
          "https://demo.dynamic.xyz/favicon-32x32.png",
          "https://demo.dynamic.xyz/favicon-16x16.png",
        ],
        name: "Dynamic | Demo Environment",
      },
    },
  },
};

export default function SessionProposal({ proposal }: Props) {
  proposal = mocked.many;
  const { colors } = useTheme();
  const { t } = useTranslation();
  const {
    handleClick,
    handleClose,
    approveSession,
    rejectSession,
    accounts,
    selectedAccounts,
    addNewAccount,
    navigateToHome,
  } = useProposal(proposal);
  const analytics = useAnalytics();
  const dApp = proposal.proposer.metadata.name;
  const dAppUrl = proposal.proposer.metadata.url;

  useEffect(() => {
    analytics.page("Wallet Connect Session Request", {
      dapp: dApp,
      url: dAppUrl,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onGoBack = useCallback(() => {
    void navigateToHome();
    analytics.track("button_clicked", {
      button: "WC-Back",
      page: "Wallet Connect Session Request",
    });
  }, [analytics, navigateToHome]);

  const onApprove = useCallback(() => {
    analytics.track("button_clicked", {
      button: "WC-Connect",
      page: "Wallet Connect Session Request",
      dapp: dApp,
      url: dAppUrl,
    });
    void approveSession();
  }, [analytics, approveSession, dApp, dAppUrl]);

  const onReject = useCallback(() => {
    analytics.track("button_clicked", {
      button: "WC-Reject",
      page: "Wallet Connect Session Request",
      dapp: dApp,
      url: dAppUrl,
    });
    void rejectSession();
  }, [analytics, dApp, dAppUrl, rejectSession]);

  const accountsByChain = useMemo(
    () => formatAccountsByChain(proposal, accounts),
    [proposal, accounts],
  );

  const requiredChains = useMemo(
    () => accountsByChain.filter((entry) => entry.isRequired),
    [accountsByChain],
  );

  const chainsNotSupported = useMemo(
    () => accountsByChain.filter((entry) => !entry.isSupported),
    [accountsByChain],
  );
  console.log({ chainsNotSupported });

  const noChainsSupported = useMemo(
    () => !accountsByChain.some((entry) => entry.isSupported),
    [accountsByChain],
  );

  const everyRequiredChainsSupported = useMemo(
    () => requiredChains.every((entry) => entry.isSupported),
    [requiredChains],
  );

  const everyRequiredChainsSelected = useMemo(
    () =>
      requiredChains.every((entry) =>
        entry.accounts.some((account) => selectedAccounts.includes(account.id)),
      ),
    [requiredChains, selectedAccounts],
  );

  const disabled = useMemo(
    () => !(everyRequiredChainsSelected && selectedAccounts.length > 0),
    [everyRequiredChainsSelected, selectedAccounts],
  );

  const iconProposer = useMemo(
    () => tryDecodeURI(proposal.proposer.metadata.icons[0]),
    [proposal.proposer.metadata.icons],
  );

  const createAccountDisplayed = useMemo(
    () =>
      accountsByChain
        .filter((entry) => entry.isSupported)
        .filter((entry) => entry.accounts.length === 0).length > 0,
    [accountsByChain],
  );

  console.log({ createAccountDisplayed });

  return (
    <Flex
      flex={1}
      alignItems="center"
      justifyContent="center"
      width="100%"
      height={
        noChainsSupported || !everyRequiredChainsSupported ? "100%" : "auto"
      }
    >
      <ResponsiveContainer>
        <BackButton onClick={onGoBack} alignSelf="flex-start">
          <Flex mt={8}>
            <ArrowLeftMedium size={24} color="neutral.c100" />
          </Flex>
        </BackButton>

        {noChainsSupported || !everyRequiredChainsSupported ? (
          <Flex flex={1} flexDirection="column" height="100%">
            <ErrorBlockchainSupport appName={dApp} chains={accountsByChain} />
            <ButtonsContainer>
              <Button
                variant="main"
                size="large"
                flex={1}
                onClick={handleClose}
              >
                <Text variant="body" fontWeight="semiBold" color="neutral.c00">
                  {t("sessionProposal.close")}
                </Text>
              </Button>
            </ButtonsContainer>
          </Flex>
        ) : (
          <Flex
            width="100%"
            height="300px"
            flex={1}
            justifyContent="space-between"
            paddingBottom={12}
            flexDirection="column"
          >
            <Flex flexDirection="column">
              <Header mb={10}>
                {iconProposer ? (
                  <Container>
                    <LogoContainer>
                      <Logo size={30} />
                    </LogoContainer>

                    <DAppContainer borderColor={colors.background.main}>
                      <LogoContainer>
                        <img
                          src={iconProposer}
                          alt="Picture of the proposer"
                          width={60}
                          style={{
                            borderRadius: "50%",
                            borderLeft: `3px solid ${colors.background.main}`,
                          }}
                          height={60}
                        />
                      </LogoContainer>
                    </DAppContainer>
                  </Container>
                ) : (
                  <LogoContainer>
                    <WalletConnectMedium size={30} />
                  </LogoContainer>
                )}

                <Text
                  variant="h4"
                  mt={3}
                  mb={3}
                  uppercase={false}
                  textAlign="center"
                  fontWeight="medium"
                >
                  {t("sessionProposal.connectTo", {
                    name: dApp,
                  })}
                </Text>

                <Text
                  variant="body"
                  fontWeight="medium"
                  textAlign="center"
                  color={colors.neutral.c80}
                  uppercase={false}
                >
                  {formatUrl(dAppUrl)}
                </Text>
              </Header>
              <ListChains>
                {sortChains(accountsByChain)
                  .filter((entry) => entry.isSupported)
                  .map((entry) => {
                    return (
                      <Box key={entry.chain} mb={3}>
                        <List>
                          {entry.accounts.map((account, index: number) =>
                            AccountRow(
                              account,
                              index,
                              entry,
                              selectedAccounts,
                              handleClick,
                            ),
                          )}
                        </List>
                      </Box>
                    );
                  })}
                {createAccountDisplayed && (
                  <AddAccountPlaceholder
                    // onClick={() => void addNewAccount(entry.chain)}
                    onClick={() => {}}
                  />
                )}
                <Box mt={6}>
                  <InfoSessionProposal />
                </Box>
              </ListChains>
            </Flex>

            <Flex
              style={{
                background: colors.background.main,
                position: "sticky",
                bottom: "0px",
              }}
            >
              <ButtonsContainer>
                <Button
                  variant="main"
                  size="large"
                  flex={1}
                  onClick={onApprove}
                  disabled={disabled}
                >
                  <Text
                    variant="body"
                    fontWeight="semiBold"
                    color={disabled ? "neutral.c50" : "neutral.c00"}
                  >
                    {t("sessionProposal.connect")}
                  </Text>
                </Button>
              </ButtonsContainer>
            </Flex>
          </Flex>
        )}
      </ResponsiveContainer>
    </Flex>
  );
}

const DAppContainer = styled(Flex).attrs(
  (p: { size: number; borderColor: string; backgroundColor: string }) => ({
    position: "absolute",
    right: "-55px",
    alignItems: "center",
    justifyContent: "center",
    heigth: p.size,
    width: p.size,
    borderRadius: 50.0,
    border: `3px solid ${p.borderColor}`,
    backgroundColor: p.backgroundColor,
    zIndex: 0,
  }),
)<{ size: number }>``;

const Container = styled(Flex).attrs((p: { size: number }) => ({
  heigth: p.size,
  width: p.size,
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  left: "-25px",
}))<{ size: number }>``;

const ListChains = styled(Flex)`
  flex-direction: column;
`;

const Header = styled(Flex)`
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;
