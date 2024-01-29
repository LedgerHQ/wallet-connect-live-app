import { describe, expect, it } from 'vitest'
import { ACCOUNT_MOCK } from "@/tests-tools/mocks/account.mock";
import {
  compareAddresses,
  getAccountWithAddress,
  getAccountWithAddressAndChainId,
} from "../generic";

describe("compareAddresses", () => {
  it("should return true for two identical addresses", () => {
    const addr1 = "0x123456789";
    const addr2 = "0x123456789";
    expect(compareAddresses(addr1, addr2)).toBe(true);
  });

  it("should return true for two identical addresses with different letter case", () => {
    const addr1 = "0xABCDEF";
    const addr2 = "0xabcdef";
    expect(compareAddresses(addr1, addr2)).toBe(true);
  });

  it("should return false for two different addresses", () => {
    const addr1 = "0x123";
    const addr2 = "0x456";
    expect(compareAddresses(addr1, addr2)).toBe(false);
  });
});

describe("getAccountWithAddress", () => {
  it("should return the account with the specified address", () => {
    const accounts = [
      { ...ACCOUNT_MOCK, address: "0x123" },
      { ...ACCOUNT_MOCK, address: "0x456" },
      { ...ACCOUNT_MOCK, address: "0x789" },
    ];
    const addr = "0x456";
    const result = getAccountWithAddress(accounts, addr);
    expect(result).toEqual(accounts[1]);
  });

  it("should return undefined for an address that does not exist", () => {
    const accounts = [
      { ...ACCOUNT_MOCK, address: "0x123" },
      { ...ACCOUNT_MOCK, address: "0x789" },
    ];
    const addr = "0x456";
    const result = getAccountWithAddress(accounts, addr);
    expect(result).toBeUndefined();
  });
});

describe("getAccountWithAddressAndChainId", () => {
  it("should return the account with the specified address and chainId", () => {
    const chainId = "eip155:1";
    const res = getAccountWithAddressAndChainId([ACCOUNT_MOCK], ACCOUNT_MOCK.address, chainId);

    expect(res).toEqual(ACCOUNT_MOCK);
  });
  it("should return undefined if no account matches the address and chainId", () => {
    const chainId2 = "eip155:56";
    const res2 = getAccountWithAddressAndChainId([ACCOUNT_MOCK], ACCOUNT_MOCK.address, chainId2);
    expect(res2).toBeUndefined();
  });
});
