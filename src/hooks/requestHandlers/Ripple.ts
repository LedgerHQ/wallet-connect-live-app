import {
  type RIPPLE_REQUESTS,
  RIPPLE_RESPONSES,
  RIPPLE_SIGNING_METHODS,
  rippleSignTransactionSchema,
} from "@/data/methods/Ripple.methods";
import { convertXrpToLiveTX } from "@/utils/converters";
import { getAccountWithAddressAndChainId } from "@/utils/generic";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import { acceptRequest, Errors, isCanceledError, rejectRequest } from "./utils";

export async function handleXrpRequest(
  request: RIPPLE_REQUESTS,
  topic: string,
  id: number,
  _chainId: string,
  accounts: Account[],
  client: WalletAPIClient,
  walletKit: IWalletKit,
) {
  const ledgerLiveCurrency = "ripple";
  switch (request.method) {
    case RIPPLE_SIGNING_METHODS.RIPPLE_SIGN_TRANSACTION: {
      const params = rippleSignTransactionSchema.parse(request.params);
      const accountTX = getAccountWithAddressAndChainId(
        accounts,
        params.tx_json.Account,
        ledgerLiveCurrency,
      );

      if (accountTX) {
        try {
          const liveTx = convertXrpToLiveTX(params.tx_json);
          const hash = await client.transaction.signAndBroadcast(
            accountTX.id,
            liveTx,
          );

          const result: RIPPLE_RESPONSES[typeof request.method] = {
            tx_json: { ...params.tx_json, hash },
          };

          await acceptRequest(walletKit, topic, id, result);
        } catch (error) {
          if (isCanceledError(error)) {
            await rejectRequest(walletKit, topic, id, Errors.txDeclined);
          } else {
            throw error;
          }
        }
      } else {
        await rejectRequest(walletKit, topic, id, Errors.txDeclined);
      }
      break;
    }
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
