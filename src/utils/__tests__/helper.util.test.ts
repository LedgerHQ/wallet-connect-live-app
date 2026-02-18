import { SUPPORTED_NETWORK } from "@/data/network.config";
import { describe, expect, it } from "vitest";
import {
  formatUrl,
  getColor,
  getCurrencyByChainId,
  getDisplayName,
  getErrorMessage,
  getNamespace,
  getTicker,
  isEIP155Chain,
  isSolanaSupportEnabled,
  isXRPLSupportEnabled,
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

// Reusable factory for walletInfo objects used in version support tests
const createWalletInfo = (name: string, version?: string) => ({
  wallet: {
    name,
    version: version ?? "",
  },
  tracking: false,
});

describe("isSolanaSupportEnabled", () => {
  it("should return true for supported desktop versions at minimum requirement", () => {
    const walletInfo = createWalletInfo("ledger-live-desktop", "2.126.0");
    expect(isSolanaSupportEnabled(walletInfo)).toBe(true);
  });

  it("should return true for supported desktop versions above minimum requirement", () => {
    const walletInfo = createWalletInfo("ledger-live-desktop", "2.126.1");
    expect(isSolanaSupportEnabled(walletInfo)).toBe(true);

    const walletInfo2 = createWalletInfo("ledger-live-desktop", "2.127.0");
    expect(isSolanaSupportEnabled(walletInfo2)).toBe(true);
  });

  it("should return false for desktop versions below minimum requirement", () => {
    const walletInfo = createWalletInfo("ledger-live-desktop", "2.125.9");
    expect(isSolanaSupportEnabled(walletInfo)).toBe(false);
  });

  it("should return true for supported mobile versions at minimum requirement", () => {
    const walletInfo = createWalletInfo("ledger-live-mobile", "3.90.0");
    expect(isSolanaSupportEnabled(walletInfo)).toBe(true);
  });

  it("should return true for supported mobile versions above minimum requirement", () => {
    const walletInfo = createWalletInfo("ledger-live-mobile", "3.90.1");
    expect(isSolanaSupportEnabled(walletInfo)).toBe(true);

    const walletInfo2 = createWalletInfo("ledger-live-mobile", "3.91.0");
    expect(isSolanaSupportEnabled(walletInfo2)).toBe(true);
  });

  it("should return false for mobile versions below minimum requirement", () => {
    const walletInfo = createWalletInfo("ledger-live-mobile", "3.89.9");
    expect(isSolanaSupportEnabled(walletInfo)).toBe(false);
  });

  it("should return false for unsupported wallet names", () => {
    const walletInfo = createWalletInfo("other-wallet", "5.0.0");
    expect(isSolanaSupportEnabled(walletInfo)).toBe(false);
  });

  it("should return false when version is empty string", () => {
    const walletInfo = createWalletInfo("ledger-live-desktop", "");
    expect(isSolanaSupportEnabled(walletInfo)).toBe(false);
  });

  it("should handle edge cases with different version formats", () => {
    const walletInfo1 = createWalletInfo("ledger-live-desktop", "2.126.0");
    expect(isSolanaSupportEnabled(walletInfo1)).toBe(true);

    const walletInfo2 = createWalletInfo("ledger-live-mobile", "3.90.0");
    expect(isSolanaSupportEnabled(walletInfo2)).toBe(true);
  });

  it("should handle invalid version formats gracefully", () => {
    const walletInfo1 = createWalletInfo("ledger-live-desktop", "2.126");
    expect(isSolanaSupportEnabled(walletInfo1)).toBe(false);

    const walletInfo2 = createWalletInfo("ledger-live-mobile", "invalid");
    expect(isSolanaSupportEnabled(walletInfo2)).toBe(false);
  });

  it("should support version numbers with suffixes (pre-release versions)", () => {
    // Note: According to semver, pre-release versions are LOWER than their release versions
    // 2.126.0-beta.1 < 2.126.0, so if minimum is 2.126.0, pre-release should be rejected
    const walletInfoBeta = createWalletInfo(
      "ledger-live-desktop",
      "2.126.0-beta.1",
    );
    expect(isSolanaSupportEnabled(walletInfoBeta)).toBe(false);

    // However, a higher version with pre-release suffix should work
    const walletInfoBetaHigher = createWalletInfo(
      "ledger-live-desktop",
      "2.127.0-beta.1",
    );
    expect(isSolanaSupportEnabled(walletInfoBetaHigher)).toBe(true);

    // Test rc versions - same behavior
    const walletInfoRc = createWalletInfo("ledger-live-mobile", "3.90.0-rc.2");
    expect(isSolanaSupportEnabled(walletInfoRc)).toBe(false); // Less than 3.90.0

    const walletInfoRcHigher = createWalletInfo(
      "ledger-live-mobile",
      "3.91.0-rc.1",
    );
    expect(isSolanaSupportEnabled(walletInfoRcHigher)).toBe(true); // Greater than 3.90.0

    // Test alpha versions
    const walletInfoAlpha = createWalletInfo(
      "ledger-live-desktop",
      "2.127.0-alpha.3",
    );
    expect(isSolanaSupportEnabled(walletInfoAlpha)).toBe(true);

    // Test that pre-release versions below minimum are rejected
    const walletInfoBelowMin = createWalletInfo(
      "ledger-live-desktop",
      "2.125.0-beta.1",
    );
    expect(isSolanaSupportEnabled(walletInfoBelowMin)).toBe(false);
  });
});

describe("isXRPLSupportEnabled", () => {
  it("returns true when required capability is present", () => {
    const caps = ["account.request", "transaction.signRaw", "wallet.open"];
    expect(isXRPLSupportEnabled(caps)).toBe(true);
  });

  it("returns false when required capability is missing", () => {
    const caps = ["account.request", "transaction.sign", "wallet.open"];
    expect(isXRPLSupportEnabled(caps)).toBe(false);
  });

  it("returns false for empty capabilities array", () => {
    expect(isXRPLSupportEnabled([])).toBe(false);
  });

  it("is case sensitive (mismatched case should return false)", () => {
    const caps = ["Transaction.SignRaw"]; // wrong casing
    expect(isXRPLSupportEnabled(caps)).toBe(false);
  });

  it("returns true regardless of capability order", () => {
    const caps = ["transaction.signRaw", "account.request"];
    expect(isXRPLSupportEnabled(caps)).toBe(true);
  });

  it("returns true when capability list contains duplicates including the required one", () => {
    const caps = [
      "transaction.signRaw",
      "transaction.signRaw",
      "account.request",
    ];
    expect(isXRPLSupportEnabled(caps)).toBe(true);
  });

  it("returns true when additional unrelated capabilities are present", () => {
    const caps = [
      "foo.bar",
      "another.capability",
      "transaction.signRaw",
      "yet.another",
    ];
    expect(isXRPLSupportEnabled(caps)).toBe(true);
  });
});

describe("getErrorMessage", () => {
  it("returns error.message for Error instances", () => {
    const err = new Error("Something went wrong");
    expect(getErrorMessage(err)).toBe("Something went wrong");
  });

  it("returns String(value) for non-Error values", () => {
    expect(getErrorMessage("oops")).toBe("oops");
    expect(getErrorMessage(42)).toBe("42");
  });
});
