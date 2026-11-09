import {
  buildSignedSuiTransactionHex,
  SUI_SERIALIZED_SIGNATURE,
  SUI_TRANSACTION_BYTES_B64,
} from "@/tests/mocks/sui.mock";
import { describe, expect, it } from "vitest";
import { decodeSignedSuiTransaction } from "../sui";

const SIGNATURE_B64 = Buffer.from(SUI_SERIALIZED_SIGNATURE).toString("base64");

describe("decodeSignedSuiTransaction", () => {
  it("returns the transaction bytes and the serialized signature as base64", () => {
    expect(decodeSignedSuiTransaction(buildSignedSuiTransactionHex(1))).toEqual(
      {
        transactionBytes: SUI_TRANSACTION_BYTES_B64,
        signature: SIGNATURE_B64,
      },
    );
  });

  it("returns a 97-byte signature for an Ed25519 key", () => {
    const { signature } = decodeSignedSuiTransaction(
      buildSignedSuiTransactionHex(1),
    );
    expect(Buffer.from(signature, "base64")).toHaveLength(97);
  });

  it("accepts a 0x-prefixed hex string", () => {
    expect(
      decodeSignedSuiTransaction(`0x${buildSignedSuiTransactionHex(1)}`)
        .signature,
    ).toBe(SIGNATURE_B64);
  });

  it("throws when there is no signed transaction", () => {
    expect(() =>
      decodeSignedSuiTransaction(buildSignedSuiTransactionHex(0, [])),
    ).toThrow("Expected one signed transaction");
  });

  it("throws when there are several signed transactions", () => {
    expect(() =>
      decodeSignedSuiTransaction(buildSignedSuiTransactionHex(2)),
    ).toThrow("Expected one signed transaction");
  });

  it("throws when the signature is missing", () => {
    expect(() =>
      decodeSignedSuiTransaction(buildSignedSuiTransactionHex(1, [])),
    ).toThrow("Expected one signature");
  });

  it("throws when there are two signatures", () => {
    expect(() =>
      decodeSignedSuiTransaction(
        buildSignedSuiTransactionHex(1, [
          SUI_SERIALIZED_SIGNATURE,
          SUI_SERIALIZED_SIGNATURE,
        ]),
      ),
    ).toThrow("Expected one signature");
  });

  it("throws on bytes that are not a SenderSignedData", () => {
    expect(() => decodeSignedSuiTransaction("ff")).toThrow();
  });
});
