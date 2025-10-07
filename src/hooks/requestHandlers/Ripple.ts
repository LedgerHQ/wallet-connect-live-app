import {
  type RIPPLE_REQUESTS,
  RIPPLE_RESPONSES,
  RIPPLE_SIGNING_METHODS,
  rippleSignTransactionSchema,
} from "@/data/methods/Ripple.methods";
import { getAccountWithAddressAndChainId } from "@/utils/generic";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import { decode, encode } from "ripple-binary-codec";
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
          const encoded_tx_json = encode(params.tx_json);
          const { signedTransactionHex, transactionHash } =
            await client.transaction.signRaw(
              accountTX.id,
              encoded_tx_json,
              params.submit ?? true,
            );

          const final_tx_json = decode(signedTransactionHex);

          if (transactionHash) {
            final_tx_json.hash = transactionHash;
          }

          const result: RIPPLE_RESPONSES[typeof request.method] = {
            tx_json: final_tx_json,
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
