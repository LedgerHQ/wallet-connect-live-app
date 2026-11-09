import { bcs } from "@mysten/sui/bcs";

// Real `Transaction.build()` bytes of a SUI send.
export const SUI_TRANSACTION_BYTES_B64 =
  "AAACACBvsh/urQJ9pIcyla/1sTzYY/hdvovvz57de8dlGOzHiAIAAMqaOwAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA3N1aQNTVUkAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIEY29pbgxyZWRlZW1fZnVuZHMBBwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA3N1aQNTVUkAAQEBAAEBAwAAAAABAADXgJJ9qOf/ltsDmfFnOLvOll7vkz1IfwRlxTK9Hu2w0wDXgJJ9qOf/ltsDmfFnOLvOll7vkz1IfwRlxTK9Hu2w0+gDAAAAAAAAAOH1BQAAAAAA";

// flag (Ed25519) || 64-byte signature || 32-byte public key, as the Ledger signer returns it.
export const SUI_SERIALIZED_SIGNATURE = new Uint8Array([
  0,
  ...new Uint8Array(64).fill(0x42),
  ...new Uint8Array(32).fill(0x01),
]);

// See src/utils/sui.ts: the @mysten/bcs declarations are unreadable by this repo's TypeScript.
const codecs = {
  senderSignedData: bcs.SenderSignedData as unknown as {
    serialize(entries: unknown[]): { toBytes(): Uint8Array };
  },
  transactionData: bcs.TransactionData as unknown as {
    parse(bytes: Uint8Array): unknown;
  },
};

/**
 * Hex of a BCS `SenderSignedData` built the way the wallet builds it: the transaction above with
 * the given signatures, repeated `entryCount` times.
 */
export function buildSignedSuiTransactionHex(
  entryCount: number,
  signatures: Uint8Array[] = [SUI_SERIALIZED_SIGNATURE],
): string {
  const entry = {
    intentMessage: {
      intent: {
        scope: { TransactionData: true },
        version: { V0: true },
        appId: { Sui: true },
      },
      value: codecs.transactionData.parse(
        Uint8Array.from(Buffer.from(SUI_TRANSACTION_BYTES_B64, "base64")),
      ),
    },
    txSignatures: signatures,
  };
  return Buffer.from(
    codecs.senderSignedData
      .serialize(Array.from({ length: entryCount }, () => entry))
      .toBytes(),
  ).toString("hex");
}
