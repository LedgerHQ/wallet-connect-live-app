import { ethTx, to } from "@/tests/mocks/eth-transaction.mock";
import BigNumber from "bignumber.js";
import eip55 from "eip55";
import { describe, expect, it } from "vitest";
import {
  BtcTransaction,
  EthTransaction,
  MvxTransaction,
  XrpTransaction,
  btcTransactionSchema,
  convertBtcToLiveTX,
  convertEthToLiveTX,
  convertMvxToLiveTX,
  convertXrpToLiveTX,
  ethTransactionSchema,
  mvxTransactionSchema,
  xrpTransactionSchema,
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
});

describe("MVX/Elrond Converter", () => {
  it("convertMvxToLiveTX should convert correctly", () => {
    const mvxTx: MvxTransaction = {
      nonce: 42,
      value: "1000000000000000000", // 1 EGLD
      receiver: "erd1receiver",
      sender: "erd1sender",
      gasPrice: 1000000000,
      gasLimit: 50000,
      data: "transfer",
      chainID: "1",
      version: 1,
    };

    const converted = convertMvxToLiveTX(mvxTx);

    expect(converted).toEqual({
      family: "elrond",
      mode: "send",
      amount: new BigNumber("1000000000000000000"),
      recipient: "erd1receiver",
      gasLimit: 50000,
      data: "transfer",
    });
  });

  it("convertMvxToLiveTX should handle minimal transaction", () => {
    const mvxTx: MvxTransaction = {
      nonce: 0,
      value: "0",
      receiver: "erd1receiver",
      sender: "erd1sender",
      gasPrice: 1000000000,
      gasLimit: 50000,
      chainID: "1",
    };

    const converted = convertMvxToLiveTX(mvxTx);

    expect(converted.amount).toEqual(new BigNumber("0"));
    expect(converted.data).toBeUndefined();
  });
});

describe("MVX Transaction Schema", () => {
  it("should validate a complete MVX transaction", () => {
    const validTx = {
      nonce: 42,
      value: "1000000000000000000",
      receiver: "erd1receiver",
      sender: "erd1sender",
      gasPrice: 1000000000,
      gasLimit: 50000,
      data: "transfer",
      chainID: "1",
      version: 1,
      options: "0",
      guardian: "erd1guardian",
      receiverUsername: "receiver.elrond",
      senderUsername: "sender.elrond",
    };

    const result = mvxTransactionSchema.safeParse(validTx);
    expect(result.success).toBe(true);
  });

  it("should reject transaction with missing required fields", () => {
    const invalidTx = {
      nonce: 42,
      value: "1000000000000000000",
      // missing receiver, sender, gasPrice, gasLimit, chainID
    };

    const result = mvxTransactionSchema.safeParse(invalidTx);
    expect(result.success).toBe(false);
  });
});

describe("XRP Converter", () => {
  it("convertXrpToLiveTX should convert correctly with string amount", () => {
    const xrpTx: XrpTransaction = {
      TransactionType: "Payment",
      Account: "rSender123",
      Amount: "1000000", // 1 XRP in drops
      Destination: "rDestination456",
      Fee: "12",
    };

    const converted = convertXrpToLiveTX(xrpTx);

    expect(converted).toEqual({
      family: "ripple",
      tag: 0,
      amount: new BigNumber("1000000"),
      recipient: "rDestination456",
      fee: new BigNumber("12"),
    });
  });

  it("convertXrpToLiveTX should convert correctly with number amount", () => {
    const xrpTx: XrpTransaction = {
      TransactionType: "Payment",
      Account: "rSender123",
      Amount: 1000000,
      Destination: "rDestination456",
    };

    const converted = convertXrpToLiveTX(xrpTx);

    expect(converted.amount).toEqual(new BigNumber(1000000));
    expect(converted.fee).toBeUndefined();
  });

  it("convertXrpToLiveTX should handle transaction without fee", () => {
    const xrpTx: XrpTransaction = {
      TransactionType: "Payment",
      Account: "rSender123",
      Amount: "0",
      Destination: "rDestination456",
    };

    const converted = convertXrpToLiveTX(xrpTx);

    expect(converted.fee).toBeUndefined();
    expect(converted.amount).toEqual(new BigNumber("0"));
  });
});

describe("XRP Transaction Schema", () => {
  it("should validate a complete XRP transaction", () => {
    const validTx = {
      hash: "ABC123",
      TransactionType: "Payment",
      Account: "rSender123",
      Flags: 2147483648,
      Amount: "1000000",
      Destination: "rDestination456",
      Fee: "12",
    };

    const result = xrpTransactionSchema.safeParse(validTx);
    expect(result.success).toBe(true);
  });

  it("should allow Amount as number or string", () => {
    const txWithStringAmount = {
      TransactionType: "Payment",
      Account: "rSender123",
      Amount: "1000000",
      Destination: "rDestination456",
    };

    const txWithNumberAmount = {
      TransactionType: "Payment",
      Account: "rSender123",
      Amount: 1000000,
      Destination: "rDestination456",
    };

    expect(xrpTransactionSchema.safeParse(txWithStringAmount).success).toBe(
      true,
    );
    expect(xrpTransactionSchema.safeParse(txWithNumberAmount).success).toBe(
      true,
    );
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
