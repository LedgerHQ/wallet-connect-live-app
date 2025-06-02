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
import { findSignerAccount, toLiveTransaction } from "./utils";

export async function signAndSendTransaction(
  request: SOLANA_REQUESTS,
  topic: string,
  id: number,
  _chainId: string,
  accounts: Account[],
  client: WalletAPIClient,
  walletKit: IWalletKit,
) {
  if (request.method !== "solana_signAndSendTransaction") {
    throw new Error(
      `Method ${request.method} from request can not be used to sign transaction`,
    );
  }

  const liveTransaction = toLiveTransaction(request.params.transaction);
  const account = findSignerAccount(request.params.transaction, accounts);

  if (account) {
    try {
      const signature = await client.transaction.signAndBroadcast(
        account.id,
        liveTransaction,
      );

      const result: SOLANA_RESPONSES[typeof request.method] = {
        signature: signature,
      };

      await acceptRequest(walletKit, topic, id, result);
    } catch (_error) {
      await rejectRequest(walletKit, topic, id, Errors.txDeclined);
    }
  } else {
    await rejectRequest(walletKit, topic, id, Errors.txDeclined);
  }
}
