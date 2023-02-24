export type Config = {
	currencies: CurrencyConfig[]
}

export type CurrencyConfig = {
	id: string
	chainId: number
}

export const config = {
	currencies: [
		{
			id: 'ethereum',
			chainId: 1,
		},
		{
			id: 'polygon',
			chainId: 137,
		},
		{
			id: 'bsc',
			chainId: 56,
		},
	],
}
