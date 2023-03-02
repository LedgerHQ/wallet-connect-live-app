import { NetworkConfig } from '@/types/types'
import { Account } from '@ledgerhq/live-app-sdk'
import WalletConnectClient from '@walletconnect/client'
import WalletConnect from '@walletconnect/client'

export let wc: WalletConnect

export async function restoreClient(
	session: any,
	networks: NetworkConfig[],
	selectedAccount: Account | undefined,
): Promise<void> {
	if (wc && wc.session) {
		console.log('walletConnectClient IF 2', wc.session)
		await wc.killSession()
	}

	wc = new WalletConnectClient({ session })

	if (selectedAccount) {
		const networkConfig = networks.find(
			(networkConfig) =>
				networkConfig.currency === selectedAccount?.currency,
		)

		if (networkConfig) {
			wc.updateSession({
				chainId: networkConfig.chainId,
				accounts: [selectedAccount.address],
			})
		}
	}

	setWalletConnectClient(wc)
	console.log('restore', wc)
}

export async function createClient(uri: string): Promise<void> {
	if (wc && wc.session) {
		console.log('walletConnectClient IF', wc.session)
		await wc.killSession()
	}

	wc = new WalletConnectClient({ uri })
	setWalletConnectClient(wc)

	console.log('createClient', wc)
}
