import { SignClientTypes } from "@walletconnect/types";
import { useCallback, useEffect } from "react";
import { Web3WalletTypes } from "@walletconnect/web3wallet";
import { getAccountWithAddressAndChainId } from "@/utils/generic";
import { stripHexPrefix } from "@/utils/currencyFormatter/helpers";
import {
  convertEthToLiveTX,
  convertMvxToLiveTX,
  convertXrpToLiveTX,
} from "@/utils/converters";
import {
  EIP155_REQUESTS,
  EIP155_SIGNING_METHODS,
} from "@/data/methods/EIP155Data.methods";
import {
  coreAtom,
  connectionStatusAtom,
  web3walletAtom,
} from "@/store/web3wallet.store";
import {
  isEIP155Chain,
  isMultiversXChain,
  isBIP122Chain,
  isRippleChain,
} from "@/utils/helper.util";
import { useNavigate } from "@tanstack/react-router";
import { useAtom, useAtomValue } from "jotai";
import { Web3Wallet } from "@walletconnect/web3wallet/dist/types/client";
import useAccounts from "./useAccounts";
import { walletAPIClientAtom } from "@/store/wallet-api.store";
import { queryKey as sessionsQueryKey } from "./useSessions";
import {
  queryKey as pendingProposalsQueryKey,
  useQueryFn as usePendingProposalsQueryFn,
} from "./usePendingProposals";
import { useQueryClient } from "@tanstack/react-query";
import {
  MULTIVERSX_REQUESTS,
  MULTIVERSX_SIGNING_METHODS,
} from "@/data/methods/MultiversX.methods";
import {
  BIP122_REQUESTS,
  BIP122_SIGNING_METHODS,
} from "@/data/methods/BIP122.methods";
import {
  RIPPLE_REQUESTS,
  RIPPLE_SIGNING_METHODS,
} from "@/data/methods/Ripple.methods";

enum Errors {
  userDecline = "User rejected",
  txDeclined = "Transaction declined",
  msgDecline = "Message signed declined",
}

const formatMessage = (buffer: Buffer) => {
  const message = stripHexPrefix(
    buffer.toString().match(/^ *(0x)?([a-fA-F0-9]+) *$/)
      ? buffer.toString()
      : buffer.toString("hex"),
  );
  return "0x" + message;
};

const acceptRequest = (
  web3wallet: Web3Wallet,
  topic: string,
  id: number,
  signedMessage: string,
) => {
  return web3wallet.respondSessionRequest({
    topic,
    response: {
      id,
      jsonrpc: "2.0",
      result: signedMessage,
    },
  });
};

const rejectRequest = (
  web3wallet: Web3Wallet,
  topic: string,
  id: number,
  message: Errors,
) => {
  return web3wallet.respondSessionRequest({
    topic,
    response: {
      id,
      jsonrpc: "2.0",
      error: {
        code: 5000,
        message,
      },
    },
  });
};

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

  const navigate = useNavigate();
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

  const onSessionProposal = useCallback(
    async (proposal: Web3WalletTypes.SessionProposal) => {
      await web3wallet.core.pairing.updateMetadata({
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

  const handleEIP155Request = useCallback(
    async (
      request: EIP155_REQUESTS,
      topic: string,
      id: number,
      chainId: string,
    ) => {
      switch (request.method) {
        case EIP155_SIGNING_METHODS.ETH_SIGN:
        case EIP155_SIGNING_METHODS.PERSONAL_SIGN: {
          const isPersonalSign =
            request.method === EIP155_SIGNING_METHODS.PERSONAL_SIGN;
          const accountSign = getAccountWithAddressAndChainId(
            accounts.data,
            isPersonalSign ? request.params[1] : request.params[0],
            chainId,
          );
          if (accountSign) {
            try {
              const message = stripHexPrefix(
                isPersonalSign ? request.params[0] : request.params[1],
              );

              const signedMessage = await client.message.sign(
                accountSign.id,
                Buffer.from(message, "hex"),
              );
              void acceptRequest(
                web3wallet,
                topic,
                id,
                formatMessage(signedMessage),
              );
            } catch (error) {
              void rejectRequest(web3wallet, topic, id, Errors.userDecline);
              console.error(error);
            }
          } else {
            void rejectRequest(web3wallet, topic, id, Errors.userDecline);
          }
          break;
        }
        case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA:
        case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3:
        case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4: {
          const accountSignTyped = getAccountWithAddressAndChainId(
            accounts.data,
            request.params[0],
            chainId,
          );
          if (accountSignTyped) {
            try {
              const message = stripHexPrefix(request.params[1]);

              const signedMessage = await client.message.sign(
                accountSignTyped.id,
                Buffer.from(message),
              );
              void acceptRequest(
                web3wallet,
                topic,
                id,
                formatMessage(signedMessage),
              );
            } catch (error) {
              void rejectRequest(web3wallet, topic, id, Errors.msgDecline);
              console.error(error);
            }
          } else {
            void rejectRequest(web3wallet, topic, id, Errors.msgDecline);
          }
          break;
        }
        case EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION: {
          const ethTx = request.params[0];
          const accountTX = getAccountWithAddressAndChainId(
            accounts.data,
            ethTx.from,
            chainId,
          );
          if (accountTX) {
            try {
              const liveTx = convertEthToLiveTX(ethTx);
              const hash = await client.transaction.signAndBroadcast(
                accountTX.id,
                liveTx,
              );
              void acceptRequest(web3wallet, topic, id, hash);
            } catch (error) {
              void rejectRequest(web3wallet, topic, id, Errors.txDeclined);
              console.error(error);
            }
          } else {
            void rejectRequest(web3wallet, topic, id, Errors.txDeclined);
          }
          break;
        }
        case EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION: {
          const ethTx = request.params[0];
          const accountTX = getAccountWithAddressAndChainId(
            accounts.data,
            ethTx.from,
            chainId,
          );
          if (accountTX) {
            try {
              const liveTx = convertEthToLiveTX(ethTx);
              const hash = await client.transaction.sign(accountTX.id, liveTx);
              void acceptRequest(web3wallet, topic, id, hash.toString());
            } catch (error) {
              void rejectRequest(web3wallet, topic, id, Errors.txDeclined);
              console.error(error);
            }
          } else {
            void rejectRequest(web3wallet, topic, id, Errors.txDeclined);
          }
          break;
        }
        default:
          // TODO handle default case ?
          return;
      }
    },
    [accounts.data, client, web3wallet],
  );

  const handleXrpRequest = useCallback(
    async (
      request: RIPPLE_REQUESTS,
      topic: string,
      id: number,
      _chainId: string,
    ) => {
      const ledgerLiveCurrency = "ripple";
      switch (request.method) {
        case RIPPLE_SIGNING_METHODS.RIPPLE_SIGN_TRANSACTION: {
          const accountTX = getAccountWithAddressAndChainId(
            accounts.data,
            request.params.tx_json.Account,
            ledgerLiveCurrency,
          );

          if (accountTX) {
            try {
              const liveTx = convertXrpToLiveTX(request.params.tx_json);
              const hash = await client.transaction.signAndBroadcast(
                accountTX.id,
                liveTx,
              );
              void acceptRequest(web3wallet, topic, id, hash);
            } catch (error) {
              void rejectRequest(web3wallet, topic, id, Errors.txDeclined);
              console.error(error);
            }
          } else {
            void rejectRequest(web3wallet, topic, id, Errors.txDeclined);
          }
          break;
        }
        default:
          return;
      }
    },
    [accounts.data, client, web3wallet],
  );

  const handleMvxRequest = useCallback(
    async (
      request: MULTIVERSX_REQUESTS,
      topic: string,
      id: number,
      _chainId: string,
    ) => {
      const ledgerLiveCurrency = "elrond";
      switch (request.method) {
        case MULTIVERSX_SIGNING_METHODS.MULTIVERSX_SIGN_MESSAGE: {
          const accountSign = getAccountWithAddressAndChainId(
            accounts.data,
            request.params.address,
            ledgerLiveCurrency,
          );
          if (accountSign) {
            try {
              const message = request.params.message;
              const signedMessage = await client.message.sign(
                accountSign.id,
                Buffer.from(message),
              );
              void acceptRequest(
                web3wallet,
                topic,
                id,
                formatMessage(signedMessage),
              );
            } catch (error) {
              void rejectRequest(web3wallet, topic, id, Errors.userDecline);
              console.error(error);
            }
          } else {
            void rejectRequest(web3wallet, topic, id, Errors.userDecline);
          }
          break;
        }
        case MULTIVERSX_SIGNING_METHODS.MULTIVERSX_SIGN_TRANSACTION: {
          const accountTX = getAccountWithAddressAndChainId(
            accounts.data,
            request.params.transaction.sender,
            ledgerLiveCurrency,
          );
          if (accountTX) {
            try {
              const liveTx = convertMvxToLiveTX(request.params.transaction);
              const hash = await client.transaction.signAndBroadcast(
                accountTX.id,
                liveTx,
              );
              void acceptRequest(web3wallet, topic, id, hash);
            } catch (error) {
              void rejectRequest(web3wallet, topic, id, Errors.txDeclined);
              console.error(error);
            }
          } else {
            void rejectRequest(web3wallet, topic, id, Errors.txDeclined);
          }
          break;
        }
        case MULTIVERSX_SIGNING_METHODS.MULTIVERSX_SIGN_TRANSACTIONS: {
          for (const transaction of request.params.transactions) {
            const accountTX = getAccountWithAddressAndChainId(
              accounts.data,
              transaction.sender,
              ledgerLiveCurrency,
            );
            if (accountTX) {
              try {
                const liveTx = convertMvxToLiveTX(transaction);
                const hash = await client.transaction.signAndBroadcast(
                  accountTX.id,
                  liveTx,
                );
                void acceptRequest(web3wallet, topic, id, hash);
              } catch (error) {
                void rejectRequest(web3wallet, topic, id, Errors.txDeclined);
                console.error(error);
              }
            } else {
              void rejectRequest(web3wallet, topic, id, Errors.txDeclined);
            }
          }
          break;
        }
        default:
          return;
      }
    },
    [accounts.data, client, web3wallet],
  );

  const handleBIP122Request = useCallback(
    async (
      request: BIP122_REQUESTS,
      topic: string,
      id: number,
      chainId: string,
    ) => {
      switch (request.method) {
        case BIP122_SIGNING_METHODS.BIP122_SIGN_MESSAGE: {
          const accountSign = getAccountWithAddressAndChainId(
            accounts.data,
            request.params.address,
            chainId,
          );
          if (accountSign) {
            try {
              const message = request.params.message;
              const signedMessage = await client.message.sign(
                accountSign.id,
                Buffer.from(message),
              );
              void acceptRequest(
                web3wallet,
                topic,
                id,
                formatMessage(signedMessage),
              );
            } catch (error) {
              void rejectRequest(web3wallet, topic, id, Errors.userDecline);
              console.error(error);
            }
          } else {
            void rejectRequest(web3wallet, topic, id, Errors.userDecline);
          }
          break;
        }
        default:
          return;
      }
    },
    [accounts.data, client, web3wallet],
  );

  const onSessionRequest = useCallback(
    (requestEvent: SignClientTypes.EventArguments["session_request"]) => {
      const {
        topic,
        params: { request, chainId },
        id,
      } = requestEvent;

      console.log("onSessionRequest: ", requestEvent);

      if (isEIP155Chain(chainId, request)) {
        void handleEIP155Request(request, topic, id, chainId);
      } else if (isMultiversXChain(chainId, request)) {
        void handleMvxRequest(request, topic, id, chainId);
      } else if (isBIP122Chain(chainId, request)) {
        void handleBIP122Request(request, topic, id, chainId);
      } else if (isRippleChain(chainId, request)) {
        void handleXrpRequest(request, topic, id, chainId);
      } else {
        console.error("Not Supported Chain");
      }
    },
    [
      handleBIP122Request,
      handleEIP155Request,
      handleMvxRequest,
      handleXrpRequest,
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
