export type Platform = "desktop" | "mobile" | "unknown";

export type DesktopOsType = "Darwin" | "Windows_NT" | "Linux" | "unknown";

export type MobilePlatformOS = "ios" | "android" | "unknown";

export type PlatformProperties =
  | { platform: "desktop"; osType: DesktopOsType }
  | { platform: "mobile"; platformOS: MobilePlatformOS }
  | { platform: "unknown" };

const walletNameToPlatform = new Map<string, Platform>([
  ["ledger-live-desktop", "desktop"],
  ["ledger-live-mobile", "mobile"],
]);

export function getPlatform(walletName: string): Platform {
  return walletNameToPlatform.get(walletName) ?? "unknown";
}

export function getDesktopOsType(userAgent: string): DesktopOsType {
  if (userAgent.includes("Windows")) {
    return "Windows_NT";
  }
  if (/Macintosh|Mac OS X/.test(userAgent)) {
    return "Darwin";
  }
  if (userAgent.includes("Linux") && !userAgent.includes("Android")) {
    return "Linux";
  }
  return "unknown";
}

export function getMobilePlatformOS(userAgent: string): MobilePlatformOS {
  if (/iPhone|iPad|iPod/.test(userAgent)) {
    return "ios";
  }
  if (userAgent.includes("Android")) {
    return "android";
  }
  return "unknown";
}

export function getPlatformProperties(
  walletName: string,
  userAgent: string,
): PlatformProperties {
  const platform = getPlatform(walletName);
  if (platform === "desktop") {
    return { platform, osType: getDesktopOsType(userAgent) };
  }
  if (platform === "mobile") {
    return { platform, platformOS: getMobilePlatformOS(userAgent) };
  }
  return { platform };
}
