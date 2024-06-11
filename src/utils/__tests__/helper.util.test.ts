import { describe, expect, it } from "vitest";
import { SUPPORTED_NETWORK } from "@/data/network.config";
import {
  formatUrl,
  getColor,
  getCurrencyByChainId,
  getDisplayName,
  getNamespace,
  getTicker,
  isEIP155Chain,
  truncate,
} from "../helper.util";

describe("Helper Util", () => {
  it("getTicker", () => {
    const text = getTicker("polygon");
    expect(text).toEqual("MATIC");

    const textETh = getTicker("ethereum");
    expect(textETh).toEqual("ETH");
  });
  it("getNamespace", () => {
    const text = getNamespace("ethereum");

    expect(text).toEqual("eip155:1");

    const falseText = getNamespace("polygome");
    expect(falseText).toEqual("polygome");
  });
  it("getCurrencyByChainId", () => {
    const text = getCurrencyByChainId("error-title-blockchain-support");

    expect(text).toEqual("error-title-blockchain-support");

    const polygon = getCurrencyByChainId("eip155:137");

    expect(polygon).toEqual("polygon");
  });

  it("getDisplayName", () => {
    const matic = getDisplayName("polygon");
    expect(matic).toEqual(SUPPORTED_NETWORK.polygon.displayName);

    const arb = getDisplayName("arboretum");
    expect(arb).toEqual("arboretum");
  });

  it("getColor", () => {
    const matic = getColor("polygon");
    expect(matic).toEqual(SUPPORTED_NETWORK.polygon.color);
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

describe("truncate", () => {
  it("should return the same string when it's shorter than the specified length", () => {
    const inputString = "Short";
    const length = 10;
    const result = truncate(inputString, length);
    expect(result).toBe(inputString);
  });

  it("should truncate a long string in the middle", () => {
    const inputString = "ThisIsALongString";
    const length = 8;
    const result = truncate(inputString, length);
    expect(result).toBe("Thi...ng");
  });

  it("should handle the minimum possible length correctly", () => {
    const inputString = "Hello";
    const length = 0;
    const result = truncate(inputString, length);
    expect(result).toBe("...");
  });

  it("should handle an empty string", () => {
    const inputString = "";
    const length = 5;
    const result = truncate(inputString, length);
    expect(result).toBe("");
  });

  it("should handle a string with just the separator", () => {
    const inputString = "...";
    const length = 4;
    const result = truncate(inputString, length);
    expect(result).toBe("...");
  });
});
