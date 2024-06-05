/**
 * @desc Refference list of eip155 chains
 * @url https://chainlist.org
 */

import { Network } from "./types";

function getNetworkById(chains: Record<string, Network>) {
  return Object.entries(chains).reduce<Record<Network["chainId"], string>>(
    (acc, [key, network]) => {
      acc[network.chainId] = key;
      return acc;
    },
    {},
  );
}

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
  rsk: {
    chainId: 30,
    namespace: "eip155:30",
    ticker: "RBTC",
    displayName: "Rootstock",
    color: "#ff9100",
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
  },
};

export const MULTIVERS_X_CHAINS: Record<string, Network> = {
  elrond: {
    chainId: "1",
    namespace: "mvx:1",
    ticker: "EGLD",
    displayName: "MultiversX",
    color: "#23F7DD",
  },
};

export const MULTIVERS_X_NETWORK_BY_CHAIN_ID =
  getNetworkById(MULTIVERS_X_CHAINS);

export const BIP122_MAINNET_CHAINS: Record<string, Network> = {
  bitcoin: {
    chainId: "000000000019d6689c085ae165831e93",
    namespace: "bip122:000000000019d6689c085ae165831e93",
    displayName: "Bitcoin",
    ticker: "BTC",
    color: "#F7931A",
  },
  litecoin: {
    chainId: "12a765e31ffd4059bada1e25190f6e98",
    namespace: "bip122:12a765e31ffd4059bada1e25190f6e98",
    displayName: "Litecoin",
    ticker: "LTC",
    color: "#355DAF",
  },
  dogecoin: {
    chainId: "82bc68038f6034c0596b6e313729793a",
    namespace: "bip122:82bc68038f6034c0596b6e313729793a",
    displayName: "Dogecoin",
    ticker: "DOGE",
    color: "#65d196",
  },
};

export const BIP122_TEST_CHAINS: Record<string, Network> = {
  bitcoin_testnet: {
    chainId: "000000000933ea01ad0ee984209779ba",
    namespace: "bip122:000000000933ea01ad0ee984209779ba",
    displayName: "Bitcoin (Testnet)",
    ticker: "TBTC",
    color: "#F7931A",
  },
};

export const BIP122_CHAINS = {
  ...BIP122_MAINNET_CHAINS,
  ...BIP122_TEST_CHAINS,
};

export const BIP122_NETWORK_BY_CHAIN_ID = getNetworkById(BIP122_CHAINS);

export const RIPPLE_CHAINS: Record<string, Network> = {
  ripple: {
    chainId: "0",
    namespace: "xrpl:0",
    ticker: "XRP",
    displayName: "Ripple",
    color: "#23F7DD",
  },
};

export const RIPPLE_NETWORK_BY_CHAIN_ID = getNetworkById(RIPPLE_CHAINS);

export const SOLANA_CHAINS: Record<string, Network> = {
  // "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp": {
  solana: {
    chainId: "1",
    namespace: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    // ^ seem to only work for https://react-app.walletconnect.com/
    // see https://github.com/WalletConnect/web-examples/blob/a172c268d4f3505aa6c251a70ddd7bae5676414b/advanced/wallets/react-wallet-v2/src/data/SolanaData.ts#L11
    ticker: "SOL",
    displayName: "Solana",
    color: "#1EF0A6",
    decimals: 9,
  },
  // LEGACY, BUT SEEM WIDESPREAD IN ITS USAGE...
  "solana (legacy)": {
    chainId: "1",
    namespace: "solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ", // work with APPs (legacy)
    ticker: "SOL",
    displayName: "Solana",
    color: "#1EF0A6",
    decimals: 9,
  },
  // DISABLED UNTIL AVAILABLE IN LL
  /*
  "solana testnet": {
    chainId: "4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z",
    namespace: "solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z", // work with APPs (legacy)
    ticker: "SOL",
    displayName: "Solana testnet",
    color: "#1EF0A6",
    decimals: 9,
  },
  "solana devnet": {
    chainId: "EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
    namespace: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1", // work with APPs (legacy)
    ticker: "SOL",
    displayName: "Solana devnet",
    color: "#1EF0A6",
    decimals: 9,
  }
 */
};

export const SOLANA_NETWORK_BY_CHAIN_ID = getNetworkById(SOLANA_CHAINS);

export const EIP155_CHAINS = {
  ...EIP155_CHAINS_MAINNET,
  ...EIP155_SEPOLIA_CHAINS,
  ...EIP155_HOLESKY_CHAINS,
};

export const EIP155_NETWORK_BY_CHAIN_ID = getNetworkById(EIP155_CHAINS);

export const SUPPORTED_NETWORK: Record<string, Network> = {
  ...EIP155_CHAINS,
  ...MULTIVERS_X_CHAINS,
  ...BIP122_CHAINS,
  ...RIPPLE_CHAINS,
  ...SOLANA_CHAINS,
};

export const SUPPORTED_NETWORK_NAMES: string[] = Object.values(
  SUPPORTED_NETWORK,
).map((network: Network) => network.displayName);

export enum SupportedNamespace {
  BIP122 = "bip122",
  EIP155 = "eip155",
  MVX = "mvx",
  XRPL = "xrpl",
  SOLANA = "solana",
}
