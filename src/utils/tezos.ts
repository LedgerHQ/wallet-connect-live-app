import bs58check from "bs58check";

/**
 * base58check signature prefixes, keyed by the signer's implicit-address prefix.
 * Concatenated ahead of the raw r‖s bytes so the encoded string carries the curve
 * (edsig / spsig1 / p2sig), which is what Tezos dApps expect from `tezos_sign`.
 */
const SIGNATURE_PREFIX: Record<string, number[]> = {
  tz1: [9, 245, 205, 134, 18], // edsig   (Ed25519)
  tz2: [13, 115, 101, 19, 63], // spsig1  (secp256k1)
  tz3: [54, 240, 44, 52], // p2sig   (P-256)
};

const CURVE_ALGO: Record<string, string> = {
  tz1: "ed25519",
  tz2: "secp256k1",
  tz3: "p256",
};

export function tezosSignatureAlgo(address: string): string {
  const algo = CURVE_ALGO[address.slice(0, 3)];
  if (!algo) {
    throw new Error(`Unsupported Tezos address: ${address}`);
  }
  return algo;
}

export function encodeTezosSignature(rawSignature: Buffer, address: string): string {
  if (rawSignature.length !== 64) {
    throw new Error(`Invalid Tezos signature length: ${rawSignature.length} (expected 64)`);
  }
  const prefix = SIGNATURE_PREFIX[address.slice(0, 3)];
  if (!prefix) {
    throw new Error(`Unsupported Tezos address: ${address}`);
  }
  return bs58check.encode(Buffer.concat([Buffer.from(prefix), rawSignature]));
}
