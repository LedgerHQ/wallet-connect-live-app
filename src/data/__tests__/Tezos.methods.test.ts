import {
  tezosGetAccountsSchema,
  tezosSendSchema,
  tezosSignSchema,
} from "@/data/methods/Tezos.methods";
import { describe, expect, it } from "vitest";

describe("tezosGetAccountsSchema", () => {
  it("accepts an empty object and undefined params", () => {
    expect(tezosGetAccountsSchema.parse({})).toEqual({});
    expect(tezosGetAccountsSchema.parse(undefined)).toBeUndefined();
  });
});

describe("tezosSendSchema", () => {
  it("parses operations and preserves operation-specific fields", () => {
    const input = {
      account: "tz1abc",
      operations: [
        {
          kind: "transaction",
          destination: "tz1dest",
          amount: "1000",
          parameters: { entrypoint: "default", value: { prim: "Unit" } },
        },
      ],
    };
    expect(tezosSendSchema.parse(input)).toEqual(input);
  });

  it("requires a kind on each operation", () => {
    expect(() =>
      tezosSendSchema.parse({ account: "tz1abc", operations: [{ destination: "tz1d" }] }),
    ).toThrow();
  });

  it("requires the account field", () => {
    expect(() => tezosSendSchema.parse({ operations: [] })).toThrow();
  });
});

describe("tezosSignSchema", () => {
  it("parses a valid payload", () => {
    expect(tezosSignSchema.parse({ account: "tz1abc", payload: "0501" })).toEqual({
      account: "tz1abc",
      payload: "0501",
    });
  });

  it("requires the payload field", () => {
    expect(() => tezosSignSchema.parse({ account: "tz1abc" })).toThrow();
  });
});
