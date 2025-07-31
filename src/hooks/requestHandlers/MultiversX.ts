import {
  type MULTIVERSX_REQUESTS,
  MULTIVERSX_RESPONSES,
  MULTIVERSX_SIGNING_METHODS,
  multiversxSignTransactionSchema,
  multiversxSignTransactionsSchema,
} from "@/data/methods/MultiversX.methods";
import { convertMvxToLiveTX } from "@/utils/converters";
import { getAccountWithAddressAndChainId } from "@/utils/generic";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import { acceptRequest, Errors, isCanceledError, rejectRequest } from "./utils";

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
      const params = multiversxSignTransactionSchema.parse(request.params);
      const accountTX = getAccountWithAddressAndChainId(
        accounts,
        params.transaction.sender,
        ledgerLiveCurrency,
      );
      if (accountTX) {
        try {
          const liveTx = convertMvxToLiveTX(params.transaction);
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
      const params = multiversxSignTransactionsSchema.parse(request.params);
      try {
        const signatures = await Promise.all(
          params.transactions.map(
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
