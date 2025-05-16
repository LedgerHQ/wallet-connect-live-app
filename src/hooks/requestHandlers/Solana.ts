import type { IWalletKit } from "@reown/walletkit";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import { type SOLANA_REQUESTS } from "@/data/methods/Solana.methods";
import { Errors, rejectRequest } from "./utils";
import { signTransaction } from "./solanaHandlers/signTransaction";
import { signMessage } from "./solanaHandlers/signMessage";

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
