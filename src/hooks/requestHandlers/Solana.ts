import type { IWalletKit } from "@reown/walletkit";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import {
  SOLANA_SIGNING_METHODS,
  type SOLANA_REQUESTS,
} from "@/data/methods/Solana.methods";
import { getAccountWithAddressAndChainId } from "@/utils/generic";
import { convertSolanaToLiveTX } from "@/utils/converters";
import { acceptRequest, Errors, formatMessage, rejectRequest } from "./utils";
import { VersionedTransaction } from "@solana/web3.js";

export async function handleSolanaRequest(
  request: SOLANA_REQUESTS,
  topic: string,
  id: number,
  _chainId: string,
  accounts: Account[],
  client: WalletAPIClient,
  walletKit: IWalletKit,
) {
  const ledgerLiveCurrency = "solana";
  console.log({ request });
  switch (request.method) {
    case SOLANA_SIGNING_METHODS.SOLANA_SIGNTRANSACTION: {
      // debugger;
      const tx = VersionedTransaction.deserialize(
        Buffer.from(request.params.transaction, "base64"),
      );
      console.log(tx);
      const [liveTx, feePayer] = convertSolanaToLiveTX(tx.message, accounts);

      const pubkey = feePayer?.toString();
      if (!pubkey) {
        throw new Error("no pubkey");
      }
      // TODO: check if issigner ?
      const accountTx = getAccountWithAddressAndChainId(
        accounts,
        pubkey,
        ledgerLiveCurrency,
      );
      // debugger;
      if (accountTx) {
        try {
          // debugger;
          const hash = await client.transaction.signAndBroadcast(
            accountTx.id,
            liveTx,
          );
          console.log({ hash });
          // debugger;
          await acceptRequest(walletKit, topic, id, hash);
        } catch (error) {
          await rejectRequest(walletKit, topic, id, Errors.txDeclined);
          console.error(error);
        }
      } else {
        await rejectRequest(walletKit, topic, id, Errors.txDeclined);
      }

      break;
    }
    case SOLANA_SIGNING_METHODS.SOLANA_SIGNMESSAGE: {
      const accountSign = getAccountWithAddressAndChainId(
        accounts,
        request.params.pubkey,
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
          await rejectRequest(walletKit, topic, id, Errors.txDeclined);
          console.error(error);
        }
      } else {
        await rejectRequest(walletKit, topic, id, Errors.txDeclined);
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
