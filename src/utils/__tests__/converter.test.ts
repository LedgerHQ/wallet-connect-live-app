import { ethTx, to } from "@/tests/mocks/eth-transaction.mock";
import BigNumber from "bignumber.js";
import eip55 from "eip55";
import { describe, expect, it } from "vitest";
import {
  BtcTransaction,
  EthTransaction,
  btcTransactionSchema,
  convertBtcToLiveTX,
  convertEthToLiveTX,
  ethTransactionSchema,
} from "../converters";

describe("Ethereum Converter", () => {
  it("convertEthToLiveTX correclty formatted", () => {
    const expected = {
      family: "ethereum",
      amount: new BigNumber(ethTx.value.replace("0x", ""), 16),
      recipient: ethTx.to ? eip55.encode(ethTx.to) : "",
      gasPrice: new BigNumber(ethTx.gasPrice.replace("0x", ""), 16),
      gasLimit: new BigNumber(ethTx.gas.replace("0x", ""), 16),
      data: Buffer.from(ethTx.data.replace("0x", ""), "hex"),
    };
    const converted = convertEthToLiveTX(ethTx);

    expect(converted).toEqual(expected);
  });

  it("convertEthToLiveTX wrongly formatted", () => {
    const ethTx = {
      value: "",
      to: to,
      from: "",
      gasPrice: "",
      gas: "",
      data: "",
    } as const satisfies EthTransaction;

    const expected = {
      family: "ethereum",
      amount: new BigNumber(0),
      recipient: eip55.encode(to),
      gasPrice: new BigNumber(0),
      gasLimit: new BigNumber(0),
      data: undefined,
    };
    const converted = convertEthToLiveTX(ethTx);

    expect(converted).toEqual(expected);
  });

  it("convertEthToLiveTX should handle TX without recipient", () => {
    const ethTx = {
      from: "",
      value: "",
      gasPrice: "",
      gas: "",
      data: "",
    } as const satisfies EthTransaction;

    const expected = {
      family: "ethereum",
      amount: new BigNumber(0),
      recipient: "",
      gasPrice: new BigNumber(0),
      gasLimit: new BigNumber(0),
      data: undefined,
    };
    const converted = convertEthToLiveTX(ethTx);

    expect(converted).toEqual(expected);
  });

  // Tests for nullable maxFeePerGas and maxPriorityFeePerGas
  it("convertEthToLiveTX should handle null maxFeePerGas and maxPriorityFeePerGas", () => {
    const ethTx = {
      from: "0x123",
      value: "0x64", // 100 in hex
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
    } as const satisfies EthTransaction;

    const converted = convertEthToLiveTX(ethTx);

    expect(converted.maxFeePerGas).toBeUndefined();
    expect(converted.maxPriorityFeePerGas).toBeUndefined();
    expect(converted.amount).toEqual(new BigNumber(100));
  });

  it("convertEthToLiveTX should handle undefined maxFeePerGas and maxPriorityFeePerGas", () => {
    const ethTx = {
      from: "0x123",
      value: "0x64", // 100 in hex
    } as const satisfies EthTransaction;

    const converted = convertEthToLiveTX(ethTx);

    expect(converted.maxFeePerGas).toBeUndefined();
    expect(converted.maxPriorityFeePerGas).toBeUndefined();
  });

  it("convertEthToLiveTX should handle valid maxFeePerGas and maxPriorityFeePerGas", () => {
    const ethTx = {
      from: "0x123",
      value: "0x64", // 100 in hex
      maxFeePerGas: "0x77359400", // 2000000000 in hex
      maxPriorityFeePerGas: "0x3b9aca00", // 1000000000 in hex
    } as const satisfies EthTransaction;

    const converted = convertEthToLiveTX(ethTx);

    expect(converted.maxFeePerGas).toEqual(new BigNumber("2000000000"));
    expect(converted.maxPriorityFeePerGas).toEqual(new BigNumber("1000000000"));
  });

  it("convertEthToLiveTX should handle nonce conversion correctly", () => {
    const ethTx = {
      from: "0x123",
      nonce: "42",
    } as const satisfies EthTransaction;

    const converted = convertEthToLiveTX(ethTx);
    expect(converted.nonce).toBe(42);
  });

  it("convertEthToLiveTX should handle invalid nonce", () => {
    const ethTx = {
      from: "0x123",
      nonce: "invalid",
    } as const satisfies EthTransaction;

    const converted = convertEthToLiveTX(ethTx);
    expect(converted.nonce).toBeUndefined();
  });
});

describe("Ethereum Transaction Schema", () => {
  it("should validate a complete ethereum transaction", () => {
    const validTx = {
      from: "0x123",
      to: "0x456",
      data: "0xabcd",
      gas: "0x5208",
      gasPrice: "0x77359400",
      maxFeePerGas: "0x77359400",
      maxPriorityFeePerGas: "0x3b9aca00",
      value: "0x64",
      nonce: "42",
      chainId: "1",
      type: "0x2",
    };

    const result = ethTransactionSchema.safeParse(validTx);
    expect(result.success).toBe(true);
  });

  it("should allow null maxFeePerGas and maxPriorityFeePerGas", () => {
    const validTx = {
      from: "0x123",
      maxFeePerGas: null,
      maxPriorityFeePerGas: null,
    };

    const result = ethTransactionSchema.safeParse(validTx);
    expect(result.success).toBe(true);
  });

  it("should reject transaction without required from field", () => {
    const invalidTx = {
      to: "0x456",
    };

    const result = ethTransactionSchema.safeParse(invalidTx);
    expect(result.success).toBe(false);
  });

  describe("accessList validation (EIP-2930)", () => {
    it("should accept transaction without accessList (optional field)", () => {
      const validTx = {
        from: "0x742d35cc6634c0532925a3b844bc9e7595f0bebb",
        to: "0x5aeda56215b167893e80b4fe645ba6d5bab767de",
      };

      const result = ethTransactionSchema.safeParse(validTx);
      expect(result.success).toBe(true);
    });

    it("should accept empty accessList", () => {
      const validTx = {
        from: "0x742d35cc6634c0532925a3b844bc9e7595f0bebb",
        to: "0x5aeda56215b167893e80b4fe645ba6d5bab767de",
        accessList: [],
      };

      const result = ethTransactionSchema.safeParse(validTx);
      expect(result.success).toBe(true);
    });

    it("should accept valid accessList with one item", () => {
      const validTx = {
        from: "0x742d35cc6634c0532925a3b844bc9e7595f0bebb",
        to: "0x5aeda56215b167893e80b4fe645ba6d5bab767de",
        accessList: [
          {
            address: "0x742d35cc6634c0532925a3b844bc9e7595f0bebb",
            storageKeys: [
              "0x0000000000000000000000000000000000000000000000000000000000000001",
            ],
          },
        ],
      };

      const result = ethTransactionSchema.safeParse(validTx);
      expect(result.success).toBe(true);
    });

    it("should accept valid accessList with multiple items and storage keys", () => {
      const validTx = {
        from: "0x742d35cc6634c0532925a3b844bc9e7595f0bebb",
        to: "0x5aeda56215b167893e80b4fe645ba6d5bab767de",
        accessList: [
          {
            address: "0x742d35cc6634c0532925a3b844bc9e7595f0bebb",
            storageKeys: [
              "0x0000000000000000000000000000000000000000000000000000000000000001",
              "0x0000000000000000000000000000000000000000000000000000000000000002",
            ],
          },
          {
            address: "0x5aeda56215b167893e80b4fe645ba6d5bab767de",
            storageKeys: [
              "0x0000000000000000000000000000000000000000000000000000000000000003",
            ],
          },
        ],
      };

      const result = ethTransactionSchema.safeParse(validTx);
      expect(result.success).toBe(true);
    });

    it("should accept accessList item with empty storage keys array", () => {
      const validTx = {
        from: "0x742d35cc6634c0532925a3b844bc9e7595f0bebb",
        to: "0x5aeda56215b167893e80b4fe645ba6d5bab767de",
        accessList: [
          {
            address: "0x742d35cc6634c0532925a3b844bc9e7595f0bebb",
            storageKeys: [],
          },
        ],
      };

      const result = ethTransactionSchema.safeParse(validTx);
      expect(result.success).toBe(true);
    });

    it("should reject accessList with invalid address format (too short)", () => {
      const invalidTx = {
        from: "0x742d35cc6634c0532925a3b844bc9e7595f0bebb",
        to: "0x5aeda56215b167893e80b4fe645ba6d5bab767de",
        accessList: [
          {
            address: "0x742d35cc6634c0532925a3b844bc9e7595f0be", // Too short (39 chars instead of 40)
            storageKeys: [
              "0x0000000000000000000000000000000000000000000000000000000000000001",
            ],
          },
        ],
      };

      const result = ethTransactionSchema.safeParse(invalidTx);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Address must be 20 bytes"
        );
      }
    });

    it("should reject accessList with invalid address format (too long)", () => {
      const invalidTx = {
        from: "0x742d35cc6634c0532925a3b844bc9e7595f0bebb",
        to: "0x5aeda56215b167893e80b4fe645ba6d5bab767de",
        accessList: [
          {
            address: "0x742d35cc6634c0532925a3b844bc9e7595f0bebba", // Too long (41 chars instead of 40)
            storageKeys: [
              "0x0000000000000000000000000000000000000000000000000000000000000001",
            ],
          },
        ],
      };

      const result = ethTransactionSchema.safeParse(invalidTx);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Address must be 20 bytes"
        );
      }
    });

    it("should reject accessList with address missing 0x prefix", () => {
      const invalidTx = {
        from: "0x742d35cc6634c0532925a3b844bc9e7595f0bebb",
        to: "0x5aeda56215b167893e80b4fe645ba6d5bab767de",
        accessList: [
          {
            address: "742d35cc6634c0532925a3b844bc9e7595f0bebb", // Missing 0x prefix
            storageKeys: [
              "0x0000000000000000000000000000000000000000000000000000000000000001",
            ],
          },
        ],
      };

      const result = ethTransactionSchema.safeParse(invalidTx);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Address must be 20 bytes"
        );
      }
    });

    it("should reject accessList with invalid storage key format (too short)", () => {
      const invalidTx = {
        from: "0x742d35cc6634c0532925a3b844bc9e7595f0bebb",
        to: "0x5aeda56215b167893e80b4fe645ba6d5bab767de",
        accessList: [
          {
            address: "0x742d35cc6634c0532925a3b844bc9e7595f0bebb",
            storageKeys: [
              "0x00000000000000000000000000000000000000000000000000000000000001", // Too short (62 chars instead of 64)
            ],
          },
        ],
      };

      const result = ethTransactionSchema.safeParse(invalidTx);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Storage key must be 32 bytes"
        );
      }
    });

    it("should reject accessList with invalid storage key format (too long)", () => {
      const invalidTx = {
        from: "0x742d35cc6634c0532925a3b844bc9e7595f0bebb",
        to: "0x5aeda56215b167893e80b4fe645ba6d5bab767de",
        accessList: [
          {
            address: "0x742d35cc6634c0532925a3b844bc9e7595f0bebb",
            storageKeys: [
              "0x00000000000000000000000000000000000000000000000000000000000000011", // Too long (67 chars instead of 66)
            ],
          },
        ],
      };

      const result = ethTransactionSchema.safeParse(invalidTx);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Storage key must be 32 bytes"
        );
      }
    });

    it("should reject accessList with storage key missing 0x prefix", () => {
      const invalidTx = {
        from: "0x742d35cc6634c0532925a3b844bc9e7595f0bebb",
        to: "0x5aeda56215b167893e80b4fe645ba6d5bab767de",
        accessList: [
          {
            address: "0x742d35cc6634c0532925a3b844bc9e7595f0bebb",
            storageKeys: [
              "0000000000000000000000000000000000000000000000000000000000000001", // Missing 0x prefix
            ],
          },
        ],
      };

      const result = ethTransactionSchema.safeParse(invalidTx);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Storage key must be 32 bytes"
        );
      }
    });

    it("should reject accessList with non-hex characters in address", () => {
      const invalidTx = {
        from: "0x742d35cc6634c0532925a3b844bc9e7595f0bebb",
        to: "0x5aeda56215b167893e80b4fe645ba6d5bab767de",
        accessList: [
          {
            address: "0x742d35cc6634c0532925a3b844bc9e7595f0begg", // 'g' is not a hex character
            storageKeys: [
              "0x0000000000000000000000000000000000000000000000000000000000000001",
            ],
          },
        ],
      };

      const result = ethTransactionSchema.safeParse(invalidTx);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Address must be 20 bytes"
        );
      }
    });

    it("should reject accessList with non-hex characters in storage key", () => {
      const invalidTx = {
        from: "0x742d35cc6634c0532925a3b844bc9e7595f0bebb",
        to: "0x5aeda56215b167893e80b4fe645ba6d5bab767de",
        accessList: [
          {
            address: "0x742d35cc6634c0532925a3b844bc9e7595f0bebb",
            storageKeys: [
              "0x000000000000000000000000000000000000000000000000000000000000000g", // 'g' is not a hex character
            ],
          },
        ],
      };

      const result = ethTransactionSchema.safeParse(invalidTx);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Storage key must be 32 bytes"
        );
      }
    });

    it("should accept accessList with uppercase hex characters", () => {
      const validTx = {
        from: "0x742d35cc6634c0532925a3b844bc9e7595f0bebb",
        to: "0x5aeda56215b167893e80b4fe645ba6d5bab767de",
        accessList: [
          {
            address: "0x742D35CC6634C0532925A3B844BC9E7595F0BEBB",
            storageKeys: [
              "0x0000000000000000000000000000000000000000000000000000000000000001",
              "0x000000000000000000000000000000000000000000000000000000000000ABCD",
            ],
          },
        ],
      };

      const result = ethTransactionSchema.safeParse(validTx);
      expect(result.success).toBe(true);
    });
  });
});

describe("Bitcoin Converter", () => {
  it("convertBtcToLiveTX should convert correctly", () => {
    const btcTx: BtcTransaction = {
      account: "bc1account123",
      recipientAddress: "bc1recipient456",
      amount: "100000000", // 1 BTC in satoshis
      memo: "48656c6c6f", // "Hello" in hex
    };

    const converted = convertBtcToLiveTX(btcTx);

    expect(converted).toEqual({
      family: "bitcoin",
      amount: new BigNumber("100000000"),
      recipient: "bc1recipient456",
      opReturnData: Buffer.from("48656c6c6f", "hex"),
    });
  });

  it("convertBtcToLiveTX should handle transaction without memo", () => {
    const btcTx: BtcTransaction = {
      account: "bc1account123",
      recipientAddress: "bc1recipient456",
      amount: "0",
    };

    const converted = convertBtcToLiveTX(btcTx);

    expect(converted.opReturnData).toBeUndefined();
    expect(converted.amount).toEqual(new BigNumber("0"));
  });
});

describe("Bitcoin Transaction Schema", () => {
  it("should validate a complete Bitcoin transaction", () => {
    const validTx = {
      account: "bc1account123",
      recipientAddress: "bc1recipient456",
      amount: "100000000",
      memo: "48656c6c6f",
    };

    const result = btcTransactionSchema.safeParse(validTx);
    expect(result.success).toBe(true);
  });

  it("should reject transaction with missing required fields", () => {
    const invalidTx = {
      account: "bc1account123",
      // missing recipientAddress and amount
    };

    const result = btcTransactionSchema.safeParse(invalidTx);
    expect(result.success).toBe(false);
  });
});
