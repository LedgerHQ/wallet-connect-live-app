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

export async function signMessage(
  request: EIP155_REQUESTS,
  topic: string,
  id: number,
  chainId: string,
  accounts: Account[],
  client: WalletAPIClient,
  walletKit: IWalletKit,
) {
  if (
    request.method !== EIP155_SIGNING_METHODS.ETH_SIGN &&
    request.method !== EIP155_SIGNING_METHODS.PERSONAL_SIGN
  ) {
    throw new Error(
      `Method ${request.method} from request can not be used to sign message`,
    );
  }

  const isPersonalSign = request.method === EIP155_SIGNING_METHODS.PERSONAL_SIGN;
  const params = ethSignSchema.parse(request.params);
  const address = isPersonalSign ? params[1] : params[0];
  const message = isPersonalSign ? params[0] : params[1];
  const account = getAccountWithAddressAndChainId(accounts, address, chainId);

  if (!account) {
    await rejectRequest(walletKit, topic, id, Errors.userDecline);
    return;
  }

  try {
    const signedMessage = await client.message.sign(
      account.id,
      Buffer.from(stripHexPrefix(message), "hex"),
    );

    const result: EIP155_RESPONSES[typeof request.method] =
      formatMessage(signedMessage);

    await acceptRequest(walletKit, topic, id, result);
  } catch (error) {
    if (isCanceledError(error)) {
      await rejectRequest(walletKit, topic, id, Errors.userDecline);
    } else {
      throw error;
    }
  }
}
