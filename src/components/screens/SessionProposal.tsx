import { ButtonsContainer } from "@/components/atoms/containers/Elements";
import { ErrorBlockchainSupport } from "@/components/screens/sessionProposal/ErrorBlockchainSupport";
import useAnalytics from "@/hooks/useAnalytics";
import { useProposal } from "@/hooks/useProposal/useProposal";
import { formatAccountsByChain, sortChains } from "@/hooks/useProposal/util";
import useVerification from "@/hooks/useVerification";
import { ResponsiveContainer } from "@/styles/styles";
import { tryDecodeURI } from "@/utils/image";
import { Button, Flex, Text } from "@ledgerhq/react-ui";
import { ArrowLeftMedium } from "@ledgerhq/react-ui/assets/icons";
import { ProposalTypes } from "@walletconnect/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import AccountSelections from "./sessionProposal/AccountSelections";
import { ErrorMissingRequiredAccount } from "./sessionProposal/ErrorMissingRequiredAccount";
import { OneClickAuthPayload } from "@/types/types";

const BackButton = styled(Flex)`
  cursor: pointer;
  &:hover {
    opacity: 0.7;
  }
`;

type Props = {
  proposal: ProposalTypes.Struct & {
    oneClickAuthPayload?: OneClickAuthPayload;
  };
};

export default function SessionProposal({ proposal }: Props) {
  const { t } = useTranslation();
  const {
    handleClick,
    handleClose,
    approveSession,
    approveSessionAuthenticate,
    rejectSession,
    accounts,
    selectedAccounts,
    addNewAccounts,
    navigateToHome,
  } = useProposal(proposal);
  const analytics = useAnalytics();
  const dApp = proposal.proposer.metadata.name;
  const dAppUrl = proposal.proposer.metadata.url;
  const isOneClikAuth = !!proposal.oneClickAuthPayload;
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const verificationStatus = useVerification(proposal);

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
    setApproving(true);
    if (isOneClikAuth) {
      void approveSessionAuthenticate().finally(() => {
        setApproving(false);
      });
    } else {
      void approveSession().finally(() => {
        setApproving(false);
      });
    }
  }, [
    analytics,
    approveSession,
    approveSessionAuthenticate,
    dApp,
    dAppUrl,
    isOneClikAuth,
  ]);

  const onReject = useCallback(() => {
    analytics.track("button_clicked", {
      button: "WC-Reject",
      page: "Wallet Connect Session Request",
      dapp: dApp,
      url: dAppUrl,
    });
    setRejecting(true);
    void rejectSession().finally(() => {
      setRejecting(false);
    });
  }, [analytics, dApp, dAppUrl, rejectSession]);

  const accountsByChain = useMemo(
    () => formatAccountsByChain(proposal, accounts),
    [proposal, accounts],
  );

  const requiredChains = useMemo(
    () => accountsByChain.filter((entry) => entry.isRequired),
    [accountsByChain],
  );

  const requiredChainsWhereNoAccounts = useMemo(
    () => requiredChains.filter((entry) => entry.accounts.length === 0),
    [requiredChains],
  );

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
    () =>
      approving ||
      !(everyRequiredChainsSelected && selectedAccounts.length > 0),
    [approving, everyRequiredChainsSelected, selectedAccounts.length],
  );

  const iconProposer = useMemo(
    () => tryDecodeURI(proposal.proposer.metadata.icons[0]),
    [proposal.proposer.metadata.icons],
  );

  const chainsWhereNoAccounts = useMemo(
    () =>
      accountsByChain
        .filter((entry) => entry.isSupported)
        .filter((entry) => entry.accounts.length === 0),
    [accountsByChain],
  );

  const createAccountDisplayed = useMemo(
    () => chainsWhereNoAccounts.length > 0,
    [chainsWhereNoAccounts],
  );

  const entries = useMemo(() => {
    return sortChains(accountsByChain)
      .filter((entry) => entry.isSupported)
      .filter((entry) => entry.accounts.length > 0);
  }, [accountsByChain]);

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

        {!isOneClikAuth &&
        (noChainsSupported ||
          !everyRequiredChainsSupported ||
          requiredChainsWhereNoAccounts.length > 0) ? (
          <Flex flex={1} flexDirection="column" height="100%">
            {noChainsSupported || !everyRequiredChainsSupported ? (
              <ErrorBlockchainSupport appName={dApp} chains={accountsByChain} />
            ) : (
              <ErrorMissingRequiredAccount
                appName={dApp}
                addNewAccounts={addNewAccounts}
                iconProposer={iconProposer}
                chains={accountsByChain}
              />
            )}

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
          <AccountSelections
            dApp={dApp}
            dAppUrl={dAppUrl}
            iconProposer={iconProposer}
            entries={entries}
            selectedAccounts={selectedAccounts}
            createAccountDisplayed={createAccountDisplayed}
            chainsWhereNoAccounts={chainsWhereNoAccounts}
            verificationStatus={verificationStatus}
            requiredChains={requiredChains}
            disabled={false}
            rejecting={rejecting}
            approving={approving}
            onApprove={onApprove}
            onReject={onReject}
            addNewAccounts={addNewAccounts}
            handleClick={handleClick}
          />
        )}
      </ResponsiveContainer>
    </Flex>
  );
}
