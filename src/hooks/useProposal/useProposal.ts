import { useCallback, useState } from "react";
import { getErrorMessage } from "@/utils/helper.util";
import useAnalytics from "@/hooks/useAnalytics";

import { buildApprovedNamespaces } from "@walletconnect/utils";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  showBackToBrowserModalAtom,
  walletKitAtom,
} from "@/store/walletKit.store";
import { useAtomValue, useSetAtom } from "jotai";
import useAccounts, { queryKey as accountsQueryKey } from "@/hooks/useAccounts";
import { walletAPIClientAtom } from "@/store/wallet-api.store";
import {
  queryKey as sessionsQueryKey,
  useQueryFn as useSessionsQueryFn,
} from "../useSessions";
import { queryKey as pendingProposalsQueryKey } from "../usePendingProposals";
import { ProposalTypes } from "@walletconnect/types";
import { enqueueSnackbar } from "notistack";
import { sortedRecentConnectionAppsAtom } from "../../store/recentConnectionAppsAtom";
import { useSupportedNamespaces } from "../useSupportedNamespaces";

export function useProposal(proposal: ProposalTypes.Struct) {
  const navigate = useNavigate({ from: "/proposal/$id" });
  const queryClient = useQueryClient();
  const client = useAtomValue(walletAPIClientAtom);
  const accounts = useAccounts(client);
  const walletKit = useAtomValue(walletKitAtom);
  const analytics = useAnalytics();
  const addAppToLastConnectionApps = useSetAtom(sortedRecentConnectionAppsAtom);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const { buildSupportedNamespaces } = useSupportedNamespaces(
    proposal,
    selectedAccounts,
  );

  const handleClick = useCallback((account: string) => {
    setSelectedAccounts((value) => {
      if (value.includes(account)) {
        return value.filter((s) => s !== account);
      }
      return [...value, account];
    });
  }, []);

  const navigateToHome = useCallback(() => {
    return navigate({
      to: "/",
      search: (search) => search,
    });
  }, [navigate]);

  const sessionsQueryFn = useSessionsQueryFn(walletKit);

  const setShowModal = useSetAtom(showBackToBrowserModalAtom);
  const url =
    proposal.proposer.metadata.redirect?.native ??
    proposal.proposer.metadata.redirect?.universal;
  const redirectToDapp = useCallback(() => {
    if (url) {
      window.open(url);
    } else {
      setShowModal(true);
    }
  }, [setShowModal, url]);

  const approveSession = useCallback(async () => {
    try {
      const supportedNs = buildSupportedNamespaces(proposal);
      const approvedNs = buildApprovedNamespaces({
        proposal,
        supportedNamespaces: supportedNs,
      });
      const session = await walletKit.approveSession({
        id: proposal.id,
        namespaces: approvedNs,
        sessionProperties: {
          supportedNs: JSON.stringify(supportedNs),
        },
      });
      await queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
      await queryClient.invalidateQueries({
        queryKey: pendingProposalsQueryKey,
      });
      // Prefetching as we need the data in the next route to avoid redirecting to home
      await queryClient.prefetchQuery({
        queryKey: sessionsQueryKey,
        queryFn: sessionsQueryFn,
      });
      addAppToLastConnectionApps(session.peer.metadata);
      // Remove the uri from the search params to avoid trying to connect again if the user reload the current page
      await navigate({
        to: "/detail/$topic",
        params: { topic: session.topic },
        search: ({ uri: _, ...search }) => search,
      });

      redirectToDapp();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), {
        errorType: "Approve session error",
        variant: "errorNotification",
        anchorOrigin: {
          vertical: "top",
          horizontal: "right",
        },
      });
      console.error(error);
      await queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
      await queryClient.invalidateQueries({
        queryKey: pendingProposalsQueryKey,
      });
    }
  }, [
    redirectToDapp,
    buildSupportedNamespaces,
    proposal,
    walletKit,
    queryClient,
    sessionsQueryFn,
    addAppToLastConnectionApps,
    navigate,
  ]);

  const rejectSession = useCallback(async () => {
    try {
      await walletKit.rejectSession({
        id: proposal.id,
        reason: {
          code: 5000,
          message: "USER_REJECTED_METHODS",
        },
      });
      await queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
      await queryClient.invalidateQueries({
        queryKey: pendingProposalsQueryKey,
      });
      // Remove the uri from the search params to avoid trying to connect again if the user reload the current page
      await navigate({
        to: "/",
        search: ({ uri: _, ...search }) => search,
      });

      redirectToDapp();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), {
        errorType: "Reject session error",
        variant: "errorNotification",
        anchorOrigin: {
          vertical: "top",
          horizontal: "right",
        },
      });
      console.error(error);
      await queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
      await queryClient.invalidateQueries({
        queryKey: pendingProposalsQueryKey,
      });
    }
  }, [navigate, proposal.id, queryClient, redirectToDapp, walletKit]);

  const handleClose = useCallback(() => {
    void rejectSession();
    analytics.track("button_clicked", {
      button: "Close",
      page: "Wallet Connect Error Unsupported Blockchains",
    });
  }, [analytics, rejectSession]);

  const addNewAccount = useCallback(
    async (currency: string) => {
      try {
        const account = await client.account.request({
          currencyIds: [currency],
        });
        setSelectedAccounts((value) => {
          if (value.includes(account.id)) {
            return value;
          }
          return [...value, account.id];
        });
      } catch (error) {
        if (error instanceof Error && error.message === "Canceled by user") {
          console.error("request account canceled by user");
          return;
        }
        enqueueSnackbar(getErrorMessage(error), {
          errorType: "Error adding accounts",
          variant: "errorNotification",
          anchorOrigin: {
            vertical: "top",
            horizontal: "right",
          },
        });
      }
      // refetch accounts
      await queryClient.invalidateQueries({ queryKey: accountsQueryKey });
    },
    [client, queryClient],
  );

  const addNewAccounts = useCallback(
    async (currencies: string[]) => {
      try {
        const account = await client.account.request({
          currencyIds: currencies,
        });
        setSelectedAccounts((value) => {
          if (value.includes(account.id)) {
            return value;
          }
          return [...value, account.id];
        });
      } catch (error) {
        if (error instanceof Error && error.message === "Canceled by user") {
          console.error("request account canceled by user");
          return;
        }
        enqueueSnackbar(getErrorMessage(error), {
          errorType: "Error adding accounts",
          variant: "errorNotification",
          anchorOrigin: {
            vertical: "top",
            horizontal: "right",
          },
        });
      }
      // refetch accounts
      await queryClient.invalidateQueries({ queryKey: accountsQueryKey });
    },
    [client, queryClient],
  );

  // No need for a memo as it's directly spread on usage
  return {
    approveSession,
    rejectSession,
    handleClose,
    handleClick,
    accounts: accounts.data,
    selectedAccounts,
    addNewAccount,
    addNewAccounts,
    navigateToHome,
  };
}
