import type { Web3Wallet } from "@walletconnect/web3wallet/dist/types/client";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import {
  type BIP122_REQUESTS,
  BIP122_SIGNING_METHODS,
} from "@/data/methods/BIP122.methods";
import { getAccountWithAddressAndChainId } from "@/utils/generic";
import { acceptRequest, Errors, formatMessage, rejectRequest } from "./utils";

export async function handleBIP122Request(
  request: BIP122_REQUESTS,
  topic: string,
  id: number,
  chainId: string,
  accounts: Account[],
  client: WalletAPIClient,
  web3wallet: Web3Wallet,
) {
  switch (request.method) {
    case BIP122_SIGNING_METHODS.BIP122_SIGN_MESSAGE: {
      const accountSign = getAccountWithAddressAndChainId(
        accounts,
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
          await acceptRequest(
            web3wallet,
            topic,
            id,
            formatMessage(signedMessage),
          );
        } catch (error) {
          await rejectRequest(web3wallet, topic, id, Errors.userDecline);
          console.error(error);
        }
      } else {
        await rejectRequest(web3wallet, topic, id, Errors.userDecline);
      }
      break;
    }
    default:
      await rejectRequest(
        web3wallet,
        topic,
        id,
        Errors.unsupportedMethods,
        5101,
      );
  }
}
