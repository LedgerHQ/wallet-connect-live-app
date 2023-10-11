import { SUPPORTED_NETWORK } from "@/data/network.config";
import {
  formatUrl,
  getColor,
  getCurrencyByChainId,
  getDisplayName,
  getNamespace,
  getNetwork,
  getTicker,
  isDataInvalid,
  isEIP155Chain,
} from "../helper.util";

describe("Helper Util", () => {
  it("getTicker", async () => {
    const text = getTicker("polygon");
    expect(text).toEqual("MATIC");

    const textETh = getTicker("ethereum");
    expect(textETh).toEqual("ETH");
  });
  it("getNamespace", async () => {
    const text = getNamespace("ethereum");

    expect(text).toEqual("eip155:1");

    const falseText = getNamespace("polygome");
    expect(falseText).toEqual("polygome");
  });
  it("getCurrencyByChainId", async () => {
    const text = getCurrencyByChainId("error-title-blockchain-support");

    expect(text).toEqual("error-title-blockchain-support");

    const polygon = getCurrencyByChainId("eip155:137");

    expect(polygon).toEqual("polygon");
  });

  it("getNetwork", async () => {
    const matic = getNetwork("polygon");
    expect(matic.chainId).toEqual(SUPPORTED_NETWORK["polygon"].chainId);

    const arb = getNetwork("arbitrum");
    expect(arb.chainId).toEqual(SUPPORTED_NETWORK["arbitrum"].chainId);
  });

  it("getDisplayName", async () => {
    const matic = getDisplayName("polygon");
    expect(matic).toEqual(SUPPORTED_NETWORK["polygon"].displayName);

    const arb = getDisplayName("arboretum");
    expect(arb).toEqual("arboretum");
  });

  it("getColor", async () => {
    const matic = getColor("polygon");
    expect(matic).toEqual(SUPPORTED_NETWORK["polygon"].color);
  });
});

describe("isDataInvalid", () => {
  it("returns true for undefined data", () => {
    expect(isDataInvalid(undefined)).toBe(true);
  });

  it("returns true for empty data", () => {
    expect(isDataInvalid(Buffer.from("", "hex"))).toBe(true);
  });

  it("returns false for valid data", () => {
    const validData = Buffer.from("0123456789abcdef", "hex");
    expect(isDataInvalid(validData)).toBe(false);
  });
});

describe("isEIP155Chain", () => {
  it('returns true for a chain containing "eip155" as part of the name', () => {
    expect(isEIP155Chain("eip155:12")).toBe(true);
  });

  it('returns false for a chain not containing "eip155"', () => {
    expect(isEIP155Chain("bitcoin")).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(isEIP155Chain("")).toBe(false);
  });
});

describe("formatUrl", () => {
  it("removes protocol from a URL", () => {
    const inputUrl = "https://www.example.com";
    const expectedOutput = "www.example.com";
    expect(formatUrl(inputUrl)).toBe(expectedOutput);
  });

  it("handles URLs without a protocol", () => {
    const inputUrl = "www.example.com";
    const expectedOutput = "www.example.com";
    expect(formatUrl(inputUrl)).toBe(expectedOutput);
  });

  it("handles empty string", () => {
    const inputUrl = "";
    const expectedOutput = "";
    expect(formatUrl(inputUrl)).toBe(expectedOutput);
  });
});
