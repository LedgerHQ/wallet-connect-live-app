import { useCallback, useState } from "react";
import { getErrorMessage, getNamespace } from "@/utils/helper.util";
import { getAccountWithAddress } from "@/utils/generic";
import { EIP155_SIGNING_METHODS } from "@/data/methods/EIP155Data.methods";
import useAnalytics from "@/hooks/useAnalytics";
import {
  BIP122_CHAINS,
  EIP155_CHAINS,
  MULTIVERS_X_CHAINS,
  RIPPLE_CHAINS,
  SupportedNamespace,
} from "@/data/network.config";
import {
  BuildApprovedNamespacesParams,
  buildApprovedNamespaces,
  buildAuthObject,
  populateAuthPayload,
} from "@walletconnect/utils";
import { formatAccountsByChain } from "@/hooks/useProposal/util";
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
import { OneClickAuthPayload } from "@/types/types";
import { enqueueSnackbar } from "notistack";
import { sortedRecentConnectionAppsAtom } from "../../store/recentConnectionAppsAtom";
import { WALLET_METHODS } from "@/data/methods/Wallet.methods";
import { MULTIVERSX_SIGNING_METHODS } from "@/data/methods/MultiversX.methods";
import { BIP122_SIGNING_METHODS } from "@/data/methods/BIP122.methods";
import { RIPPLE_SIGNING_METHODS } from "@/data/methods/Ripple.methods";
import { formatMessage } from "../requestHandlers/utils";

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
        proposal,
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
    [accounts.data, proposal, selectedAccounts],
  );

  const buildMvxNamespace = useCallback(
    (
      requiredNamespaces: ProposalTypes.RequiredNamespaces,
      optionalNamespaces: ProposalTypes.OptionalNamespaces,
    ) => {
      const accountsByChain = formatAccountsByChain(
        proposal,
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
    [accounts.data, proposal, selectedAccounts],
  );

  const buildBip122Namespace = useCallback(
    (
      requiredNamespaces: ProposalTypes.RequiredNamespaces,
      optionalNamespaces: ProposalTypes.OptionalNamespaces,
    ) => {
      const accountsByChain = formatAccountsByChain(
        proposal,
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
    [accounts.data, proposal, selectedAccounts],
  );

  const buildXrpNamespace = useCallback(
    (
      requiredNamespaces: ProposalTypes.RequiredNamespaces,
      optionalNamespaces: ProposalTypes.OptionalNamespaces,
    ) => {
      const accountsByChain = formatAccountsByChain(
        proposal,
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
    [accounts.data, proposal, selectedAccounts],
  );

  const buildSupportedNamespaces = useCallback(
    (proposal: ProposalTypes.Struct) => {
      const { requiredNamespaces, optionalNamespaces } = proposal;

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

      const message = walletKit.formatAuthMessage({
        request: authPayload,
        iss: firstAccount,
      });

      const accountSign = getAccountWithAddress(
        accounts.data,
        firstAccount.split(":").at(-1)!,
      )!;

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
