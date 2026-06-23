import bs58check from "bs58check";
import { describe, expect, it } from "vitest";
import { encodeTezosSignature, tezosSignatureAlgo } from "../tezos";

const RAW_SIGNATURE = Buffer.alloc(64, 7); // 64-byte r‖s, contents irrelevant

describe("tezosSignatureAlgo", () => {
  it("maps the implicit-address prefix to its curve", () => {
    expect(tezosSignatureAlgo("tz1abc")).toBe("ed25519");
    expect(tezosSignatureAlgo("tz2abc")).toBe("secp256k1");
    expect(tezosSignatureAlgo("tz3abc")).toBe("p256");
  });

  it("throws on an unsupported address", () => {
    expect(() => tezosSignatureAlgo("KT1abc")).toThrow();
  });
});

describe("encodeTezosSignature", () => {
  it.each([
    ["tz1", "edsig"],
    ["tz2", "spsig1"],
    ["tz3", "p2sig"],
  ])("encodes a %s signature with the matching prefix", (addr, prefix) => {
    const encoded = encodeTezosSignature(RAW_SIGNATURE, addr);
    expect(encoded.startsWith(prefix)).toBe(true);
  });

  it("produces a base58check string that round-trips back to the raw signature", () => {
    const encoded = encodeTezosSignature(RAW_SIGNATURE, "tz1abc");
    // Strip the 5-byte edsig prefix; the remainder is the original r‖s.
    const decoded = Buffer.from(bs58check.decode(encoded)).subarray(5);
    expect(decoded.equals(RAW_SIGNATURE)).toBe(true);
  });

  it("throws on an unsupported address", () => {
    expect(() => encodeTezosSignature(RAW_SIGNATURE, "KT1abc")).toThrow();
  });

  it("throws on a signature that is not 64 bytes", () => {
    expect(() => encodeTezosSignature(Buffer.alloc(65, 7), "tz1abc")).toThrow();
    expect(() => encodeTezosSignature(Buffer.alloc(0), "tz1abc")).toThrow();
  });
});
