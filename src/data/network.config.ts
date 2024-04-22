/**
 * @desc Refference list of eip155 chains
 * @url https://chainlist.org
 */

import { Network } from "./types";

export const EIP155_CHAINS_MAINNET: Record<string, Network> = {
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


export const EIP155_SEPOLIA_CHAINS: Record<string, Network> = {
  ethereum_sepolia: {
    chainId: 11155111,
    namespace: "eip155:11155111",
    ticker: "ETH",
    displayName: "Ethereum Sepolia",
    color: "#00ff00",
  },
  arbitrum_sepolia: {
    chainId: 421614,
    namespace: "eip155:421614",
    ticker: "ETH",
    displayName: "Arbitrum Sepolia",
    color: "#28a0f0",
  },
  optimism_sepolia: {
    chainId: 11155420,
    namespace: "eip155:11155420",
    ticker: "ETH",
    displayName: "Optimism Sepolia",
    color: "#00ff00",
  },
  base_sepolia: {
    chainId: 84531,
    namespace: "eip155:84531",
    ticker: "ETH",
    displayName: "Base Sepolia",
    color: "#FF0052",
  },
};

export const EIP155_HOLESKY_CHAINS: Record<string, Network> = {
  ethereum_holesky: {
    chainId: 17000,
    namespace: "eip155:17000",
    ticker: "ETH",
    displayName: "Ethereum Holesky",
    color: "#00ff00",
  }
}

export const MULTIVERS_X_CHAINS: Record<string, Network> = {
  elrond: {
    chainId: "1",
    namespace: "mvx:1",
    ticker: "EGLD",
    displayName: "MultiversX",
    color: "#23F7DD",
  },
};


export const EIP155_CHAINS = {
  ...EIP155_CHAINS_MAINNET,
  ...EIP155_SEPOLIA_CHAINS,
  ...EIP155_HOLESKY_CHAINS,
}

export const SUPPORTED_NETWORK: Record<string, Network> = {
  ...EIP155_CHAINS,
  ...MULTIVERS_X_CHAINS,
};

export const SUPPORTED_NETWORK_NAMES: string[] = Object.values(SUPPORTED_NETWORK).map((network: Network) => network.displayName);

export enum SupportedNamespace {
  EIP155 = "eip155",
  MVX = "mvx",
}
