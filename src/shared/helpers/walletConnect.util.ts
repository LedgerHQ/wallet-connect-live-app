/* eslint-disable @typescript-eslint/no-explicit-any */
import { Core } from '@walletconnect/core'
import { ICore } from '@walletconnect/types'
import { Web3Wallet, IWeb3Wallet } from '@walletconnect/web3wallet'

export let web3wallet: IWeb3Wallet
export let core: ICore

export async function createWeb3Wallet(relayerRegionURL: string) {
	core = new Core({
		logger: 'debug',
		projectId: '715218e8e4d6b4ff2d859ff5b46f8771',
		relayUrl: relayerRegionURL ?? 'wss://relay.walletconnect.com',
	})

	web3wallet = await Web3Wallet.init({
		core,
		metadata: {
			name: 'Ledger Wallet',
			description: 'Ledger Live Wallet with WalletConnect',
			url: 'https://walletconnect.com/',
			icons: ['https://avatars.githubusercontent.com/u/37784886'],
		},
	})
}

async function pair(uri: string) {
	return await core.pairing.pair({ uri })
}

export const isV1 = (uri: string) => uri?.includes('@1?')

export async function startProposal(
	uri: string,
	createClient: (params: {
		uri?: string | undefined
		session?: any
	}) => Promise<void>,
) {
	try {
		const url = new URL(uri)

		switch (url.protocol) {
			// handle usual wallet connect URIs
			case 'wc:': {
				if (isV1(uri)) {
					createClient({ uri: url.toString() })
				} else {
					await pair(uri)
				}
				break
			}

			// handle Ledger Live specific URIs
			case 'ledgerlive:': {
				const uriParam = url.searchParams.get('uri')

				if (url.pathname === '//wc' && uriParam) {
					await startProposal(uriParam, createClient)
				}
				break
			}
		}
	} catch (error) {
		// bad urls are just ignored
		if (error instanceof TypeError) {
			return
		}
		throw error
	}
}
