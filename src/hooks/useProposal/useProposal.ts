import useAccounts, { queryKey as accountsQueryKey } from "@/hooks/useAccounts";
import useAnalytics from "@/hooks/useAnalytics";
import { walletAPIClientAtom } from "@/store/wallet-api.store";
import {
  showBackToBrowserModalAtom,
  walletKitAtom,
} from "@/store/walletKit.store";
import { OneClickAuthPayload } from "@/types/types";
import { fetchBip122Addresses } from "@/utils/bip122";
import { getAccountWithAddressAndChainId } from "@/utils/generic";
import { getErrorMessage } from "@/utils/helper.util";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ProposalTypes } from "@walletconnect/types";
import {
  buildApprovedNamespaces,
  buildAuthObject,
  populateAuthPayload,
} from "@walletconnect/utils";
import { useAtomValue, useSetAtom } from "jotai";
import { enqueueSnackbar } from "notistack";
import { useCallback, useState } from "react";
import { sortedRecentConnectionAppsAtom } from "../../store/recentConnectionAppsAtom";
import { formatMessage } from "../requestHandlers/utils";
import { queryKey as pendingProposalsQueryKey } from "../usePendingProposals";
import {
  queryKey as sessionsQueryKey,
  useQueryFn as useSessionsQueryFn,
} from "../useSessions";
import { useSupportedNamespaces } from "../useSupportedNamespaces";

export function useProposal(
  proposal: ProposalTypes.Struct,
  oneClickAuthPayload?: OneClickAuthPayload,
) {
  const navigate = useNavigate({
    from: oneClickAuthPayload ? "/oneclickauth" : "/proposal/$id",
  });
  const queryClient = useQueryClient();
  const client = useAtomValue(walletAPIClientAtom);
  const accounts = useAccounts(client);
  const walletKit = useAtomValue(walletKitAtom);
  const analytics = useAnalytics();
  const addAppToLastConnectionApps = useSetAtom(sortedRecentConnectionAppsAtom);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const { buildEip155Namespace, buildSupportedNamespaces } =
    useSupportedNamespaces(proposal, selectedAccounts);

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

      // Emit bip122_addressesChanged immediately after approval for all BIP122 accounts
      // per Reown spec: https://docs.reown.com/advanced/multichain/rpc-reference/bitcoin-rpc#bip122_addresseschanged
      const bip122Namespace = session.namespaces.bip122;
      if (bip122Namespace?.events.includes("bip122_addressesChanged")) {
        const emittedChains = new Set<string>();
        for (const caipAccount of bip122Namespace.accounts) {
          const [namespace, chainRef, address] = caipAccount.split(":");
          const chainId = `${namespace}:${chainRef}`;
          if (emittedChains.has(chainId)) continue;
          const account = accounts.data.find((a) => a.address === address);
          if (account) {
            const addressesData = await fetchBip122Addresses(account, client, [
              "payment",
            ]);
            await walletKit.emitSessionEvent({
              topic: session.topic,
              event: {
                name: "bip122_addressesChanged",
                data: addressesData,
              },
              chainId,
            });
            emittedChains.add(chainId);
          }
        }
      }

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
    accounts.data,
    client,
  ]);

  const approveSessionAuthenticate = useCallback(async () => {
    try {
      const {
        chains,
        methods,
        accounts: accs,
      } = buildEip155Namespace(
        proposal.requiredNamespaces,
        proposal.optionalNamespaces,
      );

      const payload = oneClickAuthPayload;

      if (!payload) {
        throw new Error("No 1-click auth payload found");
      }

      const authPayload = populateAuthPayload({
        authPayload: payload.params.authPayload,
        chains,
        methods,
      });

      const firstAccount = accs[0];
      const [namespace, chainId, addr] = firstAccount.split(":");

      const message = walletKit.formatAuthMessage({
        request: authPayload,
        iss: firstAccount,
      });

      const accountSign = getAccountWithAddressAndChainId(
        accounts.data,
        addr,
        `${namespace}:${chainId}`,
      );

      if (!accountSign) {
        throw new Error("Account not found");
      }

      const signature = await client.message.sign(
        accountSign.id,
        Buffer.from(message, "utf-8"),
      );

      const auth = buildAuthObject(
        authPayload,
        {
          t: "eip191", // signature type
          s: formatMessage(signature),
        },
        firstAccount,
      );

      const { session } = await walletKit.approveSessionAuthenticate({
        id: payload.id,
        auths: [auth],
      });

      if (!session) {
        await navigate({
          to: "/",
          search: ({ uri: _, ...search }) => search,
        });
        return;
      }

      await queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
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
    buildEip155Namespace,
    proposal.requiredNamespaces,
    proposal.optionalNamespaces,
    oneClickAuthPayload,
    walletKit,
    queryClient,
    sessionsQueryFn,
    addAppToLastConnectionApps,
    navigate,
    redirectToDapp,
    accounts.data,
    client.message,
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

  const rejectSessionAuthenticate = useCallback(async () => {
    if (!oneClickAuthPayload) {
      throw new Error("No 1-click auth payload found");
    }

    try {
      await walletKit.rejectSessionAuthenticate({
        id: oneClickAuthPayload.id,
        reason: {
          code: 5000,
          message: "USER_REJECTED_METHODS",
        },
      });

      await queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
      await queryClient.invalidateQueries({
        queryKey: pendingProposalsQueryKey,
      });
      await navigate({
        to: "/",
        search: ({ uri: _, ...search }) => search,
      });

      redirectToDapp();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), {
        errorType: "Reject session authenticate error",
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
  }, [navigate, oneClickAuthPayload, queryClient, redirectToDapp, walletKit]);

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
    approveSessionAuthenticate,
    rejectSession,
    rejectSessionAuthenticate,
    handleClose,
    handleClick,
    accounts: accounts.data,
    selectedAccounts,
    addNewAccount,
    addNewAccounts,
    navigateToHome,
  };
}
