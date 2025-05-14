import { getAccountWithAddressAndChainId } from "@/utils/generic";
import {
  PublicKey,
  SystemProgram,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  Account,
  Transaction,
  WalletAPIClient,
} from "@ledgerhq/wallet-api-client";
import { IWalletKit } from "@reown/walletkit";
import { SOLANA_REQUESTS } from "@/data/methods/Solana.methods";
import {
  acceptRequest,
  Errors,
  rejectRequest,
} from "@/hooks/requestHandlers/utils";
import BigNumber from "bignumber.js";

function toSolanaTransaction(serializedTransaction: string) {
  return VersionedTransaction.deserialize(
    Buffer.from(serializedTransaction, "base64"),
  );
}

function findSignerAddress(serializedTransaction: string): PublicKey {
  const solanaTransaction = toSolanaTransaction(serializedTransaction);
  const message = solanaTransaction.message;
  const instruction = message.compiledInstructions.find(
    (instruction) =>
      message.staticAccountKeys[instruction.programIdIndex].toString() ===
      SystemProgram.programId.toString(),
  );
  if (!instruction) {
    throw new Error("No supported instructions found on Solana transaction");
  }

  const accountKeyIndex = instruction.accountKeyIndexes.find((idx) =>
    message.isAccountSigner(idx),
  );
  if (accountKeyIndex === undefined) {
    throw new Error("No signer found for the current transaction");
  }

  return message.staticAccountKeys[accountKeyIndex];
}
/**
 * Function to convert the serialized transaction to a Live transaction
 * We only need to fill the raw attribute, other value are only set to bypass type check
 *
 * @param serializedTransaction the serialized transaction from the request
 * @returns a Live transaction with the minimal attributes set to validate type
 */
function toLiveTransaction(serializedTransaction: string): Transaction {
  return {
    family: "solana",
    amount: BigNumber(0),
    recipient: "",
    raw: serializedTransaction,
    model: {
      kind: "transfer",
      uiState: {},
    },
  };
}

export async function signTransaction(
  request: SOLANA_REQUESTS,
  topic: string,
  id: number,
  _chainId: string,
  accounts: Account[],
  client: WalletAPIClient,
  walletKit: IWalletKit,
) {
  if (request.method !== "solana_signTransaction") {
    throw new Error(
      `Method ${request.method} from request can not be used to sign transaction`,
    );
  }

  const liveTransaction = toLiveTransaction(request.params.transaction);
  const signerAddress = findSignerAddress(request.params.transaction);

  const accountTx = getAccountWithAddressAndChainId(
    accounts,
    signerAddress.toString(),
    "solana",
  );
  if (accountTx) {
    try {
      const hash = await client.transaction.signAndBroadcast(
        accountTx.id,
        liveTransaction,
      );
      await acceptRequest(walletKit, topic, id, hash);
    } catch (_error) {
      await rejectRequest(walletKit, topic, id, Errors.txDeclined);
    }
  } else {
    await rejectRequest(walletKit, topic, id, Errors.txDeclined);
  }
}
