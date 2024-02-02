import { SignClientTypes } from "@walletconnect/types";
import { useCallback, useEffect } from "react";
import { Web3WalletTypes } from "@walletconnect/web3wallet";
import { getAccountWithAddressAndChainId } from "@/utils/generic";
import { stripHexPrefix } from "@/utils/currencyFormatter/helpers";
import { convertEthToLiveTX } from "@/utils/converters";
import {
  EIP155_REQUESTS,
  EIP155_SIGNING_METHODS,
} from "@/data/methods/EIP155Data.methods";
import { proposalAtom, web3walletAtom } from "@/store/web3wallet.store";
import {
  pendingFlowSelector,
  usePendingFlowStore,
} from "@/store/pendingFlow.store";
import { captureException } from "@sentry/react";
import { isEIP155Chain, isDataInvalid } from "@/utils/helper.util";
import { TabsIndexes } from "@/types/types";
import { useNavigate } from "@tanstack/react-router";
import { WalletAPIClient } from "@ledgerhq/wallet-api-client";
import { useAtomValue, useSetAtom } from "jotai";
import { Web3Wallet } from "@walletconnect/web3wallet/dist/types/client";
import useAccounts from "./useAccounts";
import { walletAPIClientAtom } from "@/store/wallet-api.store";

enum Errors {
  userDecline = "User rejected",
  txDeclined = "Transaction declined",
  msgDecline = "Message signed declined",
}

const formatMessage = (buffer: Buffer) => {
  const message = stripHexPrefix(
    buffer.toString().match(/^ *(0x)?([a-fA-F0-9]+) *$/)
      ? buffer.toString()
      : buffer.toString("hex")
  );
  return "0x" + message;
};

const acceptRequest = (
  web3wallet: Web3Wallet,
  topic: string,
  id: number,
  signedMessage: string
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
  message: Errors
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

function usePendingFlow(
  web3wallet: Web3Wallet,
  clearPendingFlow: () => void,
  client: WalletAPIClient
) {
  const pendingFlow = usePendingFlowStore(
    pendingFlowSelector.selectPendingFlow
  );

  const triggerPendingFlow = useCallback(async () => {
    if (pendingFlow) {
      try {
        clearPendingFlow();
        if (pendingFlow.message) {
          const signedMessage = await client.message.sign(
            pendingFlow.accountId,
            pendingFlow.isHex
              ? Buffer.from(pendingFlow.message, "hex")
              : Buffer.from(pendingFlow.message)
          );
          return acceptRequest(
            web3wallet,
            pendingFlow.topic,
            pendingFlow.id,
            formatMessage(signedMessage)
          );
        }
        if (pendingFlow.ethTx) {
          const liveTx = convertEthToLiveTX(pendingFlow.ethTx);
          // If the transaction initally had some data and we somehow lost them
          // then we don't signAndBroadcast the transaction to protect our users funds
          if (pendingFlow.txHadSomeData && isDataInvalid(liveTx.data)) {
            const error = new Error(
              "The pending transaction triggered was expected to have some data but its data was empty"
            );
            captureException(error);
            throw error;
          }
          if (pendingFlow.send) {
            const hash = await client.transaction.signAndBroadcast(
              pendingFlow.accountId,
              liveTx
            );
            return acceptRequest(
              web3wallet,
              pendingFlow.topic,
              pendingFlow.id,
              hash
            );
          } else {
            const hash = await client.transaction.sign(
              pendingFlow.accountId,
              liveTx
            );
            return acceptRequest(
              web3wallet,
              pendingFlow.topic,
              pendingFlow.id,
              hash.toString()
            );
          }
        }
      } catch (error) {
        console.error(error);
        return rejectRequest(
          web3wallet,
          pendingFlow.topic,
          pendingFlow.id,
          Errors.userDecline
        );
      }
    }
  }, [pendingFlow, clearPendingFlow, client, web3wallet]);

  useEffect(() => {
    if (web3wallet && pendingFlow) {
      void triggerPendingFlow();
    }
  }, [pendingFlow, triggerPendingFlow, web3wallet]);
}

export default function useWalletConnectEventsManager() {
  const navigate = useNavigate();
  const setProposal = useSetAtom(proposalAtom);
  const web3wallet = useAtomValue(web3walletAtom);

  const client = useAtomValue(walletAPIClientAtom);

  const accounts = useAccounts(client);

  const addPendingFlow = usePendingFlowStore(
    pendingFlowSelector.addPendingFlow
  );
  const clearPendingFlow = usePendingFlowStore(
    pendingFlowSelector.clearPendingFlow
  );

  const onSessionProposal = useCallback(
    (proposal: Web3WalletTypes.SessionProposal) => {
      setProposal(proposal);
      void navigate({ to: "/proposal", search: (search) => search });
    },
    [setProposal, navigate]
  );

  const handleEIP155Request = useCallback(
    async (
      request: EIP155_REQUESTS,
      topic: string,
      id: number,
      chainId: string
    ) => {
      switch (request.method) {
        case EIP155_SIGNING_METHODS.ETH_SIGN:
        case EIP155_SIGNING_METHODS.PERSONAL_SIGN: {
          const isPersonalSign =
            request.method === EIP155_SIGNING_METHODS.PERSONAL_SIGN;
          const accountSign = getAccountWithAddressAndChainId(
            accounts.data,
            isPersonalSign ? request.params[1] : request.params[0],
            chainId
          );
          if (accountSign) {
            try {
              const message = stripHexPrefix(
                isPersonalSign ? request.params[0] : request.params[1]
              );

              addPendingFlow({
                id,
                topic,
                accountId: accountSign.id,
                message,
                isHex: true,
              });
              const signedMessage = await client.message.sign(
                accountSign.id,
                Buffer.from(message, "hex")
              );
              void acceptRequest(
                web3wallet,
                topic,
                id,
                formatMessage(signedMessage)
              );
            } catch (error) {
              void rejectRequest(web3wallet, topic, id, Errors.userDecline);
              console.error(error);
            }
            clearPendingFlow();
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
            chainId
          );
          if (accountSignTyped) {
            try {
              const message = stripHexPrefix(request.params[1]);

              addPendingFlow({
                id,
                topic,
                accountId: accountSignTyped.id,
                message,
              });
              const signedMessage = await client.message.sign(
                accountSignTyped.id,
                Buffer.from(message)
              );
              void acceptRequest(
                web3wallet,
                topic,
                id,
                formatMessage(signedMessage)
              );
            } catch (error) {
              void rejectRequest(web3wallet, topic, id, Errors.msgDecline);
              console.error(error);
            }
            clearPendingFlow();
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
            chainId
          );
          if (accountTX) {
            try {
              const liveTx = convertEthToLiveTX(ethTx);
              addPendingFlow({
                id,
                topic,
                accountId: accountTX.id,
                ethTx,
                txHadSomeData: ethTx.data ? ethTx.data.length > 0 : false,
                send: true,
              });
              const hash = await client.transaction.signAndBroadcast(
                accountTX.id,
                liveTx
              );
              void acceptRequest(web3wallet, topic, id, hash);
            } catch (error) {
              void rejectRequest(web3wallet, topic, id, Errors.txDeclined);
              console.error(error);
            }
            clearPendingFlow();
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
            chainId
          );
          if (accountTX) {
            try {
              const liveTx = convertEthToLiveTX(ethTx);
              addPendingFlow({
                id,
                topic,
                accountId: accountTX.id,
                ethTx,
                txHadSomeData: ethTx.data ? ethTx.data.length > 0 : false,
              });
              const hash = await client.transaction.sign(accountTX.id, liveTx);
              void acceptRequest(web3wallet, topic, id, hash.toString());
            } catch (error) {
              void rejectRequest(web3wallet, topic, id, Errors.txDeclined);
              console.error(error);
            }
            clearPendingFlow();
          } else {
            void rejectRequest(web3wallet, topic, id, Errors.txDeclined);
          }
          break;
        }
        default:
          // TODO handle default case ?
          return; // ModalStore.open('SessionUnsuportedMethodModal', { requestEvent, requestSession })
      }
    },
    [accounts.data, addPendingFlow, clearPendingFlow, client, web3wallet]
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
      } else {
        console.error("Not Supported Chain");
      }
    },
    [handleEIP155Request]
  );

  const onSessionDeleted = useCallback(
    (session: SignClientTypes.EventArguments["session_delete"]) => {
      void web3wallet
        .disconnectSession({
          topic: session.topic,
          reason: {
            code: 3,
            message: "Session has been disconnected",
          },
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          void navigate({
            to: "/",
            search: (search) => ({ ...search, tab: TabsIndexes.Sessions }),
          });
        });
    },
    [web3wallet, navigate]
  );

  useEffect(() => {
    if (web3wallet) {
      console.log("web3wallet setup listeners");
      // sign
      web3wallet.on("session_proposal", onSessionProposal);
      web3wallet.on("session_request", onSessionRequest);
      web3wallet.on("session_delete", onSessionDeleted);

      // auth
      // web3wallet.on("auth_request", onAuthRequest);
    }
    return () => {
      console.log("web3wallet cleanup listeners");
      // sign
      web3wallet.off("session_proposal", onSessionProposal);
      web3wallet.off("session_request", onSessionRequest);
      web3wallet.off("session_delete", onSessionDeleted);

      // auth
      // web3wallet.off("auth_request", onAuthRequest);
    };
  }, [web3wallet, onSessionProposal, onSessionRequest, onSessionDeleted]);

  // TODO maybe redo differently and need to test if we get the last message when reconnecting to wc by default
  // After listeners created
  usePendingFlow(web3wallet, clearPendingFlow, client);
}
