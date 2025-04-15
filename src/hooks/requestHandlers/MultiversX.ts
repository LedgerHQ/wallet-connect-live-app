import type { IWalletKit } from "@reown/walletkit";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import {
  type MULTIVERSX_REQUESTS,
  MULTIVERSX_RESPONSES,
  MULTIVERSX_SIGNING_METHODS,
} from "@/data/methods/MultiversX.methods";
import { getAccountWithAddressAndChainId } from "@/utils/generic";
import { convertMvxToLiveTX } from "@/utils/converters";
import {
  acceptRequest,
  Errors,
  isCanceledError,
  rejectRequest,
} from "./utils";

export async function handleMvxRequest(
  request: MULTIVERSX_REQUESTS,
  topic: string,
  id: number,
  _chainId: string,
  accounts: Account[],
  client: WalletAPIClient,
  walletKit: IWalletKit,
) {
  const ledgerLiveCurrency = "elrond";

  switch (request.method) {
    case MULTIVERSX_SIGNING_METHODS.MULTIVERSX_SIGN_TRANSACTION: {
      const accountTX = getAccountWithAddressAndChainId(
        accounts,
        request.params.transaction.sender,
        ledgerLiveCurrency,
      );
      if (accountTX) {
        try {
          const liveTx = convertMvxToLiveTX(request.params.transaction);
          const hash = await client.transaction.signAndBroadcast(
            accountTX.id,
            liveTx,
          );
          const result: MULTIVERSX_RESPONSES[typeof request.method] = {
            signature: hash,
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
    case MULTIVERSX_SIGNING_METHODS.MULTIVERSX_SIGN_TRANSACTIONS: {
      try {
        const signatures = await Promise.all(
          request.params.transactions.map(
            async (
              transaction,
            ): Promise<{
              signature: string;
            } | null> => {
              const accountTX = getAccountWithAddressAndChainId(
                accounts,
                transaction.sender,
                ledgerLiveCurrency,
              );
              if (!accountTX) return null;

              const liveTx = convertMvxToLiveTX(transaction);
              const hash = await client.transaction.signAndBroadcast(
                accountTX.id,
                liveTx,
              );

              return { signature: hash };
            },
          ),
        );

        const result: MULTIVERSX_RESPONSES[typeof request.method] = {
          signatures: signatures.filter((s): s is { signature: string } => !!s),
        };

        await acceptRequest(walletKit, topic, id, result);
      } catch (error) {
        if (isCanceledError(error)) {
          await rejectRequest(walletKit, topic, id, Errors.txDeclined);
        } else {
          throw error;
        }
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
