import { Account, Transaction } from "@ledgerhq/wallet-api-client";
import { VersionedTransaction } from "@solana/web3.js";
import BigNumber from "bignumber.js";

export function findSignerAccount(
  serializedTransaction: string,
  accounts: Account[],
): Account {
  const solanaTransaction = VersionedTransaction.deserialize(
    Buffer.from(serializedTransaction, "base64"),
  );
  const message = solanaTransaction.message;
  const numRequiredSignatures = message.header.numRequiredSignatures;

  let account: Account | undefined;

  // https://github.com/LedgerHQ/app-solana/blob/develop/src/handle_sign_message.c#L16-L26
  // https://github.com/LedgerHQ/app-solana/blob/develop/src/utils.c#L39-L51
  // https://solana.stackexchange.com/a/9478
  for (let i = 0; i < numRequiredSignatures; i++) {
    const pubkey = message.staticAccountKeys[i].toBase58();
    account = accounts.find((account) => account.address === pubkey);
    if (account) {
      break;
    }
  }

  if (!account) {
    throw new Error("No signer found for the current transaction");
  }

  return account;
}

/**
 * Function to convert the serialized transaction to a Live transaction
 * We only need to fill the raw attribute, other value are only set to bypass type check
 *
 * @param serializedTransaction the serialized transaction from the request
 * @returns a Live transaction with the minimal attributes set to validate type
 */
export function toLiveTransaction(serializedTransaction: string): Transaction {
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
