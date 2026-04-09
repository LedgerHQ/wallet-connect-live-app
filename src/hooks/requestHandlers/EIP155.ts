import {
  EIP155_SIGNING_METHODS,
  type EIP155_REQUESTS,
} from "@/data/methods/EIP155Data.methods";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import { sendTransaction } from "./eip155Handlers/sendTransaction";
import { signMessage } from "./eip155Handlers/signMessage";
import { signTransaction } from "./eip155Handlers/signTransaction";
import { signTypedData } from "./eip155Handlers/signTypedData";
import { Errors, rejectRequest } from "./utils";

export async function handleEIP155Request(
  request: EIP155_REQUESTS,
  topic: string,
  id: number,
  chainId: string,
  accounts: Account[],
  client: WalletAPIClient,
  walletKit: IWalletKit,
) {
  switch (request.method) {
    case EIP155_SIGNING_METHODS.ETH_SIGN:
    case EIP155_SIGNING_METHODS.PERSONAL_SIGN:
      await signMessage(
        request,
        topic,
        id,
        chainId,
        accounts,
        client,
        walletKit,
      );
      break;
    case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA:
    case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3:
    case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4:
      await signTypedData(
        request,
        topic,
        id,
        chainId,
        accounts,
        client,
        walletKit,
      );
      break;
    case EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION:
      await signTransaction(
        request,
        topic,
        id,
        chainId,
        accounts,
        client,
        walletKit,
      );
      break;
    case EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION:
      await sendTransaction(
        request,
        topic,
        id,
        chainId,
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
