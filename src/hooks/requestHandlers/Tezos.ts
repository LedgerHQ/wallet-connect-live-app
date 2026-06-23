import {
  type TEZOS_REQUESTS,
  type TEZOS_RESPONSES,
  TEZOS_SIGNING_METHODS,
  type TezosAccount,
  tezosSendSchema,
  tezosSignSchema,
} from "@/data/methods/Tezos.methods";
import { getAccountWithAddressAndChainId } from "@/utils/generic";
import { encodeTezosSignature, tezosSignatureAlgo } from "@/utils/tezos";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import { acceptRequest, Errors, isCanceledError, rejectRequest } from "./utils";

const LEDGER_LIVE_CURRENCY = "tezos";

async function getAccounts(
  accounts: Account[],
  client: WalletAPIClient,
  walletKit: IWalletKit,
  topic: string,
  id: number,
) {
  // pubkey is mandatory in the RPC response; fetch it per account and skip any the wallet
  // cannot provide one for rather than advertising an unusable account.
  const tezosAccounts: TezosAccount[] = (
    await Promise.all(
      accounts
        .filter((account) => account.currency === LEDGER_LIVE_CURRENCY)
        .map(async (account) => {
          try {
            const pubkey = await client.account.getPublicKey(account.id);
            return {
              algo: tezosSignatureAlgo(account.address),
              address: account.address,
              pubkey,
            };
          } catch {
            return null;
          }
        }),
    )
  ).filter((account): account is TezosAccount => account !== null);

  await acceptRequest(walletKit, topic, id, tezosAccounts);
}

async function send(
  request: Extract<TEZOS_REQUESTS, { method: typeof TEZOS_SIGNING_METHODS.TEZOS_SEND }>,
  accounts: Account[],
  client: WalletAPIClient,
  walletKit: IWalletKit,
  topic: string,
  id: number,
) {
  const params = tezosSendSchema.parse(request.params);
  const account = getAccountWithAddressAndChainId(
    accounts,
    params.account,
    LEDGER_LIVE_CURRENCY,
  );

  if (!account || account.address !== params.account) {
    await rejectRequest(walletKit, topic, id, Errors.txDeclined);
    return;
  }

  try {
    // coin-tezos's craftRawTransaction estimates + forges these operation contents.
    const rawTransaction = JSON.stringify(params.operations);
    const { transactionHash } = await client.transaction.signRaw(
      account.id,
      rawTransaction,
      true,
    );

    if (!transactionHash) {
      await rejectRequest(walletKit, topic, id, Errors.txDeclined);
      return;
    }

    const result: TEZOS_RESPONSES[typeof request.method] = {
      operationHash: transactionHash,
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

async function sign(
  request: Extract<TEZOS_REQUESTS, { method: typeof TEZOS_SIGNING_METHODS.TEZOS_SIGN }>,
  accounts: Account[],
  client: WalletAPIClient,
  walletKit: IWalletKit,
  topic: string,
  id: number,
) {
  const params = tezosSignSchema.parse(request.params);
  const account = getAccountWithAddressAndChainId(
    accounts,
    params.account,
    LEDGER_LIVE_CURRENCY,
  );

  if (!account || account.address !== params.account) {
    await rejectRequest(walletKit, topic, id, Errors.msgDecline);
    return;
  }

  try {
    // Pass the hex payload as ASCII so the binary survives the Wallet API UTF-8 round-trip.
    const signed = await client.message.sign(
      account.id,
      Buffer.from(params.payload, "utf8"),
    );
    // coin-tezos returns the raw r‖s signature as a non-0x hex string, which message.sign
    // transports as that string's bytes; recover the raw signature before base58-encoding.
    const signatureHex = signed.toString().replace(/^0x/, "");
    // Tezos signatures are 64 raw bytes for every curve; refuse anything else.
    if (!/^[0-9a-fA-F]{128}$/.test(signatureHex)) {
      await rejectRequest(walletKit, topic, id, Errors.msgDecline);
      return;
    }

    const result: TEZOS_RESPONSES[typeof request.method] = {
      signature: encodeTezosSignature(
        Buffer.from(signatureHex, "hex"),
        account.address,
      ),
    };

    await acceptRequest(walletKit, topic, id, result);
  } catch (error) {
    if (isCanceledError(error)) {
      await rejectRequest(walletKit, topic, id, Errors.msgDecline);
    } else {
      throw error;
    }
  }
}

export async function handleTezosRequest(
  request: TEZOS_REQUESTS,
  topic: string,
  id: number,
  _chainId: string,
  accounts: Account[],
  client: WalletAPIClient,
  walletKit: IWalletKit,
) {
  switch (request.method) {
    case TEZOS_SIGNING_METHODS.TEZOS_GET_ACCOUNTS:
      await getAccounts(accounts, client, walletKit, topic, id);
      break;
    case TEZOS_SIGNING_METHODS.TEZOS_SEND:
      await send(request, accounts, client, walletKit, topic, id);
      break;
    case TEZOS_SIGNING_METHODS.TEZOS_SIGN:
      await sign(request, accounts, client, walletKit, topic, id);
      break;
    default:
      await rejectRequest(walletKit, topic, id, Errors.unsupportedMethods, 5101);
  }
}
