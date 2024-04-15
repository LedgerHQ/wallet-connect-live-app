import { EIP155_REQUESTS } from "@/data/methods/EIP155Data.methods";
import { MULTIVERSX_REQUESTS } from "@/data/methods/MultiversX.methods";
import { SUPPORTED_NETWORK } from "@/data/network.config";

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
  _request?: { method: string; params: any }
): _request is EIP155_REQUESTS {
  return chain.includes("eip155");
}

export function isMultiversXChain(
  chain: string,
  // request is passed and used here only for type narrowing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _request?: { method: string; params: any }
): _request is MULTIVERSX_REQUESTS {
  return chain.includes("mvx");
}

/**
 * Formats url to to remove protocol
 */
export function formatUrl(url: string) {
  return url.split("//")[1] ?? url;
}

export const getNetwork = (chain: string) => SUPPORTED_NETWORK[chain];

export const getTicker = (chain: string) => SUPPORTED_NETWORK[chain].ticker;
export const getColor = (chain: string) => SUPPORTED_NETWORK[chain]?.color;
export const getDisplayName = (chain: string) =>
  SUPPORTED_NETWORK[chain]?.displayName ?? chain;
export const getNamespace = (chain: string) =>
  SUPPORTED_NETWORK[chain]?.namespace ?? chain;

export const getCurrencyByChainId = (chainId: string) => {
  if (chainId === 'mvx:1') {
    return 'elrond';
  }
  const elem = Object.entries(SUPPORTED_NETWORK).find(
    ([, network]) => network.namespace === chainId.toLowerCase()
  );
  return elem?.[0] ?? chainId;
};
