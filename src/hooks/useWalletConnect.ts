import { walletAPIClientAtom } from "@/store/wallet-api.store";
import {
  connectionStatusAtom,
  coreAtom,
  loadingAtom,
  oneClickAuthPayloadAtom,
  showBackToBrowserModalAtom,
  verifyContextByTopicAtom,
  walletKitAtom,
} from "@/store/walletKit.store";
import {
  getErrorMessage,
  isBIP122Chain,
  isEIP155Chain,
  isMultiversXChain,
  isRippleChain,
} from "@/utils/helper.util";
import { WalletKitTypes } from "@reown/walletkit";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { SignClientTypes } from "@walletconnect/types";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { enqueueSnackbar } from "notistack";
import { useCallback, useEffect } from "react";
import { isWalletRequest } from "../utils/helper.util";
import { handleBIP122Request } from "./requestHandlers/BIP122";
import { handleEIP155Request } from "./requestHandlers/EIP155";
import { handleMvxRequest } from "./requestHandlers/MultiversX";
import { handleXrpRequest } from "./requestHandlers/Ripple";
import { Errors, rejectRequest } from "./requestHandlers/utils";
import { handleWalletRequest } from "./requestHandlers/Wallet";
import useAccounts from "./useAccounts";
import {
  queryKey as pendingProposalsQueryKey,
  useQueryFn as usePendingProposalsQueryFn,
} from "./usePendingProposals";
import { queryKey as sessionsQueryKey } from "./useSessions";
import { OneClickAuthPayload } from "@/types/types";

function useWalletConnectStatus() {
  const core = useAtomValue(coreAtom);
  const [connectionStatus, setConnectionStatus] = useAtom(connectionStatusAtom);

  useEffect(() => {
    if (core.relayer.connected && connectionStatus !== "connected") {
      setConnectionStatus("connected");
      enqueueSnackbar("Connected to WalletConnect", {
        connected: true,
        variant: "connectionNotification",
        anchorOrigin: {
          vertical: "top",
          horizontal: "right",
        },
      });
    }
  }, [connectionStatus, core.relayer, setConnectionStatus]);

  useEffect(() => {
    const onConnect = () => {
      setConnectionStatus("connected");
      enqueueSnackbar("Connected to WalletConnect", {
        connected: true,
        variant: "connectionNotification",
        anchorOrigin: {
          vertical: "top",
          horizontal: "right",
        },
      });
    };

    const onDisconnect = () => {
      setConnectionStatus("disconnected");
      enqueueSnackbar("Disconnected from WalletConnect", {
        connected: false,
        variant: "connectionNotification",
        anchorOrigin: {
          vertical: "top",
          horizontal: "right",
        },
      });
    };

    core.relayer.on("relayer_connect", onConnect);
    core.relayer.on("relayer_disconnect", onDisconnect);

    return () => {
      core.relayer.off("relayer_connect", onConnect);
      core.relayer.off("relayer_disconnect", onDisconnect);
    };
  }, [core.relayer, setConnectionStatus]);
}

export default function useWalletConnect() {
  useWalletConnectStatus();

  const navigate = useNavigate({ from: "/" });
  const walletKit = useAtomValue(walletKitAtom);

  const queryClient = useQueryClient();

  const client = useAtomValue(walletAPIClientAtom);
  const setVerifyContextByTopic = useSetAtom(verifyContextByTopicAtom);

  const accounts = useAccounts(client);

  const onProposalExpire = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: pendingProposalsQueryKey,
    });
  }, [queryClient]);

  const pendingProposalsQueryFn = usePendingProposalsQueryFn(walletKit);

  const onSessionProposal = useCallback(
    (proposal: WalletKitTypes.SessionProposal) => {
      setVerifyContextByTopic((verifyByTopic) => {
        verifyByTopic[proposal.params.pairingTopic] = proposal.verifyContext;
        return verifyByTopic;
      });

      void queryClient
        .invalidateQueries({
          queryKey: pendingProposalsQueryKey,
        })
        .then(() => {
          // Prefetching as we need the data in the next route to avoid redirecting to home
          return queryClient.prefetchQuery({
            queryKey: pendingProposalsQueryKey,
            queryFn: pendingProposalsQueryFn,
          });
        })
        .then(() => {
          return navigate({
            to: "/proposal/$id",
            params: { id: proposal.id.toString() },
            search: (search) => search,
          });
        });
    },
    [navigate, pendingProposalsQueryFn, queryClient, setVerifyContextByTopic],
  );

  const setShowModal = useSetAtom(showBackToBrowserModalAtom);
  const redirectToDapp = useCallback(
    (topic: string) => {
      const session = walletKit.engine.signClient.session.get(topic);
      if (session) {
        const url =
          session.peer.metadata.redirect?.native ??
          session.peer.metadata.redirect?.universal;
        if (url) {
          window.open(url);
        } else {
          setShowModal(true);
        }
      }
    },
    [setShowModal, walletKit.engine.signClient.session],
  );

  const setLoading = useSetAtom(loadingAtom);
  const onSessionRequest = useCallback(
    (requestEvent: SignClientTypes.EventArguments["session_request"]) => {
      const {
        topic,
        params: { request, chainId },
        id,
        verifyContext,
      } = requestEvent;

      setVerifyContextByTopic((verifyByTopic) => {
        verifyByTopic[topic] = verifyContext;
        return verifyByTopic;
      });

      void (async () => {
        try {
          if (isWalletRequest(request)) {
            await handleWalletRequest(
              request,
              topic,
              id,
              chainId,
              accounts.data,
              client,
              walletKit,
              queryClient,
            );
          } else if (isEIP155Chain(chainId, request)) {
            await handleEIP155Request(
              request,
              topic,
              id,
              chainId,
              accounts.data,
              client,
              walletKit,
            );
          } else if (isMultiversXChain(chainId, request)) {
            await handleMvxRequest(
              request,
              topic,
              id,
              chainId,
              accounts.data,
              client,
              walletKit,
            );
          } else if (isBIP122Chain(chainId, request)) {
            await handleBIP122Request(
              request,
              topic,
              id,
              chainId,
              accounts.data,
              client,
              walletKit,
            );
          } else if (isRippleChain(chainId, request)) {
            await handleXrpRequest(
              request,
              topic,
              id,
              chainId,
              accounts.data,
              client,
              walletKit,
            );
          } else {
            console.error("Not Supported Chain");
            await rejectRequest(
              walletKit,
              topic,
              id,
              Errors.unsupportedChains,
              5100,
            );
          }
        } catch (error) {
          enqueueSnackbar(getErrorMessage(error), {
            errorType: "Session request error",
            variant: "errorNotification",
            anchorOrigin: {
              vertical: "top",
              horizontal: "right",
            },
          });
          await rejectRequest(walletKit, topic, id, Errors.txDeclined);
        }
      })().finally(() => {
        setLoading(false);
        redirectToDapp(topic);
        void queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
      });
    },
    [
      setVerifyContextByTopic,
      accounts.data,
      client,
      walletKit,
      queryClient,
      setLoading,
      redirectToDapp,
    ],
  );

  const onSessionDeleted = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
  }, [queryClient]);

  const setOneClickAuthPayload = useSetAtom(oneClickAuthPayloadAtom);
  const onSessionAuthenticate = useCallback(
    (payload: OneClickAuthPayload) => {
      setVerifyContextByTopic((verifyByTopic) => {
        verifyByTopic[payload.topic] = payload.verifyContext!;
        return verifyByTopic;
      });

      try {
        void (async () => {
          setOneClickAuthPayload(payload);
          await navigate({
            to: "/oneclickauth",
            search: (search) => search,
          });
        })();
      } catch (_) {
        void walletKit.rejectSessionAuthenticate({
          id: payload.id,
          reason: {
            code: 5000,
            message: "USER_REJECTED_METHODS",
          },
        });
      }
    },
    [navigate, setOneClickAuthPayload, setVerifyContextByTopic, walletKit],
  );

  useEffect(() => {
    console.log("walletKit setup listeners");
    // TODO: handle session_request_expire
    // walletKit.on("session_request_expire", );

    // sign
    walletKit.on("proposal_expire", onProposalExpire);
    walletKit.on("session_proposal", onSessionProposal);
    walletKit.on("session_request", onSessionRequest);
    walletKit.on("session_delete", onSessionDeleted);
    walletKit.on("session_authenticate", onSessionAuthenticate);

    // auth
    // walletKit.on("auth_request", onAuthRequest);
    return () => {
      console.log("walletKit cleanup listeners");
      // sign
      walletKit.off("proposal_expire", onProposalExpire);
      walletKit.off("session_proposal", onSessionProposal);
      walletKit.off("session_request", onSessionRequest);
      walletKit.off("session_delete", onSessionDeleted);
      walletKit.on("session_authenticate", onSessionAuthenticate);

      // auth
      // walletKit.off("auth_request", onAuthRequest);
    };
  }, [
    walletKit,
    onSessionProposal,
    onSessionRequest,
    onSessionDeleted,
    onProposalExpire,
    onSessionAuthenticate,
  ]);
}
