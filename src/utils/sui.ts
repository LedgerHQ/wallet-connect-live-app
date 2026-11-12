import { bcs } from "@mysten/sui/bcs";

// The @mysten/bcs declarations use `Uint8Array<ArrayBuffer>`, which needs TypeScript 5.7. This
// repo's compiler reads them as error types, so the two codecs used here are typed by hand.
type SignedEntry = {
  intentMessage: { value: unknown };
  txSignatures: string[];
};
const senderSignedData = bcs.SenderSignedData as unknown as {
  parse(bytes: Uint8Array): SignedEntry[];
};
const transactionData = bcs.TransactionData as unknown as {
  serialize(value: unknown): { toBytes(): Uint8Array };
};

/**
 * Splits the wallet's signed Sui transaction into what `sui_signTransaction` returns.
 *
 * `signedTransactionHex` is the hex of a BCS `SenderSignedData` holding one transaction and one
 * serialized signature. The dApp wants the transaction bytes and that signature, both base64.
 */
export function decodeSignedSuiTransaction(signedTransactionHex: string): {
  transactionBytes: string;
  signature: string;
} {
  const entries = senderSignedData.parse(
    Uint8Array.from(
      Buffer.from(signedTransactionHex.replace(/^0x/, ""), "hex"),
    ),
  );
  if (entries.length !== 1) {
    throw new Error(
      `Expected one signed transaction, received ${entries.length}`,
    );
  }
  const [entry] = entries;
  if (entry.txSignatures.length !== 1) {
    throw new Error(
      `Expected one signature, received ${entry.txSignatures.length}`,
    );
  }

  return {
    transactionBytes: Buffer.from(
      transactionData.serialize(entry.intentMessage.value).toBytes(),
    ).toString("base64"),
    // Parsed signatures are already the base64 serialized signature.
    signature: entry.txSignatures[0],
  };
}
