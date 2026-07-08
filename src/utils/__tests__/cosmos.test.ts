import { describe, expect, it } from "vitest";
import { hexToBase64 } from "../cosmos";

describe("hexToBase64", () => {
  it("converts a compressed secp256k1 pubkey hex to base64", () => {
    const hex = "02" + "ab".repeat(32); // 33-byte compressed pubkey
    expect(hexToBase64(hex)).toBe(Buffer.from(hex, "hex").toString("base64"));
  });

  it("strips a 0x prefix before decoding", () => {
    expect(hexToBase64("0xab")).toBe(hexToBase64("ab"));
  });

  it("round-trips a 64-byte signature", () => {
    const sigHex = "cd".repeat(64);
    expect(Buffer.from(hexToBase64(sigHex), "base64").toString("hex")).toBe(
      sigHex,
    );
  });
});
