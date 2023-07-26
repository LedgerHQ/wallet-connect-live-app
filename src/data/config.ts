export type Network = {
	chainId: number
	namespace: string
	ticker: string
	displayName: string
}

const EIP155_CHAINS = {
	ethereum: {
		chainId: 1,
		namespace: 'eip155:1',
		ticker: 'ETH',
		displayName: 'Ethereum',
	},
	bsc: {
		chainId: 56,
		namespace: 'eip155:56',
		ticker: 'BNB',
		displayName: 'Binance Smart Chain',
	},
	polygon: {
		chainId: 137,
		namespace: 'eip155:137',
		ticker: 'MATIC',
		displayName: 'Polygon',
	},
	optimism: {
		chainId: 10,
		namespace: 'eip155:10',
		ticker: 'OP',
		displayName: 'Optimism',
	},
	arbitrum: {
		chainId: 42161,
		namespace: 'eip155:42161',
		ticker: 'ARB',
		displayName: 'Arbitrum',
	},
	ethereum_goerli: {
		chainId: 5,
		namespace: 'eip155:5',
		ticker: 'GETH',
		displayName: 'Ethereum Goerli',
	},
	optimism_goerli: {
		chainId: 420,
		namespace: 'eip155:420',
		ticker: 'OP',
		displayName: 'Optimism Goerli',
	},
}

export const SUPPORTED_NETWORK: Record<string, Network> = {
	...EIP155_CHAINS,
}
