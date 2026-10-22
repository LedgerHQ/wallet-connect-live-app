import { BIP122_REQUESTS } from "@/data/methods/BIP122.methods";
import { COSMOS_REQUESTS } from "@/data/methods/Cosmos.methods";
import { EIP155_REQUESTS } from "@/data/methods/EIP155Data.methods";
import { RIPPLE_REQUESTS } from "@/data/methods/Ripple.methods";
import { SOLANA_REQUESTS } from "@/data/methods/Solana.methods";
import { TEZOS_REQUESTS } from "@/data/methods/Tezos.methods";
import { WALLET_REQUESTS } from "@/data/methods/Wallet.methods";
import {
  COSMOS_CHAINS,
  SUPPORTED_NETWORK,
  TEZOS_CHAINS,
} from "@/data/network.config";
import type { WalletInfo } from "@ledgerhq/wallet-api-client";
import type { Verify } from "@walletconnect/types";
import semver from "semver";

const TEZOS_NAMESPACES = new Set(
  Object.values(TEZOS_CHAINS).map((network) => network.namespace),
);

const COSMOS_NAMESPACES = new Set(
  Object.values(COSMOS_CHAINS).map((network) => network.namespace),
);

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

export function isTezosChain(
  chain: string,
  // request is passed and used here only for type narrowing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _request?: { method: string; params: any },
): _request is TEZOS_REQUESTS {
  // Exact match only: an unregistered `tezos:*` (e.g. ghostnet) must not reach the mainnet handler.
  return TEZOS_NAMESPACES.has(chain);
}

export function isCosmosChain(
  chain: string,
  // request is passed and used here only for type narrowing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _request?: { method: string; params: any },
): _request is COSMOS_REQUESTS {
  // Exact match only: an unregistered `cosmos:*` (e.g. osmosis) must not reach the babylon handler.
  return COSMOS_NAMESPACES.has(chain);
}

/**
 * Formats url to to remove protocol
 */
export function formatUrl(url: string) {
  return url.split("//")[1] ?? url;
}

const FORBIDDEN_REDIRECT_PROTOCOLS = new Set([
  // Never needed to go back to a dApp, and could trigger Ledger Wallet deeplinks
  "ledgerwallet:",
  "ledgerlive:",
  // Opens a WalletConnect pairing, handled by Ledger Wallet on Android
  "wc:",
  // Can run script or read local content when passed to window.open
  "javascript:",
  "data:",
  "vbscript:",
  "file:",
  "blob:",
]);

// Universal links opening Ledger Wallet on iOS (associated domains)
const FORBIDDEN_REDIRECT_HOSTS = new Set([
  "ledger.go.link",
  "ledger-debug.go.link",
  "ledger-staging.go.link",
  "r354.adj.st",
  "a4wc.adj.st",
  "fvsc.adj.st",
]);

const WEB_PROTOCOLS = new Set(["http:", "https:"]);

function parseRedirectUrl(candidate?: string) {
  if (!candidate) return undefined;
  try {
    return new URL(candidate);
  } catch {
    return undefined;
  }
}

function isAllowedRedirectUrl(url: URL, verifiedOrigin?: string) {
  if (
    FORBIDDEN_REDIRECT_PROTOCOLS.has(url.protocol) ||
    FORBIDDEN_REDIRECT_HOSTS.has(url.hostname)
  ) {
    return false;
  }
  // A web url can be checked against the origin verified by WalletConnect Verify
  if (WEB_PROTOCOLS.has(url.protocol)) {
    return url.origin === verifiedOrigin;
  }
  // A native app can't be verified, so it only goes through the denylists
  return true;
}

function getVerifiedOrigin(verifyContext?: Verify.Context) {
  const verified = verifyContext?.verified;
  if (verified?.validation !== "VALID" || verified.isScam) return undefined;
  try {
    return new URL(verified.origin).origin;
  } catch {
    return undefined;
  }
}

/**
 * Returns the first valid and allowed redirect url provided by the dApp metadata
 * (native first, then universal), or undefined if none is safe to open
 *
 * A custom scheme url can't be checked against an origin, WalletConnect has no
 * way to verify a native app, so it only goes through the denylists. A web url,
 * whether given as native or universal, must also match the origin verified by
 * WalletConnect Verify, otherwise a dApp could send the user to any website in
 * the name of Ledger.
 */
export function getSafeRedirectUrl(
  redirect?: {
    native?: string;
    universal?: string;
  },
  verifyContext?: Verify.Context,
): string | undefined {
  const verifiedOrigin = getVerifiedOrigin(verifyContext);
  for (const candidate of [redirect?.native, redirect?.universal]) {
    const url = parseRedirectUrl(candidate);
    if (url && isAllowedRedirectUrl(url, verifiedOrigin)) return url.href;
  }
  return undefined;
}

/**
 * Opens the dApp redirect url without giving it access to the live app,
 * neither through `window.opener` nor through the referrer
 */
export function openRedirectUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
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
  if (elem?.[0] === "tezos (taquito)") return "tezos";
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

/**
 * Check if Cosmos (Babylon) support should be enabled based on wallet capabilities.
 * The cosmos handler calls `transaction.signRaw` (cosmos_signAmino) and
 * `account.getPublicKey` (cosmos_getAccounts), so the host must advertise both.
 *
 * KNOWN, ACCEPTED FALSE POSITIVE — do not "fix" by removing the check:
 * `walletCapabilities` (from `wallet.capabilities()`) is a build-global list of registered
 * wallet-api methods, NOT a per-family signal. Both `transaction.signRaw` and
 * `account.getPublicKey` are advertised generically by Ledger Live for other families that
 * already use them, so this returns true on any LL build that advertises them but has not wired
 * the cosmos resolvers (cosmos `signRawOperation` + the `cosmos` entry in
 * `ACCOUNT_PUBLIC_KEY_RESOLVERS`). On such a build Babylon is offered but requests fail
 * (`getPublicKey` throws "not implemented"): `cosmos_getAccounts` skips the unusable accounts
 * and accepts with an empty list, while `cosmos_signAmino` rethrows and the dispatch catch
 * answers the dApp with a JSON-RPC error (`txDeclined`) — no crash, but a broken connect UX.
 * A per-family capability (e.g. `cosmos.signRaw`) would be needed to close the window entirely.
 * (Deliberately chosen over the previous min-LL-version gate for LIVE-27227.)
 */
export const isCosmosSupportEnabled = (walletCapabilities: string[]): boolean => {
  return (
    walletCapabilities.includes("transaction.signRaw") &&
    walletCapabilities.includes("account.getPublicKey")
  );
};

/** Check if XRPL support should be enabled based on wallet capabilities */
export const isXRPLSupportEnabled = (walletCapabilities: string[]): boolean => {
  return walletCapabilities.includes("transaction.signRaw");
};

/** Check if Tezos support should be enabled based on wallet capabilities */
export const isTezosSupportEnabled = (walletCapabilities: string[]): boolean => {
  return (
    walletCapabilities.includes("transaction.signRaw") &&
    walletCapabilities.includes("message.sign") &&
    walletCapabilities.includes("account.getPublicKey")
  );
};

/** Check if PSBT support should be enabled based on wallet capabilities */
export const isPSBTSupportEnabled = (walletCapabilities: string[]): boolean => {
  return walletCapabilities.includes("bitcoin.signPsbt");
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    try {
      return JSON.stringify(error);
    } catch {
      return "Could not stringify error";
    }
  }
  return String(error);
};
