import { describe, expect, it } from "vitest";
import {
  getDesktopOsType,
  getMobilePlatformOS,
  getPlatform,
  getPlatformProperties,
} from "../platform.util";

const MAC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) ledger-live-desktop/2.100.0 Chrome/126.0.0.0 Electron/31.0.0 Safari/537.36";
const WINDOWS_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Electron/31.0.0 Safari/537.36";
const LINUX_UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Electron/31.0.0 Safari/537.36";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";
const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const IPAD_UA =
  "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const IPOD_UA =
  "Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const UNKNOWN_UA = "Mozilla/5.0 (compatible; SomeBot/1.0)";

describe("getPlatform", () => {
  it.each([
    ["ledger-live-desktop", "desktop"],
    ["ledger-live-mobile", "mobile"],
    ["ledger-enterprise", "unknown"],
    ["toString", "unknown"],
    ["", "unknown"],
  ])("maps wallet name %j to %s", (walletName, expected) => {
    expect(getPlatform(walletName)).toBe(expected);
  });
});

describe("getDesktopOsType", () => {
  it.each([
    [MAC_UA, "Darwin"],
    [WINDOWS_UA, "Windows_NT"],
    [LINUX_UA, "Linux"],
    [ANDROID_UA, "unknown"],
    [UNKNOWN_UA, "unknown"],
    ["", "unknown"],
  ])("detects %j as %s", (userAgent, expected) => {
    expect(getDesktopOsType(userAgent)).toBe(expected);
  });
});

describe("getMobilePlatformOS", () => {
  it.each([
    [IPHONE_UA, "ios"],
    [IPAD_UA, "ios"],
    [IPOD_UA, "ios"],
    [ANDROID_UA, "android"],
    [MAC_UA, "unknown"],
    [UNKNOWN_UA, "unknown"],
  ])("detects %j as %s", (userAgent, expected) => {
    expect(getMobilePlatformOS(userAgent)).toBe(expected);
  });
});

describe("getPlatformProperties", () => {
  it("returns desktop platform with osType", () => {
    expect(getPlatformProperties("ledger-live-desktop", MAC_UA)).toEqual({
      platform: "desktop",
      osType: "Darwin",
    });
  });

  it("returns mobile platform with platformOS", () => {
    expect(getPlatformProperties("ledger-live-mobile", ANDROID_UA)).toEqual({
      platform: "mobile",
      platformOS: "android",
    });
  });

  it("returns only unknown platform for other wallets", () => {
    expect(getPlatformProperties("other-wallet", IPHONE_UA)).toEqual({
      platform: "unknown",
    });
  });
});
