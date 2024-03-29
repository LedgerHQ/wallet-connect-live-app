/**
 * @desc Refference list of eip155 chains
 * @url https://chainlist.org
 */

import { Network } from "./types";

const EIP155_CHAINS: Record<string, Network> = {
  ethereum: {
    chainId: 1,
    namespace: "eip155:1",
    ticker: "ETH",
    displayName: "Ethereum",
    color: "#0ebdcd",
  },
  bsc: {
    chainId: 56,
    namespace: "eip155:56",
    ticker: "BNB",
    displayName: "Binance Smart Chain",
    color: "#F0B90A",
  },
  polygon: {
    chainId: 137,
    namespace: "eip155:137",
    ticker: "MATIC",
    displayName: "Polygon",
    color: "#6d29de",
  },
  optimism: {
    chainId: 10,
    namespace: "eip155:10",
    ticker: "ETH",
    displayName: "Optimism",
    color: "#FF0421",
  },
  arbitrum: {
    chainId: 42161,
    namespace: "eip155:42161",
    ticker: "ETH",
    displayName: "Arbitrum",
    color: "#28a0f0",
  },
  avalanche_c_chain: {
    chainId: 43114,
    namespace: "eip155:43114",
    ticker: "AVAX",
    displayName: "Avalanche C-Chain",
    color: "#E84142",
  },
  base: {
    chainId: 8453,
    namespace: "eip155:8453",
    ticker: "ETH",
    displayName: "Base",
    color: "#1755FE",
  },
};

const EIP155_GOERLI_CHAINS: Record<string, Network> = {
  ethereum_goerli: {
    chainId: 5,
    namespace: "eip155:5",
    ticker: "ETH",
    displayName: "Ethereum Goerli",
    color: "#00ff00",
  },
  optimism_goerli: {
    chainId: 420,
    namespace: "eip155:420",
    ticker: "ETH",
    displayName: "Optimism Goerli",
    color: "#00ff00",
  },
  base_goerli: {
    chainId: 84531,
    namespace: "eip155:84531",
    ticker: "ETH",
    displayName: "Base Goerli",
    color: "#FF0052",
  },
};

export const SUPPORTED_NETWORK: Record<string, Network> = {
  ...EIP155_CHAINS,
  ...EIP155_GOERLI_CHAINS,
};

export enum SupportedNamespace {
  EIP155 = "eip155",
}
