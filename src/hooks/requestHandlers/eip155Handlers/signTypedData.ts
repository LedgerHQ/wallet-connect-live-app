import {
  EIP155_RESPONSES,
  EIP155_SIGNING_METHODS,
  ethSignSchema,
  type EIP155_REQUESTS,
} from "@/data/methods/EIP155Data.methods";
import {
  acceptRequest,
  Errors,
  formatMessage,
  isCanceledError,
  rejectRequest,
} from "@/hooks/requestHandlers/utils";
import { stripHexPrefix } from "@/utils/currencyFormatter/helpers";
import { getAccountWithAddressAndChainId } from "@/utils/generic";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";

export async function signTypedData(
  request: EIP155_REQUESTS,
  topic: string,
  id: number,
  chainId: string,
  accounts: Account[],
  client: WalletAPIClient,
  walletKit: IWalletKit,
) {
  if (
    request.method !== EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA &&
    request.method !== EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3 &&
    request.method !== EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4
  ) {
    throw new Error(
      `Method ${request.method} from request can not be used to sign typed data`,
    );
  }

  const params = ethSignSchema.parse(request.params);
  const address = params[0];
  const message = stripHexPrefix(params[1]);
  const account = getAccountWithAddressAndChainId(accounts, address, chainId);

  if (!account) {
    await rejectRequest(walletKit, topic, id, Errors.msgDecline);
    return;
  }

  try {
    const signedMessage = await client.message.sign(
      account.id,
      Buffer.from(message),
    );

    const result: EIP155_RESPONSES[typeof request.method] =
      formatMessage(signedMessage);

    await acceptRequest(walletKit, topic, id, result);
  } catch (error) {
    if (isCanceledError(error)) {
      await rejectRequest(walletKit, topic, id, Errors.msgDecline);
    } else {
      throw error;
    }
  }
}
