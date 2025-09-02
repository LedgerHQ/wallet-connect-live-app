import {
  SOLANA_REQUESTS,
  SOLANA_RESPONSES,
  SOLANA_SIGNING_METHODS,
  solanaSignAndSendTransactionSchema,
} from "@/data/methods/Solana.methods";
import {
  acceptRequest,
  Errors,
  isCanceledError,
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
  if (
    request.method !== SOLANA_SIGNING_METHODS.SOLANA_SIGN_AND_SEND_TRANSACTION
  ) {
    throw new Error(
      `Method ${request.method} from request can not be used to sign and send transaction`,
    );
  }

  const params = solanaSignAndSendTransactionSchema.parse(request.params);

  const liveTransaction = toLiveTransaction(params.transaction);
  const account = findSignerAccount(params.transaction, accounts);

  try {
    const signature = await client.transaction.signAndBroadcast(
      account.id,
      liveTransaction,
    );

    const result: SOLANA_RESPONSES[typeof request.method] = {
      signature: signature,
    };

    await acceptRequest(walletKit, topic, id, result);
  } catch (error) {
    if (isCanceledError(error)) {
      await rejectRequest(walletKit, topic, id, Errors.userDecline);
    } else {
      throw error;
    }
  }
}
