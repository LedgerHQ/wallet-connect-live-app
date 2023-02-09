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
    }
  })
}

export async function pair(params: { uri: string }) {
  return await core.pairing.pair({ uri: params.uri })
}
