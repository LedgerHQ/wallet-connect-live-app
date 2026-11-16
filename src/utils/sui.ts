// BCS `SenderSignedData` with one transaction and one Ed25519 signature, as the wallet returns it:
//   01            one signed transaction
//   00 00 00      intent: TransactionData, V0, Sui
//   ...           TransactionData
//   01            one signature
//   61            signature length (97)
//   00 sig pubkey Ed25519 flag, 64-byte signature, 32-byte public key
const PREFIX = Uint8Array.from([0x01, 0x00, 0x00, 0x00]);
const SIGNATURE_HEADER = Uint8Array.from([0x01, 0x61, 0x00]);
const SIGNATURE_LENGTH = 97;
const SUFFIX_LENGTH = SIGNATURE_HEADER.length - 1 + SIGNATURE_LENGTH;

function startsWith(bytes: Uint8Array, expected: Uint8Array, offset = 0) {
  return expected.every((byte, i) => bytes[offset + i] === byte);
}

/**
 * Splits the wallet's signed Sui transaction into what `sui_signTransaction` returns.
 *
 * `signedTransactionHex` is the hex of a BCS `SenderSignedData` holding one transaction and one
 * Ed25519 signature. The dApp wants the transaction bytes and that signature, both base64.
 */
export function decodeSignedSuiTransaction(signedTransactionHex: string): {
  transactionBytes: string;
  signature: string;
} {
  const bytes = Uint8Array.from(
    Buffer.from(signedTransactionHex.replace(/^0x/, ""), "hex"),
  );
  const signatureStart = bytes.length - SUFFIX_LENGTH;

  if (signatureStart <= PREFIX.length || !startsWith(bytes, PREFIX)) {
    throw new Error("Expected one signed transaction");
  }
  if (!startsWith(bytes, SIGNATURE_HEADER, signatureStart)) {
    throw new Error("Expected one signature");
  }

  return {
    transactionBytes: Buffer.from(
      bytes.subarray(PREFIX.length, signatureStart),
    ).toString("base64"),
    signature: Buffer.from(
      bytes.subarray(signatureStart + SIGNATURE_HEADER.length - 1),
    ).toString("base64"),
  };
}
