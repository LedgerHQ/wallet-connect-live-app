import { describe, expect, it } from "vitest";
import { z } from "zod";
import { rippleSignTransactionSchema } from "../methods/Ripple.methods";

const input = {
  tx_json: {
    Account: "r...",
    TransactionType: "Payment",
    Fee: "12",
  },
};

describe("Ripple Zod schema unknown keys behavior", () => {
  it("keeps unknown tx_json fields from the current parsed result", () => {
    const parsed = rippleSignTransactionSchema.parse(input);

    expect(parsed.tx_json).toEqual(input.tx_json);
  });

  it("shows why a plain z.object would strip unknown tx_json fields", () => {
    const schemaWithPlainObject = z.strictObject({
      tx_json: z.object({
        Account: z.string(),
      }),
    });

    const parsed = schemaWithPlainObject.parse(input);

    expect(parsed.tx_json).toEqual({
      Account: "r...",
    });
  });
});
