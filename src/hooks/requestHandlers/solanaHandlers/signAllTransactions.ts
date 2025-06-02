import {
  SOLANA_REQUESTS,
  SOLANA_RESPONSES,
} from "@/data/methods/Solana.methods";
import {
  acceptRequest,
  Errors,
  rejectRequest,
} from "@/hooks/requestHandlers/utils";
import { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import { IWalletKit } from "@reown/walletkit";
import base58 from "bs58";
import { findSignerAccount, toLiveTransaction } from "./utils";

export async function signAllTransactions(
  request: SOLANA_REQUESTS,
  topic: string,
  id: number,
  _chainId: string,
  accounts: Account[],
  client: WalletAPIClient,
  walletKit: IWalletKit,
) {
  if (request.method !== "solana_signAllTransactions") {
    throw new Error(
      `Method ${request.method} from request can not be used to sign transaction`,
    );
  }

  const signatures: string[] = [];

  for (const transaction of request.params.transactions) {
    const liveTransaction = toLiveTransaction(transaction);
    const account = findSignerAccount(transaction, accounts);

    if (account) {
      try {
        const signature = await client.transaction.sign(
          account.id,
          liveTransaction,
        );

        signatures.push(base58.encode(signature));
      } catch (_error) {
        await rejectRequest(walletKit, topic, id, Errors.txDeclined);
        return;
      }
    } else {
      await rejectRequest(walletKit, topic, id, Errors.txDeclined);
      return;
    }
  }

  const result: SOLANA_RESPONSES[typeof request.method] = {
    transactions: signatures,
  };

  await acceptRequest(walletKit, topic, id, result);
}
