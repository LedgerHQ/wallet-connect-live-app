/**
 * @desc Refference list of eip155 chains
 * @url https://chainlist.org
 */

import { Chains } from './types'

/**
 * Types
 */
export type TEIP155Chain = keyof typeof EIP155_CHAINS

/**
 * Chains
 */

// TO UPDATE WHEN SUPPORTING NEW CHAIN
export const EIP155_MAINNET_CHAINS: Chains = {
	'eip155:1': {
		chainId: 1,
		name: 'Ethereum',
	},
	'eip155:43114': {
		chainId: 43114,
		name: 'Avalanche C-Chain',
	},
	'eip155:137': {
		chainId: 137,
		name: 'Polygon',
	},
	'eip155:10': {
		chainId: 10,
		name: 'Optimism',
	},
	'eip155:42161': {
		chainId: 42161,
		name: 'Arbitrum',
	},
}

export const EIP155_TEST_CHAINS: Chains = {
	'eip155:5': {
		chainId: 5,
		name: 'ethereum_goerli',
	},
	'eip155:43113': {
		chainId: 43113,
		name: 'Avalanche Fuji',
	},
	'eip155:80001': {
		chainId: 80001,
		name: 'Polygon Mumbai',
	},
	'eip155:420': {
		chainId: 420,
		name: 'Optimism Goerli',
	},
	'eip155:56': {
		chainId: 56,
		name: 'bsc',
		logo: '/chain-logos/eip155-1.png',
		rgb: '99, 125, 234',
		rpc: 'https://rpc.ankr.com/bsc',
	},
}

export const EIP155_CHAINS = { ...EIP155_MAINNET_CHAINS, ...EIP155_TEST_CHAINS }

/**
 * Methods
 */
export const EIP155_SIGNING_METHODS = {
	PERSONAL_SIGN: 'personal_sign',
	ETH_SIGN: 'eth_sign',
	ETH_SIGN_TRANSACTION: 'eth_signTransaction',
	ETH_SIGN_TYPED_DATA: 'eth_signTypedData',
	ETH_SIGN_TYPED_DATA_V3: 'eth_signTypedData_v3',
	ETH_SIGN_TYPED_DATA_V4: 'eth_signTypedData_v4',
	ETH_SEND_TRANSACTION: 'eth_sendTransaction',
	SWITCH_CHAIN: 'wallet_switchEthereumChain',
}
