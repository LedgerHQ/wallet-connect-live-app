import {
  SOLANA_REQUESTS,
  solanaSignMessageSchema,
} from "@/data/methods/Solana.methods";
import {
  acceptRequest,
  Errors,
  rejectRequest,
} from "@/hooks/requestHandlers/utils";
import { getAccountWithAddressAndChainId } from "@/utils/generic";
import { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import { IWalletKit } from "@reown/walletkit";
import base58 from "bs58";

export async function signMessage(
  request: SOLANA_REQUESTS,
  topic: string,
  id: number,
  _chainId: string,
  accounts: Account[],
  client: WalletAPIClient,
  walletKit: IWalletKit,
) {
  if (request.method !== "solana_signMessage") {
    throw new Error(
      `Method ${request.method} from request can not be used to sign message`,
    );
  }

  const params = solanaSignMessageSchema.parse(request.params);

  const accountSign = getAccountWithAddressAndChainId(
    accounts,
    params.pubkey,
    "solana",
  );

  if (accountSign) {
    try {
      const signedMessage = await client.message.sign(
        accountSign.id,
        Buffer.from(base58.decodeUnsafe(params.message) ?? params.message),
      );

      await acceptRequest(walletKit, topic, id, {
        signature: base58.encode(signedMessage),
      });
    } catch (_error) {
      await rejectRequest(walletKit, topic, id, Errors.txDeclined);
    }
  } else {
    await rejectRequest(walletKit, topic, id, Errors.txDeclined);
  }
}
