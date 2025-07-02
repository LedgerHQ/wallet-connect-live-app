import {
  SOLANA_REQUESTS,
  SOLANA_RESPONSES,
} from "@/data/methods/Solana.methods";
import {
  acceptRequest,
  Errors,
  isCanceledError,
  rejectRequest,
} from "@/hooks/requestHandlers/utils";
import { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import { IWalletKit } from "@reown/walletkit";
import { VersionedTransaction } from "@solana/web3.js";
import base58 from "bs58";
import { findSignerAccount, toLiveTransaction } from "./utils";

export async function signTransaction(
  request: SOLANA_REQUESTS,
  topic: string,
  id: number,
  _chainId: string,
  accounts: Account[],
  client: WalletAPIClient,
  walletKit: IWalletKit,
) {
  if (request.method !== "solana_signTransaction") {
    throw new Error(
      `Method ${request.method} from request can not be used to sign transaction`,
    );
  }

  const liveTransaction = toLiveTransaction(request.params.transaction);
  const account = findSignerAccount(request.params.transaction, accounts);

  try {
    const signature = await client.transaction.sign(
      account.id,
      liveTransaction,
    );

    const transaction = VersionedTransaction.deserialize(signature);

    const result: SOLANA_RESPONSES[typeof request.method] = {
      signature: base58.encode(transaction.signatures[0]),
      transaction: signature.toString("base64"),
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
