import { ethTx, to } from "@/tests/mocks/eth-transaction.mock";
import BigNumber from "bignumber.js";
import eip55 from "eip55";
import { describe, expect, it } from "vitest";
import { EthTransaction, convertEthToLiveTX } from "../converters";

describe("Converter File", () => {
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
});
