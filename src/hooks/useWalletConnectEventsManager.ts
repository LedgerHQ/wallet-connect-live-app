import { SignClientTypes } from "@walletconnect/types";
import { useCallback, useEffect } from "react";
import { Web3WalletTypes } from "@walletconnect/web3wallet";
import { getAccountWithAddressAndChainId } from "@/helpers/generic";
import { stripHexPrefix } from "@/utils/currencyFormatter/helpers";
import { convertEthToLiveTX } from "@/helpers/converters";
import { accountSelector, useAccountsStore } from "@/storage/accounts.store";
import { EIP155_SIGNING_METHODS } from "@/data/methods/EIP155Data.methods";
import { web3wallet } from "@/helpers/walletConnect.util";
import { sessionSelector, useSessionsStore } from "@/storage/sessions.store";
import {
  pendingFlowSelector,
  usePendingFlowStore,
} from "@/storage/pendingFlow.store";
import { captureException } from "@sentry/react";
import { isEIP155Chain, isDataInvalid } from "@/helpers/helper.util";
import { TabsIndexes } from "@/shared/navigation";
import { useNavigate } from "@tanstack/react-router";
import { useWalletAPIClient } from "@ledgerhq/wallet-api-client-react";

enum Errors {
  userDecline = "User rejected",
  txDeclined = "Transaction declined",
  msgDecline = "Message signed declined",
}

export default function useWalletConnectEventsManager(initialized: boolean) {
  const navigate = useNavigate();
  const setProposal = useSessionsStore(sessionSelector.setProposal);
  const removeSession = useSessionsStore(sessionSelector.removeSession);
  const accounts = useAccountsStore(accountSelector.selectAccounts);
  const pendingFlow = usePendingFlowStore(
    pendingFlowSelector.selectPendingFlow
  );
  const addPendingFlow = usePendingFlowStore(
    pendingFlowSelector.addPendingFlow
  );
  const clearPendingFlow = usePendingFlowStore(
    pendingFlowSelector.clearPendingFlow
  );

  const { client } = useWalletAPIClient();

  /******************************************************************************
   * 1. Open session proposal modal for confirmation / rejection
   *****************************************************************************/
  const onSessionProposal = useCallback(
    (proposal: Web3WalletTypes.SessionProposal) => {
      setProposal(proposal);
      void navigate({ to: "/proposal" });
    },
    []
  );

  const onAuthRequest = useCallback((_request: Web3WalletTypes.AuthRequest) => {
    // ModalStore.open('AuthRequestModal', { request })
  }, []);

  /******************************************************************************
   * 3. Open request handling modal based on method that was used
   *****************************************************************************/
  const onSessionRequest = useCallback(
    async (requestEvent: SignClientTypes.EventArguments["session_request"]) => {
      const { topic, params, id } = requestEvent;
      const { request, chainId } = params;

      console.log("onSessionRequest ", requestEvent);

      if (isEIP155Chain(chainId)) {
        handleEIP155Request(request, topic, id, chainId);
      } else {
        console.error("Not Supported Chain");
      }
    },
    []
  );

  const onSessionDeleted = useCallback(
    async (session: SignClientTypes.EventArguments["session_delete"]) => {
      await web3wallet
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
          removeSession(session.topic);
          void navigate({
            to: "/",
            search: { tab: TabsIndexes.Sessions },
          });
        });
    },
    []
  );

  const triggerPendingFlow = useCallback(async () => {
    if (pendingFlow) {
      try {
        clearPendingFlow();
        if (client && pendingFlow.message) {
          const signedMessage = await client.message.sign(
            pendingFlow.accountId,
            pendingFlow.isHex
              ? Buffer.from(pendingFlow.message, "hex")
              : Buffer.from(pendingFlow.message)
          );
          return acceptRequest(
            pendingFlow.topic,
            pendingFlow.id,
            formatMessage(signedMessage)
          );
        }
        if (client && pendingFlow.ethTx) {
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
            return acceptRequest(pendingFlow.topic, pendingFlow.id, hash);
          } else {
            const hash = await client.transaction.sign(
              pendingFlow.accountId,
              liveTx
            );
            return acceptRequest(
              pendingFlow.topic,
              pendingFlow.id,
              hash.toString()
            );
          }
        }
      } catch (error) {
        rejectRequest(pendingFlow.topic, pendingFlow.id, Errors.userDecline);
        console.error(error);
      }
    }
  }, [pendingFlow, clearPendingFlow]);

  /******************************************************************************
   * Set up WalletConnect event listeners
   *****************************************************************************/
  useEffect(() => {
    if (initialized && web3wallet) {
      console.log("initialized web3wallet");
      // sign
      web3wallet.on("session_proposal", onSessionProposal);
      web3wallet.on("session_request", onSessionRequest);
      // auth
      web3wallet.on("auth_request", onAuthRequest);

      // TODOs
      // web3wallet.on('session_ping', (data) => console.log('ping', data))
      // web3wallet.on('session_event', (data) => console.log('event', data))
      // web3wallet.on('session_update', (data) => console.log('update', data))
      web3wallet.on("session_delete", onSessionDeleted);
    }
  }, [initialized, web3wallet]);

  useEffect(() => {
    if (initialized && web3wallet && pendingFlow) {
      triggerPendingFlow();
    }
  }, [initialized]);

  /******************************************************************************
   * Util functions
   *****************************************************************************/

  const formatMessage = (buffer: Buffer) => {
    const message = stripHexPrefix(
      buffer.toString().match(/^ *(0x)?([a-fA-F0-9]+) *$/)
        ? buffer.toString()
        : buffer.toString("hex")
    );
    return "0x" + message;
  };

  const acceptRequest = (topic: string, id: number, signedMessage: string) => {
    web3wallet.respondSessionRequest({
      topic,
      response: {
        id,
        jsonrpc: "2.0",
        result: signedMessage,
      },
    });
  };

  const rejectRequest = (topic: string, id: number, message: Errors) => {
    web3wallet.respondSessionRequest({
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

  /******************************************************************************
   * EIP155
   *****************************************************************************/

  async function handleEIP155Request(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request: { method: string; params: any },
    topic: string,
    id: number,
    chainId: string
  ) {
    switch (request.method) {
      case EIP155_SIGNING_METHODS.ETH_SIGN:
      case EIP155_SIGNING_METHODS.PERSONAL_SIGN: {
        const isPersonalSign =
          request.method === EIP155_SIGNING_METHODS.PERSONAL_SIGN;
        const accountSign = getAccountWithAddressAndChainId(
          accounts,
          isPersonalSign ? request.params[1] : request.params[0],
          chainId
        );
        if (accountSign && client) {
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
            acceptRequest(topic, id, formatMessage(signedMessage));
          } catch (error) {
            rejectRequest(topic, id, Errors.userDecline);
            console.error(error);
          }
          clearPendingFlow();
        } else {
          rejectRequest(topic, id, Errors.userDecline);
        }
        break;
      }
      case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA:
      case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3:
      case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4: {
        const accountSignTyped = getAccountWithAddressAndChainId(
          accounts,
          request.params[0],
          chainId
        );
        if (accountSignTyped && client) {
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
            acceptRequest(topic, id, formatMessage(signedMessage));
          } catch (error) {
            rejectRequest(topic, id, Errors.msgDecline);
            console.error(error);
          }
          clearPendingFlow();
        } else {
          rejectRequest(topic, id, Errors.msgDecline);
        }
        break;
      }
      case EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION: {
        const ethTx = request.params[0];
        const accountTX = getAccountWithAddressAndChainId(
          accounts,
          ethTx.from,
          chainId
        );
        if (accountTX && client) {
          try {
            const liveTx = convertEthToLiveTX(ethTx);
            addPendingFlow({
              id,
              topic,
              accountId: accountTX.id,
              ethTx,
              txHadSomeData: ethTx.data && ethTx.data.length > 0,
              send: true,
            });
            const hash = await client.transaction.signAndBroadcast(
              accountTX.id,
              liveTx
            );
            acceptRequest(topic, id, hash);
          } catch (error) {
            rejectRequest(topic, id, Errors.txDeclined);
            console.error(error);
          }
          clearPendingFlow();
        } else {
          rejectRequest(topic, id, Errors.txDeclined);
        }
        break;
      }
      case EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION: {
        const ethTx = request.params[0];
        const accountTX = getAccountWithAddressAndChainId(
          accounts,
          ethTx.from,
          chainId
        );
        if (accountTX && client) {
          try {
            const liveTx = convertEthToLiveTX(ethTx);
            addPendingFlow({
              id,
              topic,
              accountId: accountTX.id,
              ethTx,
              txHadSomeData: ethTx.data && ethTx.data.length > 0,
            });
            const hash = await client.transaction.sign(accountTX.id, liveTx);
            acceptRequest(topic, id, hash.toString());
          } catch (error) {
            rejectRequest(topic, id, Errors.txDeclined);
            console.error(error);
          }
          clearPendingFlow();
        } else {
          rejectRequest(topic, id, Errors.txDeclined);
        }
        break;
      }
      default:
        return; // ModalStore.open('SessionUnsuportedMethodModal', { requestEvent, requestSession })
    }
  }
}
