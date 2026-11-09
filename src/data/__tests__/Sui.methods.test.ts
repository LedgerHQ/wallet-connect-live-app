import {
  suiGetAccountsSchema,
  suiSignAndExecuteTransactionSchema,
  suiSignTransactionSchema,
} from "@/data/methods/Sui.methods";
import { describe, expect, it } from "vitest";

const ADDRESS = `0x${"11".repeat(32)}`;

describe("suiGetAccountsSchema", () => {
  it("accepts an empty object and undefined params", () => {
    expect(suiGetAccountsSchema.parse({})).toEqual({});
    expect(suiGetAccountsSchema.parse(undefined)).toBeUndefined();
  });

  it("rejects unexpected params", () => {
    expect(() => suiGetAccountsSchema.parse({ extra: 1 })).toThrow();
  });
});

describe.each([
  ["suiSignTransactionSchema", suiSignTransactionSchema],
  ["suiSignAndExecuteTransactionSchema", suiSignAndExecuteTransactionSchema],
])("%s", (_name, schema) => {
  it("accepts a serialized Transaction JSON string", () => {
    const input = {
      transaction: JSON.stringify({ version: 2, commands: [] }),
      address: ADDRESS,
    };
    expect(schema.parse(input)).toEqual(input);
  });

  it("accepts a base64 BCS string", () => {
    const input = { transaction: "AAACACBvsh/urQJ9", address: ADDRESS };
    expect(schema.parse(input)).toEqual(input);
  });

  it("requires the signer address", () => {
    expect(() => schema.parse({ transaction: "AAAC" })).toThrow();
  });

  it("rejects an empty transaction", () => {
    expect(() => schema.parse({ transaction: "", address: ADDRESS })).toThrow();
  });

  it("rejects a non-string transaction", () => {
    expect(() =>
      schema.parse({ transaction: { commands: [] }, address: ADDRESS }),
    ).toThrow();
  });

  it("rejects extra keys", () => {
    expect(() =>
      schema.parse({
        transaction: "AAAC",
        address: ADDRESS,
        chain: "sui:mainnet",
      }),
    ).toThrow();
  });
});
