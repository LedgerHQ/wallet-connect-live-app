import { EIP155_SIGNING_METHODS } from "@/data/methods/EIP155Data.methods";
import { EIP155_CHAINS } from "@/data/network.config";
import useAccounts, { queryKey as accountsQueryKey } from "@/hooks/useAccounts";
import useAnalytics from "@/hooks/useAnalytics";
import { walletAPIClientAtom } from "@/store/wallet-api.store";
import {
  showBackToBrowserModalAtom,
  walletKitAtom,
} from "@/store/walletKit.store";
import { getAccountWithAddressAndChainId } from "@/utils/generic";
import { getErrorMessage } from "@/utils/helper.util";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AuthTypes } from "@walletconnect/types";
import { buildAuthObject, populateAuthPayload } from "@walletconnect/utils";
import { useAtomValue, useSetAtom } from "jotai";
import { enqueueSnackbar } from "notistack";
import { useCallback, useState } from "react";
import { sortedRecentConnectionAppsAtom } from "../store/recentConnectionAppsAtom";
import { formatMessage } from "./requestHandlers/utils";
import { queryKey as pendingProposalsQueryKey } from "./usePendingProposals";
import {
  queryKey as sessionsQueryKey,
  useQueryFn as useSessionsQueryFn,
} from "./useSessions";

export function useAuthPayload(
  payload: AuthTypes.BaseEventArgs<AuthTypes.SessionAuthenticateRequestParams>,
) {
  const navigate = useNavigate({ from: "/proposal/$id" });
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

  const buildEip155AuthPayload = useCallback(() => {
    const supportedMethods = Object.values(EIP155_SIGNING_METHODS);

    const supportedChains = Object.values(EIP155_CHAINS).map(
      (network) => network.namespace,
    );

    return {
      chains: supportedChains,
      methods: supportedMethods,
      // accounts: dataToSend.map((e) => e.account), // TODO(Canestin) check if used
    };
  }, []);

  const sessionsQueryFn = useSessionsQueryFn(walletKit);

  const setShowModal = useSetAtom(showBackToBrowserModalAtom);
  const url =
    payload.params.requester.metadata?.redirect?.native ??
    payload.params.requester.metadata?.redirect?.universal;

  const redirectToDapp = useCallback(() => {
    if (url) {
      window.open(url);
    } else {
      setShowModal(true);
    }
  }, [setShowModal, url]);

  const approveSessionAuthenticate = useCallback(async () => {
    try {
      const { chains, methods } = buildEip155AuthPayload();

      // Populate the authentication payload with the supported chains and methods
      const authPayload = populateAuthPayload({
        authPayload: payload.params.authPayload,
        chains,
        methods,
      });

      // const addr = accounts.data[0].address;
      const addr = "0x90D5b3f3FaA3cd61fBd78bF1CE3DdB2100F4BFb2";
      // Prepare the user's address in CAIP10(https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-10.md) format
      const iss = `eip155:1:${addr}`;
      // Now you can use the authPayload to format the authentication message
      const message = walletKit.formatAuthMessage({
        request: authPayload,
        iss,
      });

      console.log("message de chez message", message);

      // ———————
      // Present the authentication message to the user

      const accountSign = getAccountWithAddressAndChainId(
        accounts.data,
        addr,
        "eip155:1",
      )!;

      const signedMessage = await client.message.sign(
        accountSign.id,
        Buffer.from(message, "utf-8"),
      );

      // Build the authentication object(s)
      const auth = buildAuthObject(
        authPayload,
        {
          t: "eip191",
          s: formatMessage(signedMessage),
          // s: formatMessage(signedMessage).replace("0x", ""),
        },
        iss,
      );

      const { session } = await walletKit.approveSessionAuthenticate({
        id: payload.id,
        auths: [auth],
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
      addAppToLastConnectionApps(session!.peer.metadata);
      // Remove the uri from the search params to avoid trying to connect again if the user reload the current page
      await navigate({
        to: "/detail/$topic",
        params: { topic: session!.topic },
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
    buildEip155AuthPayload,
    payload.params.authPayload,
    payload.id,
    walletKit,
    accounts.data,
    client.message,
    queryClient,
    sessionsQueryFn,
    addAppToLastConnectionApps,
    navigate,
    redirectToDapp,
  ]);

  const rejectSession = useCallback(async () => {
    try {
      await walletKit.rejectSession({
        id: payload.id,
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
  }, [navigate, payload.id, queryClient, redirectToDapp, walletKit]);

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
    approveSessionAuthenticate,
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
