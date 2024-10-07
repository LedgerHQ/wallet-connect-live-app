import type { Web3Wallet } from "@walletconnect/web3wallet/dist/types/client";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import {
  type RIPPLE_REQUESTS,
  RIPPLE_SIGNING_METHODS,
} from "@/data/methods/Ripple.methods";
import { getAccountWithAddressAndChainId } from "@/utils/generic";
import { convertXrpToLiveTX } from "@/utils/converters";
import { acceptRequest, Errors, rejectRequest } from "./utils";

export async function handleXrpRequest(
  request: RIPPLE_REQUESTS,
  topic: string,
  id: number,
  _chainId: string,
  accounts: Account[],
  client: WalletAPIClient,
  web3wallet: Web3Wallet,
) {
  const ledgerLiveCurrency = "ripple";
  switch (request.method) {
    case RIPPLE_SIGNING_METHODS.RIPPLE_SIGN_TRANSACTION: {
      const accountTX = getAccountWithAddressAndChainId(
        accounts,
        request.params.tx_json.Account,
        ledgerLiveCurrency,
      );

      if (accountTX) {
        try {
          const liveTx = convertXrpToLiveTX(request.params.tx_json);
          const hash = await client.transaction.signAndBroadcast(
            accountTX.id,
            liveTx,
          );
          await acceptRequest(web3wallet, topic, id, hash);
        } catch (error) {
          console.error(error);
          await rejectRequest(web3wallet, topic, id, Errors.txDeclined);
        }
      } else {
        await rejectRequest(web3wallet, topic, id, Errors.txDeclined);
      }
      break;
    }
    default:
      await rejectRequest(
        web3wallet,
        topic,
        id,
        Errors.unsupportedMethods,
        5101,
      );
  }
}
