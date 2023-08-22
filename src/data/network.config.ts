/**
 * @desc Refference list of eip155 chains
 * @url https://chainlist.org
 */

import { Network } from "./types"

type ChainName =
  | "ethereum"
  | "bsc"
  | "polygon"
  | "optimism"
  | "arbitrum"
  | "avalanche_c_chain"
  | "ethereum_goerli"
  | "optimism_goerli"

const EIP155_CHAINS: Record<ChainName, Network> = {
  ethereum: {
    chainId: 1,
    namespace: "eip155:1",
    ticker: "ETH",
    displayName: "Ethereum",
  },
  bsc: {
    chainId: 56,
    namespace: "eip155:56",
    ticker: "BNB",
    displayName: "Binance Smart Chain",
  },
  polygon: {
    chainId: 137,
    namespace: "eip155:137",
    ticker: "MATIC",
    displayName: "Polygon",
  },
  optimism: {
    chainId: 10,
    namespace: "eip155:10",
    ticker: "OP",
    displayName: "Optimism",
  },
  arbitrum: {
    chainId: 42161,
    namespace: "eip155:42161",
    ticker: "ARB",
    displayName: "Arbitrum",
  },
  avalanche_c_chain: {
    chainId: 43114,
    namespace: "eip155:43114",
    ticker: "AVAX",
    displayName: "Avalanche C-Chain",
  },
  ethereum_goerli: {
    chainId: 5,
    namespace: "eip155:5",
    ticker: "GETH",
    displayName: "Ethereum Goerli",
  },
  optimism_goerli: {
    chainId: 420,
    namespace: "eip155:420",
    ticker: "OP",
    displayName: "Optimism Goerli",
  },
}

// const COSMOS_MAINNET_CHAINS = {
// 	cosmos: {
// 		chainId: 'cosmoshub-4',
// 		displayName: 'Cosmos Hub',
// 		namespace: 'cosmos:cosmoshub-4',
// 		ticker: 'ATOM',
// 	},
// }

export const SUPPORTED_NETWORK: Record<ChainName, Network> = {
  ...EIP155_CHAINS,
  // ...COSMOS_MAINNET_CHAINS,
}

export enum SupportedNamespace {
  EIP155 = "eip155",
  // cosmos = 'cosmos',
}
