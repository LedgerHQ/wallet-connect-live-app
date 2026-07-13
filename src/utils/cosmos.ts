/**
 * coin-cosmos stores/returns the compressed secp256k1 public key and produces the detached
 * signature as non-0x hex strings (via the Wallet API `account.getPublicKey` /
 * `transaction.signRaw`). The WalletConnect Cosmos RPC expects both as base64.
 */
export function hexToBase64(hex: string): string {
  return Buffer.from(hex.replace(/^0x/, ""), "hex").toString("base64");
}
