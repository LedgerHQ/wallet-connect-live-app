import type { IWalletKit } from "@reown/walletkit";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import {
  type BIP122_REQUESTS,
  BIP122_RESPONSES,
  BIP122_SIGNING_METHODS,
} from "@/data/methods/BIP122.methods";
import { getAccountWithAddressAndChainId } from "@/utils/generic";
import { convertBtcToLiveTX } from "@/utils/converters";
import {
  acceptRequest,
  Errors,
  formatMessage,
  isCanceledError,
  rejectRequest,
} from "./utils";

export async function handleBIP122Request(
  request: BIP122_REQUESTS,
  topic: string,
  id: number,
  chainId: string,
  accounts: Account[],
  client: WalletAPIClient,
  walletkit: IWalletKit,
) {
  switch (request.method) {
    case BIP122_SIGNING_METHODS.BIP122_SIGN_MESSAGE: {
      const accountSign = getAccountWithAddressAndChainId(
        accounts,
        request.params.address ?? request.params.account,
        chainId,
      );
      if (accountSign) {
        try {
          const message = request.params.message;
          const signedMessage = await client.message.sign(
            accountSign.id,
            Buffer.from(message),
          );
          const result: BIP122_RESPONSES[typeof request.method] = {
            address: accountSign.address,
            signature: formatMessage(signedMessage).replace("0x", ""),
          };

          await acceptRequest(walletkit, topic, id, result);
        } catch (error) {
          if (isCanceledError(error)) {
            await rejectRequest(walletkit, topic, id, Errors.userDecline);
          } else {
            throw error;
          }
        }
      } else {
        await rejectRequest(walletkit, topic, id, Errors.userDecline);
      }
      break;
    }
    case BIP122_SIGNING_METHODS.BIP122_SEND_TRANSFERT: {
      const btcTx = request.params;
      const accountTX = getAccountWithAddressAndChainId(
        accounts,
        request.params.account,
        chainId,
      );
      if (accountTX) {
        try {
          const liveTx = convertBtcToLiveTX(btcTx);
          const hash = await client.transaction.signAndBroadcast(
            accountTX.id,
            liveTx,
          );

          const result: BIP122_RESPONSES[typeof request.method] = {
            txid: hash,
          };

          await acceptRequest(walletkit, topic, id, result);
        } catch (error) {
          if (isCanceledError(error)) {
            await rejectRequest(walletkit, topic, id, Errors.txDeclined);
          } else {
            throw error;
          }
        }
      } else {
        await rejectRequest(walletkit, topic, id, Errors.txDeclined);
      }
      break;
    }
    default:
      await rejectRequest(
        walletkit,
        topic,
        id,
        Errors.unsupportedMethods,
        5101,
      );
  }
}
