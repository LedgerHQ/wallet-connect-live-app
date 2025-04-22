import { BIP122_SIGNING_METHODS } from "@/data/methods/BIP122.methods";
import { EIP155_SIGNING_METHODS } from "@/data/methods/EIP155Data.methods";
import { MULTIVERSX_SIGNING_METHODS } from "@/data/methods/MultiversX.methods";
import { RIPPLE_SIGNING_METHODS } from "@/data/methods/Ripple.methods";
import { WALLET_METHODS } from "@/data/methods/Wallet.methods";
import {
  BIP122_CHAINS,
  EIP155_CHAINS,
  MULTIVERS_X_CHAINS,
  RIPPLE_CHAINS,
  SupportedNamespace,
} from "@/data/network.config";
import useAccounts from "@/hooks/useAccounts";
import useAnalytics from "@/hooks/useAnalytics";
import { formatAccountsByChain } from "@/hooks/useProposal/util";
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
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ProposalTypes, SessionTypes } from "@walletconnect/types";
import { BuildApprovedNamespacesParams } from "@walletconnect/utils";
import { useAtomValue, useSetAtom } from "jotai";
import { enqueueSnackbar } from "notistack";
import { useCallback, useEffect, useMemo, useState } from "react";
import { queryKey as pendingProposalsQueryKey } from "./usePendingProposals";
import {
  queryKey as sessionsQueryKey,
  useQueryFn as useSessionsQueryFn,
} from "./useSessions";
import { Account } from "@ledgerhq/wallet-api-client";
import { use } from "i18next";

export function useSessionDetails(session: SessionTypes.Struct) {
  const navigate = useNavigate({ from: "/detail/$topic" });
  const queryClient = useQueryClient();
  const client = useAtomValue(walletAPIClientAtom);
  const accounts = useAccounts(client);
  const walletKit = useAtomValue(walletKitAtom);
  const analytics = useAnalytics();
  const [mainAccount, setMainAccount] = useState<Account>();
  const [editingSession, setEditingSession] = useState(false);
  const setShowModal = useSetAtom(showBackToBrowserModalAtom);
  const [updating, setUpdating] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const fullAddresses = useMemo(
    () =>
      Object.entries(session.namespaces).reduce(
        (acc, elem) => acc.concat(elem[1].accounts),
        [] as string[],
      ),
    [session],
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

  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

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

  const buildEip155Namespace = useCallback(
    (
      requiredNamespaces: ProposalTypes.RequiredNamespaces,
      optionalNamespaces: ProposalTypes.OptionalNamespaces,
    ) => {
      const accountsByChain = formatAccountsByChain(
        session,
        accounts.data,
      ).filter((a) => {
        return (
          a.accounts.length > 0 &&
          a.isSupported &&
          Object.keys(EIP155_CHAINS).includes(a.chain)
        );
      });
      const dataToSend = accountsByChain.reduce<
        { account: string; chain: string }[]
      >(
        (accum, elem) =>
          accum.concat(
            elem.accounts
              .filter((acc) => selectedAccounts.includes(acc.id))
              .map((a) => ({
                account: `${getNamespace(a.currency)}:${a.address}`,
                chain: getNamespace(a.currency),
              })),
          ),
        [],
      );

      const supportedMethods: string[] = [
        ...Object.values(WALLET_METHODS),
        ...Object.values(EIP155_SIGNING_METHODS),
      ];

      const methods = [
        ...new Set([
          ...(requiredNamespaces[SupportedNamespace.EIP155]?.methods.filter(
            (method) => supportedMethods.includes(method),
          ) ?? []),
          ...(optionalNamespaces[SupportedNamespace.EIP155]?.methods.filter(
            (method) => supportedMethods.includes(method),
          ) ?? []),
        ]),
      ];
      const events = [
        ...new Set([
          ...(requiredNamespaces[SupportedNamespace.EIP155]?.events ?? []),
          ...(optionalNamespaces[SupportedNamespace.EIP155]?.events ?? []),
        ]),
      ];

      return {
        chains: [...new Set(dataToSend.map((e) => e.chain))],
        methods,
        events,
        accounts: dataToSend.map((e) => e.account),
      };
    },
    [accounts.data, session, selectedAccounts],
  );

  const buildMvxNamespace = useCallback(
    (
      requiredNamespaces: ProposalTypes.RequiredNamespaces,
      optionalNamespaces: ProposalTypes.OptionalNamespaces,
    ) => {
      const accountsByChain = formatAccountsByChain(
        session,
        accounts.data,
      ).filter(
        (a) =>
          a.accounts.length > 0 &&
          a.isSupported &&
          Object.keys(MULTIVERS_X_CHAINS).includes(a.chain),
      );
      const dataToSend = accountsByChain.reduce<
        { account: string; chain: string }[]
      >(
        (accum, elem) =>
          accum.concat(
            elem.accounts
              .filter((acc) => selectedAccounts.includes(acc.id))
              .map((a) => ({
                account: `${getNamespace(a.currency)}:${a.address}`,
                chain: getNamespace(a.currency),
              })),
          ),
        [],
      );

      const supportedMethods: string[] = [
        ...Object.values(WALLET_METHODS),
        ...Object.values(MULTIVERSX_SIGNING_METHODS),
      ];

      const methods = [
        ...new Set([
          ...(requiredNamespaces[SupportedNamespace.MVX]?.methods.filter(
            (method) => supportedMethods.includes(method),
          ) ?? []),
          ...(optionalNamespaces[SupportedNamespace.MVX]?.methods.filter(
            (method) => supportedMethods.includes(method),
          ) ?? []),
        ]),
      ];

      const events = [
        ...new Set([
          ...(requiredNamespaces[SupportedNamespace.MVX]?.events ?? []),
          ...(optionalNamespaces[SupportedNamespace.MVX]?.events ?? []),
        ]),
      ];

      return {
        chains: [...new Set(dataToSend.map((e) => e.chain))],
        methods,
        events,
        accounts: dataToSend.map((e) => e.account),
      };
    },
    [accounts.data, session, selectedAccounts],
  );

  const buildBip122Namespace = useCallback(
    (
      requiredNamespaces: ProposalTypes.RequiredNamespaces,
      optionalNamespaces: ProposalTypes.OptionalNamespaces,
    ) => {
      const accountsByChain = formatAccountsByChain(
        session,
        accounts.data,
      ).filter(
        (a) =>
          a.accounts.length > 0 &&
          a.isSupported &&
          Object.keys(BIP122_CHAINS).includes(a.chain),
      );
      const dataToSend = accountsByChain.reduce<
        { account: string; chain: string }[]
      >(
        (accum, elem) =>
          accum.concat(
            elem.accounts
              .filter((acc) => selectedAccounts.includes(acc.id))
              .map((a) => ({
                account: `${getNamespace(a.currency)}:${a.address}`,
                chain: getNamespace(a.currency),
              })),
          ),
        [],
      );

      const supportedMethods: string[] = [
        ...Object.values(WALLET_METHODS),
        ...Object.values(BIP122_SIGNING_METHODS),
      ];

      const methods = [
        ...new Set([
          ...(requiredNamespaces[SupportedNamespace.BIP122]?.methods.filter(
            (method) => supportedMethods.includes(method),
          ) ?? []),
          ...(optionalNamespaces[SupportedNamespace.BIP122]?.methods.filter(
            (method) => supportedMethods.includes(method),
          ) ?? []),
        ]),
      ];

      const events = [
        ...new Set([
          ...(requiredNamespaces[SupportedNamespace.BIP122]?.events ?? []),
          ...(optionalNamespaces[SupportedNamespace.BIP122]?.events ?? []),
        ]),
      ];

      return {
        chains: [...new Set(dataToSend.map((e) => e.chain))],
        methods,
        events,
        accounts: dataToSend.map((e) => e.account),
      };
    },
    [accounts.data, session, selectedAccounts],
  );

  const buildXrpNamespace = useCallback(
    (
      requiredNamespaces: ProposalTypes.RequiredNamespaces,
      optionalNamespaces: ProposalTypes.OptionalNamespaces,
    ) => {
      const accountsByChain = formatAccountsByChain(
        session,
        accounts.data,
      ).filter(
        (a) =>
          a.accounts.length > 0 &&
          a.isSupported &&
          Object.keys(RIPPLE_CHAINS).includes(a.chain),
      );
      const dataToSend = accountsByChain.reduce<
        { account: string; chain: string }[]
      >(
        (accum, elem) =>
          accum.concat(
            elem.accounts
              .filter((acc) => selectedAccounts.includes(acc.id))
              .map((a) => ({
                account: `${getNamespace(a.currency)}:${a.address}`,
                chain: getNamespace(a.currency),
              })),
          ),
        [],
      );

      const supportedMethods: string[] = [
        ...Object.values(WALLET_METHODS),
        ...Object.values(RIPPLE_SIGNING_METHODS),
      ];

      const methods = [
        ...new Set([
          ...(requiredNamespaces[SupportedNamespace.XRPL]?.methods.filter(
            (method) => supportedMethods.includes(method),
          ) ?? []),
          ...(optionalNamespaces[SupportedNamespace.XRPL]?.methods.filter(
            (method) => supportedMethods.includes(method),
          ) ?? []),
        ]),
      ];

      const events = [
        ...new Set([
          ...(requiredNamespaces[SupportedNamespace.XRPL]?.events ?? []),
          ...(optionalNamespaces[SupportedNamespace.XRPL]?.events ?? []),
        ]),
      ];

      return {
        chains: [...new Set(dataToSend.map((e) => e.chain))],
        methods,
        events,
        accounts: dataToSend.map((e) => e.account),
      };
    },
    [accounts.data, session, selectedAccounts],
  );

  const buildSupportedNamespaces = useCallback(
    (session: SessionTypes.Struct) => {
      const { requiredNamespaces, optionalNamespaces } = session;

      const supportedNamespaces: BuildApprovedNamespacesParams["supportedNamespaces"] =
        {};

      if ("bip122" in requiredNamespaces || "bip122" in optionalNamespaces) {
        supportedNamespaces[SupportedNamespace.BIP122] = buildBip122Namespace(
          requiredNamespaces,
          optionalNamespaces,
        );
      }
      if ("eip155" in requiredNamespaces || "eip155" in optionalNamespaces) {
        supportedNamespaces[SupportedNamespace.EIP155] = buildEip155Namespace(
          requiredNamespaces,
          optionalNamespaces,
        );
      }
      if ("mvx" in requiredNamespaces || "mvx" in optionalNamespaces) {
        supportedNamespaces[SupportedNamespace.MVX] = buildMvxNamespace(
          requiredNamespaces,
          optionalNamespaces,
        );
      }
      if ("xrpl" in requiredNamespaces || "xrpl" in optionalNamespaces) {
        supportedNamespaces[SupportedNamespace.XRPL] = buildXrpNamespace(
          requiredNamespaces,
          optionalNamespaces,
        );
      }
      return supportedNamespaces;
    },
    [
      buildBip122Namespace,
      buildEip155Namespace,
      buildMvxNamespace,
      buildXrpNamespace,
    ],
  );

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
      const namespaces = buildSupportedNamespaces(session);

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
    } finally {
      setUpdating(false);
      setEditingSession(false);
    }
  }, [
    selectedAccounts.length,
    buildSupportedNamespaces,
    session,
    walletKit,
    queryClient,
    sessionsQueryFn,
  ]);

  useEffect(() => {
    console.log("session", session);
    console.log("selectedAccount", selectedAccounts);
  }, [session, selectedAccounts]);

  const handleSwitch = useCallback(
    async (account: Account) => {
      if (mainAccount?.id === account.id) return;

      const chainId = getNamespace(account.currency);
      const [namespace, chainValue] = chainId.split(":");

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

      const caipAccount = `${chainId}:${account.address}`;
      const existingNamespace = session.namespaces[namespace];
      delete session.namespaces[namespace];

      await walletKit.updateSession({
        topic: session.topic,
        namespaces: {
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
        },
      });

      setMainAccount(account);
      setShowModal(true);
    },
    [
      mainAccount?.id,
      session.namespaces,
      session.topic,
      setMainAccount,
      setShowModal,
      walletKit,
    ],
  );

  function getAccountsFromAddresses(addresses: string[], accounts: Account[]) {
    const accountsByChain = new Map<string, Account[]>();

    addresses.forEach((addr) => {
      const addrSplitted = addr.split(":");
      const chain = getCurrencyByChainId(
        `${addrSplitted[0]}:${addrSplitted[1]}`,
      );
      let chainInLedgerLive = chain;

      if (chain.startsWith("mvx")) {
        chainInLedgerLive = "elrond";
      }

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
    editingSession,
    setEditingSession,
    mainAccount,
    setMainAccount,
    handleSwitch,
    updating,
    setUpdating,
    disconnecting,
    handleDelete,
  };
}
