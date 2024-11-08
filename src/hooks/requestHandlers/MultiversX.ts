import type { IWalletKit } from "@reown/walletkit";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import {
  type MULTIVERSX_REQUESTS,
  MULTIVERSX_SIGNING_METHODS,
} from "@/data/methods/MultiversX.methods";
import { getAccountWithAddressAndChainId } from "@/utils/generic";
import { convertMvxToLiveTX } from "@/utils/converters";
import {
  acceptRequest,
  Errors,
  formatMessage,
  isCanceledError,
  rejectRequest,
} from "./utils";

export async function handleMvxRequest(
  request: MULTIVERSX_REQUESTS,
  topic: string,
  id: number,
  _chainId: string,
  accounts: Account[],
  client: WalletAPIClient,
  walletKit: IWalletKit,
) {
  const ledgerLiveCurrency = "elrond";
  switch (request.method) {
    case MULTIVERSX_SIGNING_METHODS.MULTIVERSX_SIGN_MESSAGE: {
      const accountSign = getAccountWithAddressAndChainId(
        accounts,
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
          await acceptRequest(
            walletKit,
            topic,
            id,
            formatMessage(signedMessage),
          );
        } catch (error) {
          if (isCanceledError(error)) {
            await rejectRequest(walletKit, topic, id, Errors.userDecline);
          } else {
            throw error;
          }
        }
      } else {
        await rejectRequest(walletKit, topic, id, Errors.userDecline);
      }
      break;
    }
    case MULTIVERSX_SIGNING_METHODS.MULTIVERSX_SIGN_TRANSACTION: {
      const accountTX = getAccountWithAddressAndChainId(
        accounts,
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
          await acceptRequest(walletKit, topic, id, hash);
        } catch (error) {
          if (isCanceledError(error)) {
            await rejectRequest(walletKit, topic, id, Errors.txDeclined);
          } else {
            throw error;
          }
        }
      } else {
        await rejectRequest(walletKit, topic, id, Errors.txDeclined);
      }
      break;
    }
    case MULTIVERSX_SIGNING_METHODS.MULTIVERSX_SIGN_TRANSACTIONS: {
      for (const transaction of request.params.transactions) {
        const accountTX = getAccountWithAddressAndChainId(
          accounts,
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
            await acceptRequest(walletKit, topic, id, hash);
          } catch (error) {
            if (isCanceledError(error)) {
              await rejectRequest(walletKit, topic, id, Errors.txDeclined);
            } else {
              throw error;
            }
          }
        } else {
          await rejectRequest(walletKit, topic, id, Errors.txDeclined);
        }
      }
      break;
    }
    default:
      await rejectRequest(
        walletKit,
        topic,
        id,
        Errors.unsupportedMethods,
        5101,
      );
  }
}
