import {
  EIP155_RESPONSES,
  EIP155_SIGNING_METHODS,
  ethSendTransactionSchema,
  type EIP155_REQUESTS,
} from "@/data/methods/EIP155Data.methods";
import {
  acceptRequest,
  Errors,
  isCanceledError,
  rejectRequest,
} from "@/hooks/requestHandlers/utils";
import { convertEthToLiveTX } from "@/utils/converters";
import { getAccountWithAddressAndChainId } from "@/utils/generic";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";

export async function sendTransaction(
  request: EIP155_REQUESTS,
  topic: string,
  id: number,
  chainId: string,
  accounts: Account[],
  client: WalletAPIClient,
  walletKit: IWalletKit,
) {
  if (
    request.method !== EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION &&
    request.method !== EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION
  ) {
    throw new Error(
      `Method ${request.method} from request can not be used to send transaction`,
    );
  }

  const ethTx = ethSendTransactionSchema.parse(request.params)[0];
  const account = getAccountWithAddressAndChainId(
    accounts,
    ethTx.from,
    chainId,
  );

  if (!account) {
    await rejectRequest(walletKit, topic, id, Errors.txDeclined);
    return;
  }

  try {
    const liveTx = convertEthToLiveTX(ethTx);
    const hash = await client.transaction.signAndBroadcast(account.id, liveTx);

    const result: EIP155_RESPONSES[typeof request.method] = hash;

    await acceptRequest(walletKit, topic, id, result);
  } catch (error) {
    if (isCanceledError(error)) {
      await rejectRequest(walletKit, topic, id, Errors.txDeclined);
    } else {
      throw error;
    }
  }
}
