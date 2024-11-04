import { SignClientTypes } from "@walletconnect/types";
import { useCallback, useEffect } from "react";
import { Web3WalletTypes } from "@walletconnect/web3wallet";
import { enqueueSnackbar } from "notistack";
import { getErrorMessage } from "@/utils/helper.util";
import {
  coreAtom,
  connectionStatusAtom,
  web3walletAtom,
  loadingAtom,
  showBackToBrowserModalAtom,
} from "@/store/web3wallet.store";
import {
  isEIP155Chain,
  isMultiversXChain,
  isBIP122Chain,
  isRippleChain,
} from "@/utils/helper.util";
import { useNavigate } from "@tanstack/react-router";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import useAccounts from "./useAccounts";
import { walletAPIClientAtom } from "@/store/wallet-api.store";
import { queryKey as sessionsQueryKey } from "./useSessions";
import {
  queryKey as pendingProposalsQueryKey,
  useQueryFn as usePendingProposalsQueryFn,
} from "./usePendingProposals";
import { useQueryClient } from "@tanstack/react-query";
import { handleEIP155Request } from "./requestHandlers/EIP155";
import { handleMvxRequest } from "./requestHandlers/MultiversX";
import { handleBIP122Request } from "./requestHandlers/BIP122";
import { handleXrpRequest } from "./requestHandlers/Ripple";
import { Errors, rejectRequest } from "./requestHandlers/utils";
import { handleWalletRequest } from "./requestHandlers/Wallet";
import { isWalletRequest } from "../utils/helper.util";

function useWalletConnectStatus() {
  const core = useAtomValue(coreAtom);
  const [connectionStatus, setConnectionStatus] = useAtom(connectionStatusAtom);

  useEffect(() => {
    if (core.relayer.connected && connectionStatus !== "connected") {
      setConnectionStatus("connected");
    }
  }, [connectionStatus, core.relayer, setConnectionStatus]);

  useEffect(() => {
    const onConnect = () => {
      setConnectionStatus("connected");
    };

    const onDisconnect = () => {
      setConnectionStatus("disconnected");
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
  const web3wallet = useAtomValue(web3walletAtom);

  const queryClient = useQueryClient();

  const client = useAtomValue(walletAPIClientAtom);

  const accounts = useAccounts(client);

  const onProposalExpire = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: pendingProposalsQueryKey,
    });
  }, [queryClient]);

  const pendingProposalsQueryFn = usePendingProposalsQueryFn(web3wallet);

  // TODO : check if WC provides any another way to get this data
  const onSessionProposal = useCallback(
    (proposal: Web3WalletTypes.SessionProposal) => {
      void web3wallet.core.pairing.updateMetadata({
        topic: proposal.params.pairingTopic,
        metadata: {
          ...proposal.params.proposer.metadata,
          verifyUrl: proposal.verifyContext.verified.isScam
            ? "SCAM"
            : proposal.verifyContext.verified.validation,
        },
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
    [navigate, pendingProposalsQueryFn, queryClient, web3wallet.core.pairing],
  );

  const setShowModal = useSetAtom(showBackToBrowserModalAtom);
  const redirectToDapp = useCallback(
    (topic: string) => {
      const session = web3wallet.engine.signClient.session.get(topic);
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
    [setShowModal, web3wallet.engine.signClient.session],
  );

  const setLoading = useSetAtom(loadingAtom);
  const onSessionRequest = useCallback(
    (requestEvent: SignClientTypes.EventArguments["session_request"]) => {
      const {
        topic,
        params: { request, chainId },
        id,
      } = requestEvent;

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
              web3wallet,
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
              web3wallet,
            );
          } else if (isMultiversXChain(chainId, request)) {
            await handleMvxRequest(
              request,
              topic,
              id,
              chainId,
              accounts.data,
              client,
              web3wallet,
            );
          } else if (isBIP122Chain(chainId, request)) {
            await handleBIP122Request(
              request,
              topic,
              id,
              chainId,
              accounts.data,
              client,
              web3wallet,
            );
          } else if (isRippleChain(chainId, request)) {
            await handleXrpRequest(
              request,
              topic,
              id,
              chainId,
              accounts.data,
              client,
              web3wallet,
            );
          } else {
            console.error("Not Supported Chain");
            await rejectRequest(
              web3wallet,
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
          await rejectRequest(web3wallet, topic, id, Errors.txDeclined);
        }
      })().finally(() => {
        setLoading(false);
        redirectToDapp(topic);
        void queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
      });
    },
    [
      accounts.data,
      client,
      web3wallet,
      queryClient,
      setLoading,
      redirectToDapp,
    ],
  );

  const onSessionDeleted = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
  }, [queryClient]);

  useEffect(() => {
    console.log("web3wallet setup listeners");
    // TODO: handle session_request_expire
    // web3wallet.on("session_request_expire", );

    // sign
    web3wallet.on("proposal_expire", onProposalExpire);
    web3wallet.on("session_proposal", onSessionProposal);
    web3wallet.on("session_request", onSessionRequest);
    web3wallet.on("session_delete", onSessionDeleted);

    // auth
    // web3wallet.on("auth_request", onAuthRequest);
    return () => {
      console.log("web3wallet cleanup listeners");
      // sign
      web3wallet.off("proposal_expire", onProposalExpire);
      web3wallet.off("session_proposal", onSessionProposal);
      web3wallet.off("session_request", onSessionRequest);
      web3wallet.off("session_delete", onSessionDeleted);

      // auth
      // web3wallet.off("auth_request", onAuthRequest);
    };
  }, [
    web3wallet,
    onSessionProposal,
    onSessionRequest,
    onSessionDeleted,
    onProposalExpire,
  ]);
}
