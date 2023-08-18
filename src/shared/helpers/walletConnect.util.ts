/* eslint-disable @typescript-eslint/no-explicit-any */
import { Core } from '@walletconnect/core'
import type { ICore } from '@walletconnect/types'
import type { IWeb3Wallet } from '@walletconnect/web3wallet'
import { Web3Wallet } from '@walletconnect/web3wallet'

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

async function pair(uri: string) {
  return await core.pairing.pair({ uri })
}

export async function startProposal(uri: string) {
  try {
    const url = new URL(uri)

    switch (url.protocol) {
      // handle usual wallet connect URIs
      case 'wc:': {
        await pair(uri)
        break
      }

      // handle Ledger Live specific URIs
      case 'ledgerlive:': {
        const uriParam = url.searchParams.get('uri')

        if (url.pathname === '//wc' && uriParam) {
          await startProposal(uriParam)
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
