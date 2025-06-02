import { type SOLANA_REQUESTS } from "@/data/methods/Solana.methods";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import { signAllTransactions } from "./solanaHandlers/signAllTransactions";
import { signAndSendTransaction } from "./solanaHandlers/signAndSendTransaction";
import { signMessage } from "./solanaHandlers/signMessage";
import { signTransaction } from "./solanaHandlers/signTransaction";
import { Errors, rejectRequest } from "./utils";

export async function handleSolanaRequest(
  request: SOLANA_REQUESTS,
  topic: string,
  id: number,
  _chainId: string,
  accounts: Account[],
  client: WalletAPIClient,
  walletKit: IWalletKit,
) {
  switch (request.method) {
    case "solana_signMessage":
      await signMessage(
        request,
        topic,
        id,
        _chainId,
        accounts,
        client,
        walletKit,
      );
      break;
    case "solana_signTransaction":
      await signTransaction(
        request,
        topic,
        id,
        _chainId,
        accounts,
        client,
        walletKit,
      );
      break;
    case "solana_signAllTransactions":
      await signAllTransactions(
        request,
        topic,
        id,
        _chainId,
        accounts,
        client,
        walletKit,
      );
      break;
    case "solana_signAndSendTransaction":
      await signAndSendTransaction(
        request,
        topic,
        id,
        _chainId,
        accounts,
        client,
        walletKit,
      );
      break;
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
