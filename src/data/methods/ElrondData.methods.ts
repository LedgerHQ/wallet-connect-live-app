/**
 * Types
 */
export type TElrondChain = keyof typeof ELROND_MAINNET_CHAINS

/**
 * Chains
 */
export const ELROND_MAINNET_CHAINS = {
	'elrond:1': {
		chainId: '1',
		name: 'Elrond',
	},
}

export const ELROND_TEST_CHAINS = {
	'elrond:D': {
		chainId: 'D',
		name: 'Elrond Devnet',
	},
}

export const ELROND_CHAINS = { ...ELROND_MAINNET_CHAINS, ...ELROND_TEST_CHAINS }

/**
 * Methods
 */
export const ELROND_SIGNING_METHODS = {
	ELROND_SIGN_TRANSACTION: 'erd_signTransaction',
	ELROND_SIGN_TRANSACTIONS: 'erd_signTransactions',
	ELROND_SIGN_MESSAGE: 'erd_signMessage',
	ELROND_SIGN_LOGIN_TOKEN: 'erd_signLoginToken',
}
