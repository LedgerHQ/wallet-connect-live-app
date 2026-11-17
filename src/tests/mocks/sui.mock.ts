// Real `Transaction.build()` bytes of a SUI send.
export const SUI_TRANSACTION_BYTES_B64 =
  "AAACACBvsh/urQJ9pIcyla/1sTzYY/hdvovvz57de8dlGOzHiAIAAMqaOwAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA3N1aQNTVUkAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIEY29pbgxyZWRlZW1fZnVuZHMBBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA3N1aQNTVUkAAQEBAAEBAwAAAAABAADXgJJ9qOf/ltsDmfFnOLvOll7vkz1IfwRlxTK9Hu2w0wDXgJJ9qOf/ltsDmfFnOLvOll7vkz1IfwRlxTK9Hu2w0+gDAAAAAAAAAOH1BQAAAAAA";

// flag (Ed25519) || 64-byte signature || 32-byte public key, as the Ledger signer returns it.
export const SUI_SERIALIZED_SIGNATURE = new Uint8Array([
  0,
  ...new Uint8Array(64).fill(0x42),
  ...new Uint8Array(32).fill(0x01),
]);

// BCS of one `SenderSignedData` entry: intent (TransactionData, V0, Sui), the transaction, then the
// signatures, each prefixed by its length.
function entryBytes(signatures: Uint8Array[]): number[] {
  return [
    0,
    0,
    0,
    ...Buffer.from(SUI_TRANSACTION_BYTES_B64, "base64"),
    signatures.length,
    ...signatures.flatMap((signature) => [signature.length, ...signature]),
  ];
}

/**
 * Hex of a BCS `SenderSignedData` built the way the wallet builds it: the transaction above with
 * the given signatures, repeated `entryCount` times.
 */
export function buildSignedSuiTransactionHex(
  entryCount: number,
  signatures: Uint8Array[] = [SUI_SERIALIZED_SIGNATURE],
): string {
  const entries = Array.from({ length: entryCount }, () =>
    entryBytes(signatures),
  ).flat();
  return Buffer.from([entryCount, ...entries]).toString("hex");
}
