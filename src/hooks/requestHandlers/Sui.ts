import {
  type SUI_REQUESTS,
  type SUI_RESPONSES,
  SUI_SIGNING_METHODS,
  type SuiAccount,
  suiSignAndExecuteTransactionSchema,
  suiSignTransactionSchema,
} from "@/data/methods/Sui.methods";
import { hexToBase64 } from "@/utils/cosmos";
import { getAccountWithAddressAndChainId } from "@/utils/generic";
import { decodeSignedSuiTransaction } from "@/utils/sui";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import { acceptRequest, Errors, isCanceledError, rejectRequest } from "./utils";

const LEDGER_LIVE_CURRENCIES = ["sui", "sui_testnet"];

async function getAccounts(
  accounts: Account[],
  client: WalletAPIClient,
  walletKit: IWalletKit,
  topic: string,
  id: number,
) {
  // The adapter always asks on sui:mainnet but needs every approved account, so testnet accounts
  // are included. The public key is mandatory in the response; an account added before the
  // wallet stored it resolves to no key (or throws) and is skipped rather than advertised unusable.
  const suiAccounts: SuiAccount[] = (
    await Promise.all(
      accounts
        .filter((account) => LEDGER_LIVE_CURRENCIES.includes(account.currency))
        .map(async (account) => {
          try {
            const pubkey = await client.account.getPublicKey(account.id);
            if (!pubkey) return null;
            return { address: account.address, pubkey: hexToBase64(pubkey) };
          } catch {
            return null;
          }
        }),
    )
  ).filter((account): account is SuiAccount => account !== null);

  await acceptRequest(walletKit, topic, id, suiAccounts);
}

async function signTransaction(
  request: Extract<
    SUI_REQUESTS,
    { method: typeof SUI_SIGNING_METHODS.SUI_SIGN_TRANSACTION }
  >,
  chainId: string,
  accounts: Account[],
  client: WalletAPIClient,
  walletKit: IWalletKit,
  topic: string,
  id: number,
) {
  const params = suiSignTransactionSchema.parse(request.params);
  const account = getAccountWithAddressAndChainId(
    accounts,
    params.address,
    chainId,
  );

  if (!account) {
    await rejectRequest(walletKit, topic, id, Errors.txDeclined);
    return;
  }

  try {
    // The wallet resolves gas and object versions, signs on the device and never broadcasts.
    const { signedTransactionHex } = await client.transaction.signRaw(
      account.id,
      params.transaction,
      false,
    );

    if (!signedTransactionHex) {
      await rejectRequest(walletKit, topic, id, Errors.txDeclined);
      return;
    }

    let result: SUI_RESPONSES[typeof request.method];
    try {
      result = decodeSignedSuiTransaction(signedTransactionHex);
    } catch {
      await rejectRequest(walletKit, topic, id, Errors.txDeclined);
      return;
    }

    await acceptRequest(walletKit, topic, id, result);
  } catch (error) {
    if (isCanceledError(error)) {
      await rejectRequest(walletKit, topic, id, Errors.txDeclined);
    } else {
      throw error;
    }
  }
}

async function signAndExecuteTransaction(
  request: Extract<
    SUI_REQUESTS,
    { method: typeof SUI_SIGNING_METHODS.SUI_SIGN_AND_EXECUTE_TRANSACTION }
  >,
  chainId: string,
  accounts: Account[],
  client: WalletAPIClient,
  walletKit: IWalletKit,
  topic: string,
  id: number,
) {
  const params = suiSignAndExecuteTransactionSchema.parse(request.params);
  const account = getAccountWithAddressAndChainId(
    accounts,
    params.address,
    chainId,
  );

  if (!account) {
    await rejectRequest(walletKit, topic, id, Errors.txDeclined);
    return;
  }

  try {
    const { transactionHash } = await client.transaction.signRaw(
      account.id,
      params.transaction,
      true,
    );

    if (!transactionHash) {
      await rejectRequest(walletKit, topic, id, Errors.txDeclined);
      return;
    }

    const result: SUI_RESPONSES[typeof request.method] = {
      digest: transactionHash,
    };
    await acceptRequest(walletKit, topic, id, result);
  } catch (error) {
    if (isCanceledError(error)) {
      await rejectRequest(walletKit, topic, id, Errors.txDeclined);
    } else {
      throw error;
    }
  }
}

export async function handleSuiRequest(
  request: SUI_REQUESTS,
  topic: string,
  id: number,
  chainId: string,
  accounts: Account[],
  client: WalletAPIClient,
  walletKit: IWalletKit,
) {
  switch (request.method) {
    case SUI_SIGNING_METHODS.SUI_GET_ACCOUNTS:
      await getAccounts(accounts, client, walletKit, topic, id);
      break;
    case SUI_SIGNING_METHODS.SUI_SIGN_TRANSACTION:
      await signTransaction(
        request,
        chainId,
        accounts,
        client,
        walletKit,
        topic,
        id,
      );
      break;
    case SUI_SIGNING_METHODS.SUI_SIGN_AND_EXECUTE_TRANSACTION:
      await signAndExecuteTransaction(
        request,
        chainId,
        accounts,
        client,
        walletKit,
        topic,
        id,
      );
      break;
    // sui_signPersonalMessage and anything else: the Wallet API has no Sui message signing.
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
