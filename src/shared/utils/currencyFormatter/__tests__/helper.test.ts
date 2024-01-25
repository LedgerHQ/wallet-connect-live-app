import { describe, expect, it } from 'vitest'
import { isHexPrefixed, stripHexPrefix } from "../helpers";

describe("isHexPrefixed", () => {
  it("should return true if the string is hex-prefixed", () => {
    const hexString = "0x1a2b3c";
    const result = isHexPrefixed(hexString);
    expect(result).toBe(true);
  });

  it("should return false if the string is not hex-prefixed", () => {
    const nonHexString = "1a2b3c";
    const result = isHexPrefixed(nonHexString);
    expect(result).toBe(false);
  });
});

describe("stripHexPrefix", () => {
  it("should remove '0x' prefix from a hex string", () => {
    const hexString = "0x1a2b3c";
    const result = stripHexPrefix(hexString);
    expect(result).toBe("1a2b3c");
  });

  it("should not remove '0x' if it's not a prefix", () => {
    const hexString = "1a2b3c";
    const result = stripHexPrefix(hexString);
    expect(result).toBe("1a2b3c");
  });

  it("should handle an empty string", () => {
    const emptyString = "";
    const result = stripHexPrefix(emptyString);
    expect(result).toBe("");
  });
});
