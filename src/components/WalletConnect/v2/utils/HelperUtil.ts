import { COSMOS_MAINNET_CHAINS, TCosmosChain } from '../data/COSMOSData'
import { EIP155_CHAINS, TEIP155Chain } from '../data/EIP155Data'
import { NEAR_TEST_CHAINS, TNearChain } from '../data/NEARData'
import { SOLANA_CHAINS, TSolanaChain } from '../data/SolanaData'
import { ELROND_CHAINS, TElrondChain } from '../data/ElrondData'

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
	}
}
