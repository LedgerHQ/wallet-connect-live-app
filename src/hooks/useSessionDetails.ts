import useAccounts from "@/hooks/useAccounts";
import useAnalytics from "@/hooks/useAnalytics";
import { walletAPIClientAtom } from "@/store/wallet-api.store";
import {
  showBackToBrowserModalAtom,
  walletKitAtom,
} from "@/store/walletKit.store";
import {
  getCurrencyByChainId,
  getErrorMessage,
  getNamespace,
} from "@/utils/helper.util";
import { Account } from "@ledgerhq/wallet-api-client";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { SessionTypes } from "@walletconnect/types";
import { useAtomValue, useSetAtom } from "jotai";
import { enqueueSnackbar } from "notistack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { queryKey as pendingProposalsQueryKey } from "./usePendingProposals";
import {
  queryKey as sessionsQueryKey,
  useQueryFn as useSessionsQueryFn,
} from "./useSessions";
import { useSupportedNamespaces } from "./useSupportedNamespaces";

export function useSessionDetails(session: SessionTypes.Struct) {
  const navigate = useNavigate({ from: "/detail/$topic" });
  const queryClient = useQueryClient();
  const client = useAtomValue(walletAPIClientAtom);
  const accounts = useAccounts(client);
  const walletKit = useAtomValue(walletKitAtom);
  const analytics = useAnalytics();
  const [mainAccount, setMainAccount] = useState<Account>();
  const setShowModal = useSetAtom(showBackToBrowserModalAtom);
  const [updating, setUpdating] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const { buildSupportedNamespaces } = useSupportedNamespaces(
    session,
    selectedAccounts,
  );

  const fullAddresses = useMemo(
    () =>
      Object.entries(session.namespaces).reduce(
        (acc, elem) => acc.concat(elem[1].accounts),
        [] as string[],
      ),
    [session.namespaces],
  );

  const sessionAccounts = useMemo(
    () => getAccountsFromAddresses(fullAddresses, accounts.data),

    [accounts.data, fullAddresses],
  );

  useEffect(() => {
    if (sessionAccounts.length > 0) {
      setMainAccount(sessionAccounts[0][1][0]);
      setSelectedAccounts(
        sessionAccounts.flatMap(([, accounts]) =>
          accounts.map((account) => account.id),
        ),
      );
    }
  }, [sessionAccounts, setMainAccount]);

  const handleClick = useCallback(
    (account: string) => {
      setSelectedAccounts((value) => {
        if (value.includes(account)) {
          return value.filter((s) => s !== account);
        }
        // always put main account first
        if (mainAccount?.id === account) {
          return [account, ...value.filter((s) => s !== account)];
        }
        return [...value, account];
      });
    },
    [mainAccount?.id],
  );

  const navigateToHome = useCallback(() => {
    return navigate({
      to: "/",
      search: (search) => search,
    });
  }, [navigate]);

  const sessionsQueryFn = useSessionsQueryFn(walletKit);

  const handleDelete = useCallback(() => {
    setDisconnecting(true);
    void walletKit
      .disconnectSession({
        topic: session.topic,
        reason: {
          code: 3,
          message: "Disconnect Session",
        },
      })
      .then(() => {
        analytics.track("button_clicked", {
          button: "WC-Disconnect Session",
          page: "Wallet Connect Session Detail",
        });
        void queryClient
          .invalidateQueries({ queryKey: sessionsQueryKey })
          .then(() => navigateToHome());
      })
      .catch((error) => {
        setDisconnecting(false);
        enqueueSnackbar(getErrorMessage(error), {
          errorType: "Disconnect session error",
          variant: "errorNotification",
          anchorOrigin: {
            vertical: "top",
            horizontal: "right",
          },
        });
        console.error(error);
        void queryClient.invalidateQueries({
          queryKey: sessionsQueryKey,
        });
      });
  }, [analytics, navigateToHome, queryClient, session, walletKit]);

  const confirmEdition = useCallback(async () => {
    if (selectedAccounts.length === 0) {
      enqueueSnackbar("Please select at least one account", {
        errorType: "Edit session error",
        variant: "errorNotification",
        anchorOrigin: {
          vertical: "top",
          horizontal: "right",
        },
      });
      return;
    }
    setUpdating(true);
    try {
      let namespaces = buildSupportedNamespaces(session);

      // keep the main account in the first position
      if (mainAccount) {
        const caipAccount = `${getNamespace(mainAccount.currency)}:${mainAccount?.address}`;
        const mainAccountNamespace = Object.entries(namespaces).find(
          ([, value]) => value.accounts.includes(caipAccount),
        );

        if (mainAccountNamespace) {
          delete namespaces[mainAccountNamespace[0]];
          namespaces = {
            [mainAccountNamespace[0]]: {
              ...mainAccountNamespace[1],
              accounts: [
                caipAccount,
                ...mainAccountNamespace[1].accounts.filter(
                  (a) => a !== caipAccount,
                ),
              ],
            },
            ...namespaces,
          };
        }
      }

      await walletKit.updateSession({
        topic: session.topic,
        namespaces,
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

      // Remove the uri from the search params to avoid trying to connect again if the user reload the current page
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), {
        errorType: "Edit session error",
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
    } finally {
      setUpdating(false);
      void navigate({
        from: "/detail/$topic/edit",
        to: "/detail/$topic",
        params: { topic: session.topic },
        search: ({ uri: _, ...search }) => search,
      });
    }
  }, [
    selectedAccounts.length,
    buildSupportedNamespaces,
    session,
    mainAccount,
    walletKit,
    queryClient,
    sessionsQueryFn,
    navigate,
  ]);

  const handleSwitch = useCallback(
    async (account: Account) => {
      const chainId = getNamespace(account.currency);
      const [namespace, chainValue] = chainId.split(":");

      const caipAccount = `${chainId}:${account.address}`;
      const existingNamespace = session.namespaces[namespace];
      delete session.namespaces[namespace];
      session.namespaces = {
        [namespace]: {
          ...existingNamespace,
          accounts: [
            caipAccount,
            ...existingNamespace.accounts.filter((a) => a !== caipAccount),
          ],
          chains: [
            chainId,
            ...(existingNamespace.chains?.filter((c) => c !== chainId) ?? []),
          ],
        },
        ...session.namespaces,
      };

      await walletKit.updateSession({
        topic: session.topic,
        namespaces: session.namespaces,
      });

      if (session.namespaces[namespace].events.includes("chainChanged")) {
        await walletKit.emitSessionEvent({
          topic: session.topic,
          event: {
            name: "chainChanged",
            data: chainValue,
          },
          chainId,
        });
      }

      if (
        session.namespaces[namespace].events.includes("bip122_addressesChanged")
      ) {
        await walletKit.emitSessionEvent({
          topic: session.topic,
          event: {
            name: "bip122_addressesChanged",
            data: chainValue,
          },
          chainId,
        });
      }

      if (session.namespaces[namespace].events.includes("accountsChanged")) {
        await walletKit.emitSessionEvent({
          topic: session.topic,
          event: {
            name: "accountsChanged",
            data: [account.address],
          },
          chainId,
        });
      }

      setMainAccount(account);
      setShowModal(true);

      await queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
      await queryClient.invalidateQueries({
        queryKey: pendingProposalsQueryKey,
      });
      // Prefetching as we need the data in the next route to avoid redirecting to home
      await queryClient.prefetchQuery({
        queryKey: sessionsQueryKey,
        queryFn: sessionsQueryFn,
      });
    },
    [queryClient, session, sessionsQueryFn, setShowModal, walletKit],
  );

  function getAccountsFromAddresses(addresses: string[], accounts: Account[]) {
    const accountsByChain = new Map<string, Account[]>();

    addresses.forEach((addr) => {
      const addrSplitted = addr.split(":");
      const chain = getCurrencyByChainId(
        `${addrSplitted[0]}:${addrSplitted[1]}`,
      );
      let chainInLedgerLive = chain;

      if (chain.startsWith("xrpl")) {
        chainInLedgerLive = "ripple";
      }

      const existingEntry = accountsByChain.get(chainInLedgerLive);

      const account = accounts.find(
        (a) =>
          a.address === addrSplitted[2] && chainInLedgerLive === a.currency,
      );

      if (account) {
        accountsByChain.set(
          chain,
          existingEntry ? [...existingEntry, account] : [account],
        );
      }
    });
    return Array.from(accountsByChain);
  }

  return {
    confirmEdition,
    handleClick,
    accounts: accounts.data,
    selectedAccounts,
    navigateToHome,
    sessionAccounts,
    mainAccount,
    setMainAccount,
    handleSwitch,
    updating,
    setUpdating,
    disconnecting,
    handleDelete,
  };
}
