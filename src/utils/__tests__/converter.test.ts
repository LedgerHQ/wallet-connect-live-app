import { describe, expect, it } from "vitest";
import BigNumber from "bignumber.js";
import { EthTransaction, convertEthToLiveTX } from "../converters";
import eip55 from "eip55";
import { ethTx, to } from "@/tests-tools/mocks/eth-transaction.mock";

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
    const ethTx: EthTransaction = {
      value: "",
      to: to,
      gasPrice: "",
      gas: "",
      data: "",
    };

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
    const ethTx: EthTransaction = {
      value: "",
      gasPrice: "",
      gas: "",
      data: "",
    };

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
