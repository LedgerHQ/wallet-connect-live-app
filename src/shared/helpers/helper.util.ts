import { COSMOS_MAINNET_CHAINS, TCosmosChain } from '@/data/COSMOSData'
import { EIP155_CHAINS, TEIP155Chain } from '@/data/EIP155Data'
import { ELROND_CHAINS, TElrondChain } from '@/data/ElrondData'
import { NEAR_TEST_CHAINS, TNearChain } from '@/data/NEARData'
import { SOLANA_CHAINS, TSolanaChain } from '@/data/SolanaData'

/**
 * Truncates string (in the middle) via given lenght value
 */
export function truncate(value: string, length: number) {
	if (value?.length <= length) {
		return value
	}

	const separator = '...'
	const stringLength = length - separator.length
	const frontLength = Math.ceil(stringLength / 2)
	const backLength = Math.floor(stringLength / 2)

	return (
		value.substring(0, frontLength) +
		separator +
		value.substring(value.length - backLength)
	)
}

/**
 * Get our address from params checking if params string contains one
 * of our wallet addresses
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getWalletAddressFromParams(addresses: string[], params: any) {
	const paramsString = JSON.stringify(params)
	let address = ''

	addresses.forEach((addr) => {
		if (paramsString.toLowerCase().includes(addr.toLowerCase())) {
			address = addr
		}
	})

	return address
}

/**
 * Check if chain is part of EIP155 standard
 */
export function isEIP155Chain(chain: string) {
	return chain.includes('eip155')
}

/**
 * Check if chain is part of COSMOS standard
 */
export function isCosmosChain(chain: string) {
	return chain.includes('cosmos')
}

/**
 * Check if chain is part of SOLANA standard
 */
export function isSolanaChain(chain: string) {
	return chain.includes('solana')
}

/**
 * Check if chain is part of POLKADOT standard
 */
export function isPolkadotChain(chain: string) {
	return chain.includes('polkadot')
}

/**
 * Check if chain is part of NEAR standard
 */
export function isNearChain(chain: string) {
	return chain.includes('near')
}

/**
 * Check if chain is part of ELROND standard
 */
export function isElrondChain(chain: string) {
	return chain.includes('elrond')
}

/**
 * Formats chainId to its name
 */
export function formatChainName(chainId: string) {
	return (
		EIP155_CHAINS[chainId as TEIP155Chain]?.name ??
		COSMOS_MAINNET_CHAINS[chainId as TCosmosChain]?.name ??
		SOLANA_CHAINS[chainId as TSolanaChain]?.name ??
		NEAR_TEST_CHAINS[chainId as TNearChain]?.name ??
		ELROND_CHAINS[chainId as TElrondChain]?.name ??
		chainId
	)
}

/**
 * Formats url to to remove protocol
 */
export function formatUrl(url: string) {
	return url.split('//')[1]
}

/**
 * Formats chainId to its name
 */
export function getTicker(chain: string) {
	switch (chain) {
		case 'ethereum':
		default:
			return 'ETH'
		case 'polygon':
			return 'MATIC'
		case 'bsc':
			return 'BNB'
		case 'arbitrum':
			return 'ARB'
		case 'optimism':
			return 'OP'
		case 'ethereum_goerli':
			return 'GETH'
		case 'optimism_goerli':
			return 'OP'
	}
}

export const getNamespace = (chain: string) => {
	switch (chain) {
		case 'ethereum':
		default:
			return 'eip155:1'
		case 'polygon':
			return 'eip155:137'
		case 'bsc':
			return 'eip155:56'
		case 'optimism':
			return 'eip155:10'
		case 'arbitrum':
			return 'eip155:42161'
		case 'ethereum_goerli':
			return 'eip155:5'
		case 'optimism_goerli':
			return 'eip155:420'
	}
}

export const getCurrencyByChainId = (chainId: string) => {
	switch (chainId) {
		case 'eip155:1':
		default:
			return 'ethereum'
		case 'eip155:137':
			return 'polygon'
		case 'eip155:56':
			return 'bsc'
		case 'eip155:10':
			return 'optimism'
		case 'eip155:42161':
			return 'arbitrum'
		case 'eip155:5':
			return 'ethereum_goerli'
		case 'eip155:420':
			return 'optimism_goerli'
	}
}
