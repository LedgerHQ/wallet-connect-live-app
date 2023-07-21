/* eslint-disable @typescript-eslint/no-explicit-any */
import { Core } from '@walletconnect/core'
import { ICore } from '@walletconnect/types'
import { Web3Wallet, IWeb3Wallet } from '@walletconnect/web3wallet'

export let web3wallet: IWeb3Wallet
export let core: ICore

export async function createWeb3Wallet(relayerRegionURL: string) {
	core = new Core({
		logger: 'debug',
		projectId: '7e793b3396bb2e7b840a29f309ecabcd',
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

async function pair(uri: string, captureError: (err: Error) => void) {
	return await core.pairing
		.pair({ uri })
		.catch((err: Error) => captureError(err))
}

export async function startProposal(
	uri: string,
	captureError: (err: Error) => void,
) {
	try {
		const url = new URL(uri)

		switch (url.protocol) {
			// handle usual wallet connect URIs
			case 'wc:': {
				await pair(uri, captureError)
				break
			}

			// handle Ledger Live specific URIs
			case 'ledgerlive:': {
				const uriParam = url.searchParams.get('uri')

				if (url.pathname === '//wc' && uriParam) {
					await startProposal(uriParam, captureError)
				}
				break
			}
		}
	} catch (error) {
		// bad urls are just ignored
		if (error instanceof TypeError) {
			return
		}
		throw new Error(String(error))
	}
}
