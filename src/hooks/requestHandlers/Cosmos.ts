import {
  type COSMOS_REQUESTS,
  type COSMOS_RESPONSES,
  COSMOS_SIGNING_METHODS,
  type CosmosAccount,
  cosmosSignAminoSchema,
} from "@/data/methods/Cosmos.methods";
import { hexToBase64 } from "@/utils/cosmos";
import { getAccountWithAddressAndChainId } from "@/utils/generic";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import { acceptRequest, Errors, isCanceledError, rejectRequest } from "./utils";

const LEDGER_LIVE_CURRENCY = "babylon";
const COSMOS_PUBKEY_ALGO = "secp256k1";
const COSMOS_PUBKEY_TYPE = "tendermint/PubKeySecp256k1";

async function getAccounts(
  accounts: Account[],
  client: WalletAPIClient,
  walletKit: IWalletKit,
  topic: string,
  id: number,
) {
  // pubkey is mandatory in the RPC response. coin-cosmos only persists it for accounts synced
  // after LIVE-33211; older ones resolve to an empty key. Skip any account without one (throw
  // OR empty) rather than advertising an unusable account.
  const cosmosAccounts: CosmosAccount[] = (
    await Promise.all(
      accounts
        .filter((account) => account.currency === LEDGER_LIVE_CURRENCY)
        .map(async (account) => {
          try {
            const pubkey = await client.account.getPublicKey(account.id);
            if (!pubkey) return null;
            return {
              algo: COSMOS_PUBKEY_ALGO,
              address: account.address,
              pubkey: hexToBase64(pubkey),
            };
          } catch {
            return null;
          }
        }),
    )
  ).filter((account): account is CosmosAccount => account !== null);

  await acceptRequest(walletKit, topic, id, cosmosAccounts);
}

async function signAmino(
  request: Extract<
    COSMOS_REQUESTS,
    { method: typeof COSMOS_SIGNING_METHODS.COSMOS_SIGN_AMINO }
  >,
  accounts: Account[],
  client: WalletAPIClient,
  walletKit: IWalletKit,
  topic: string,
  id: number,
) {
  const params = cosmosSignAminoSchema.parse(request.params);
  const account = getAccountWithAddressAndChainId(
    accounts,
    params.signerAddress,
    LEDGER_LIVE_CURRENCY,
  );

  if (!account || account.address !== params.signerAddress) {
    await rejectRequest(walletKit, topic, id, Errors.txDeclined);
    return;
  }

  try {
    // The amino response must carry the signer's public key; coin-cosmos exposes it only for
    // accounts synced after LIVE-33211, so bail clearly (prompt re-sync) when it's missing.
    const pubkey = await client.account.getPublicKey(account.id);
    if (!pubkey) {
      await rejectRequest(walletKit, topic, id, Errors.txDeclined);
      return;
    }

    // coin-cosmos signs the canonical amino bytes and returns the detached 64-byte secp256k1
    // signature as hex via `signedTransactionHex`; it never broadcasts (broadcast=false).
    const { signedTransactionHex } = await client.transaction.signRaw(
      account.id,
      JSON.stringify(params.signDoc),
      false,
    );

    if (!signedTransactionHex) {
      await rejectRequest(walletKit, topic, id, Errors.txDeclined);
      return;
    }

    const result: COSMOS_RESPONSES[typeof request.method] = {
      signature: {
        pub_key: { type: COSMOS_PUBKEY_TYPE, value: hexToBase64(pubkey) },
        signature: hexToBase64(signedTransactionHex),
      },
      // Echo the exact signDoc back, as the amino spec requires.
      signed: params.signDoc,
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

export async function handleCosmosRequest(
  request: COSMOS_REQUESTS,
  topic: string,
  id: number,
  _chainId: string,
  accounts: Account[],
  client: WalletAPIClient,
  walletKit: IWalletKit,
) {
  switch (request.method) {
    case COSMOS_SIGNING_METHODS.COSMOS_GET_ACCOUNTS:
      await getAccounts(accounts, client, walletKit, topic, id);
      break;
    case COSMOS_SIGNING_METHODS.COSMOS_SIGN_AMINO:
      await signAmino(request, accounts, client, walletKit, topic, id);
      break;
    // cosmos_signDirect (protobuf) and anything else: coin-cosmos is amino-only.
    default:
      await rejectRequest(walletKit, topic, id, Errors.unsupportedMethods, 5101);
  }
}
