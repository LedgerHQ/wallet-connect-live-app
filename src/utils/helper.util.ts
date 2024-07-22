import { BIP122_REQUESTS } from "@/data/methods/BIP122.methods";
import { EIP155_REQUESTS } from "@/data/methods/EIP155Data.methods";
import { MULTIVERSX_REQUESTS } from "@/data/methods/MultiversX.methods";
import { RIPPLE_REQUESTS } from "@/data/methods/Ripple.methods";
import { SUPPORTED_NETWORK } from "@/data/network.config";
import { add0x, bytesToHex, remove0x } from '@metamask/utils';

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
 * Check if chain is part of EIP155 standard
 */
export function isEIP155Chain(
  chain: string,
  // request is passed and used here only for type narrowing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _request?: { method: string; params: any },
): _request is EIP155_REQUESTS {
  return chain.includes("eip155");
}

export function isMultiversXChain(
  chain: string,
  // request is passed and used here only for type narrowing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _request?: { method: string; params: any },
): _request is MULTIVERSX_REQUESTS {
  return chain.includes("mvx");
}

export function isBIP122Chain(
  chain: string,
  // request is passed and used here only for type narrowing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _request?: { method: string; params: any },
): _request is BIP122_REQUESTS {
  return chain.includes("bip122");
}

export function isRippleChain(
  chain: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _request?: { method: string; params: any }
): _request is RIPPLE_REQUESTS {
  return chain.includes("xrpl:0");
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
  const elem = Object.entries(SUPPORTED_NETWORK).find(
    ([, network]) => network.namespace === chainId.toLowerCase(),
  );
  return elem?.[0] ?? chainId;
};

export const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return String(error);
};

const hexRe = /^[0-9A-Fa-f]+$/gu;
export function normalizeMessageData(data: string) {
  try {
    const stripped = remove0x(data);
    if (stripped !== data && isValidUTF8(stripped) && stripped.match(hexRe) ) {
      return Buffer.from(stripped, 'hex')
    }
  } catch (e) {
    // do nothing
  }
  return Buffer.from(data)

}

export function isValidUTF8(message: string) {
  try {
    const stripped = remove0x(message);
    const bytes = stripped.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16));
    if (!bytes) throw new Error('Invalid hex string');

    const decoder = new TextDecoder('utf-8', { fatal: true });
    decoder.decode(new Uint8Array(bytes)); 
    return true;
  } catch {
    return false;
  }
}
