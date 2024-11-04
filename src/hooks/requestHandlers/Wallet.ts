import { enqueueSnackbar } from "notistack";
import type { QueryClient } from "@tanstack/react-query";
import type { Web3Wallet } from "@walletconnect/web3wallet/dist/types/client";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import {
  WALLET_METHODS,
  type WALLET_REQUESTS,
} from "@/data/methods/Wallet.methods";
import { Errors, rejectRequest } from "./utils";
import {
  getErrorMessage,
  getNamespace,
  isBIP122Chain,
  isEIP155Chain,
  isMultiversXChain,
  isRippleChain,
} from "@/utils/helper.util";
import {
  BIP122_NETWORK_BY_CHAIN_ID,
  EIP155_NETWORK_BY_CHAIN_ID,
  MULTIVERS_X_NETWORK_BY_CHAIN_ID,
  RIPPLE_NETWORK_BY_CHAIN_ID,
} from "@/data/network.config";
import { queryKey as accountsQueryKey } from "@/hooks/useAccounts";

function getNetworkByChainId(
  networkByChainId: Record<string | number, string>,
  chainId: string,
) {
  const chainIdNumber = Number(chainId);

  return networkByChainId[
    Number.isNaN(chainIdNumber) ? chainId : chainIdNumber
  ];
}

function getNetwork(currentChainId: string, newChainId: string) {
  if (isEIP155Chain(currentChainId)) {
    return getNetworkByChainId(EIP155_NETWORK_BY_CHAIN_ID, newChainId);
  }
  if (isBIP122Chain(currentChainId)) {
    return getNetworkByChainId(BIP122_NETWORK_BY_CHAIN_ID, newChainId);
  }
  if (isRippleChain(currentChainId)) {
    return getNetworkByChainId(RIPPLE_NETWORK_BY_CHAIN_ID, newChainId);
  }
  if (isMultiversXChain(currentChainId)) {
    return getNetworkByChainId(MULTIVERS_X_NETWORK_BY_CHAIN_ID, newChainId);
  }
}

const addNewAccounts = async (
  client: WalletAPIClient,
  queryClient: QueryClient,
  currencies: string[],
) => {
  let account: Account | undefined;
  try {
    account = await client.account.request({
      currencyIds: currencies,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Canceled by user") {
      console.error("request account canceled by user");
      return;
    }
    enqueueSnackbar(getErrorMessage(error), {
      errorType: "Error adding accounts",
      variant: "errorNotification",
      anchorOrigin: {
        vertical: "top",
        horizontal: "right",
      },
    });
  }
  // refetch accounts
  await queryClient.invalidateQueries({ queryKey: accountsQueryKey });
  return account;
};

export async function handleWalletRequest(
  request: WALLET_REQUESTS,
  topic: string,
  id: number,
  chainId: string,
  _accounts: Account[],
  client: WalletAPIClient,
  web3wallet: Web3Wallet,
  queryClient: QueryClient,
) {
  switch (request.method) {
    case WALLET_METHODS.WALLET_SWITCH_ETHEREUM_CHAIN: {
      const network = getNetwork(chainId, request.params[0].chainId);
      if (network) {
        const session = web3wallet.engine.signClient.session.get(topic);
        const namespace = chainId.split(":")[0];
        const newChain = getNamespace(network);

        const accountPresent = session.namespaces[namespace]?.accounts.some(
          (account) => account.startsWith(newChain),
        );

        if (!accountPresent) {
          const account = await addNewAccounts(client, queryClient, [network]);

          if (account) {
            await web3wallet.updateSession({
              topic,
              namespaces: {
                ...session.namespaces,
                [namespace]: {
                  ...session.namespaces[namespace],
                  accounts: [
                    `${newChain}:${account.address}`,
                    ...session.namespaces[namespace].accounts,
                  ],
                  chains: [
                    newChain,
                    ...(session.namespaces[namespace].chains ?? []),
                  ],
                },
              },
            });
            return web3wallet.respondSessionRequest({
              topic,
              response: {
                id,
                jsonrpc: "2.0",
                result: null,
              },
            });
          }
        }
      }
      await rejectRequest(web3wallet, topic, id, Errors.txDeclined);
      break;
    }
    case WALLET_METHODS.WALLET_ADD_ETHEREUM_CHAIN: {
      const network = getNetwork(chainId, request.params[0].chainId);
      if (network) {
        const account = await addNewAccounts(client, queryClient, [network]);
        if (account) {
          const session = web3wallet.engine.signClient.session.get(topic);
          const namespace = chainId.split(":")[0];
          const newChain = getNamespace(account.currency);
          await web3wallet.updateSession({
            topic,
            namespaces: {
              ...session.namespaces,
              [namespace]: {
                ...session.namespaces[namespace],
                accounts: [
                  `${newChain}:${account.address}`,
                  ...session.namespaces[namespace].accounts,
                ],
                chains: [
                  newChain,
                  ...(session.namespaces[namespace].chains ?? []),
                ],
              },
            },
          });
          return web3wallet.respondSessionRequest({
            topic,
            response: {
              id,
              jsonrpc: "2.0",
              result: null,
            },
          });
        }
      }
      await rejectRequest(web3wallet, topic, id, Errors.txDeclined);
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
