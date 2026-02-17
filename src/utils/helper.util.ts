import { BIP122_REQUESTS } from "@/data/methods/BIP122.methods";
import { EIP155_REQUESTS } from "@/data/methods/EIP155Data.methods";
import { RIPPLE_REQUESTS } from "@/data/methods/Ripple.methods";
import { SOLANA_REQUESTS } from "@/data/methods/Solana.methods";
import { WALLET_REQUESTS } from "@/data/methods/Wallet.methods";
import { SUPPORTED_NETWORK } from "@/data/network.config";
import type { WalletInfo } from "@ledgerhq/wallet-api-client";
import semver from "semver";

/**
 * Truncates string (in the middle) via given lenght value
 */
export function truncate(value: string, length: number) {
  if (value?.length <= length) {
    return value;
  }

  const separator = "...";
  const stringLength = length - separator.length;
  const frontLength = Math.ceil(stringLength / 2);
  const backLength = Math.floor(stringLength / 2);

  return (
    value.substring(0, frontLength) +
    separator +
    value.substring(value.length - backLength)
  );
}

/**
 * Check if it's a wallet request
 */
export function isWalletRequest(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: { method: string; params: any },
): request is WALLET_REQUESTS {
  return request.method.startsWith("wallet_");
}

/**
 * Check if chain is part of EIP155 standard
 */
export function isEIP155Chain(
  chain: string,
  // request is passed and used here only for type narrowing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _request?: { method: string; params: any },
): _request is EIP155_REQUESTS {
  return chain.startsWith("eip155");
}

export function isBIP122Chain(
  chain: string,
  // request is passed and used here only for type narrowing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _request?: { method: string; params: any },
): _request is BIP122_REQUESTS {
  return chain.startsWith("bip122");
}

export function isRippleChain(
  chain: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _request?: { method: string; params: any },
): _request is RIPPLE_REQUESTS {
  return chain.startsWith("xrpl:0");
}

export function isSolanaChain(
  chain: string,
  // request is passed and used here only for type narrowing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _request?: { method: string; params: any },
): _request is SOLANA_REQUESTS {
  return chain.includes("solana");
}

/**
 * Formats url to to remove protocol
 */
export function formatUrl(url: string) {
  return url.split("//")[1] ?? url;
}

export const getTicker = (chain: string) => SUPPORTED_NETWORK[chain].ticker;
export const getColor = (chain: string) => SUPPORTED_NETWORK[chain]?.color;
export const getDisplayName = (chain: string) =>
  SUPPORTED_NETWORK[chain]?.displayName ?? chain;
export const getNamespace = (chain: string) =>
  SUPPORTED_NETWORK[chain]?.namespace ?? chain;

export const getCurrencyByChainId = (chainId: string) => {
  const elem = Object.entries(SUPPORTED_NETWORK).find(([, network]) => {
    return network.namespace === chainId;
  });
  if (elem?.[0] === "solana (legacy)") return "solana";
  return elem?.[0] ?? chainId;
};

/**
 * Generic helper factory to build feature support checkers based on minimum wallet versions.
 * Returns a predicate that validates whether the provided walletInfo satisfies any of the
 * required minimum versions (keyed by wallet name) using semver comparison.
 */
function createSupportChecker(minVersions: Record<string, string>) {
  return (walletInfo: WalletInfo["result"]): boolean => {
    const {
      wallet: { name, version },
    } = walletInfo;

    if (!version) return false;

    const minVersion = minVersions[name];
    if (!minVersion) return false;

    try {
      return semver.gte(version, minVersion);
    } catch (error) {
      console.warn(`Invalid version format: ${version}`, error);
      return false;
    }
  };
}

/** Minimum versions of Ledger Live that support Solana */
const SOLANA_MIN_VERSIONS: Record<string, string> = {
  "ledger-live-desktop": "2.126.0",
  "ledger-live-mobile": "3.90.0",
};

/** Check if Solana support should be enabled based on wallet version */
export const isSolanaSupportEnabled = createSupportChecker(SOLANA_MIN_VERSIONS);

/** Check if XRPL support should be enabled based on wallet capabilities */
export const isXRPLSupportEnabled = (walletCapabilities: string[]): boolean => {
  return walletCapabilities.includes("transaction.signRaw");
};

/** Check if PSBT support should be enabled based on wallet capabilities */
export const isPSBTSupportEnabled = (walletCapabilities: string[]): boolean => {
  return walletCapabilities.includes("bitcoin.signPsbt");
};

export const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return String(error);
};
