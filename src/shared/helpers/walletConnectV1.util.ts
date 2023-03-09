/* eslint-disable @typescript-eslint/no-explicit-any */
import { NetworkConfig } from '@/types/types'
import { Account } from '@ledgerhq/wallet-api-client'
import WalletConnectClient from '@walletconnect/client'
import WalletConnect from '@walletconnect/client'

export let wc: WalletConnect

export async function restoreClient(
	session: any,
	networks: NetworkConfig[],
	selectedAccount: Account | undefined,
	setWalletConnectClient: (
		walletConnectClient?: WalletConnect | undefined,
	) => void,
	setSession: (session: any) => void,
): Promise<void> {
	if (wc && wc.session && wc.connected) {
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
	setSession(wc.session)
}

export async function createClient(
	uri: string,
	setWalletConnectClient: (
		walletConnectClient?: WalletConnect | undefined,
	) => void,
): Promise<void> {
	if (wc && wc.session && wc.connected) {
		await wc.killSession()
	}

	wc = new WalletConnectClient({ uri })
	setWalletConnectClient?.(wc)
}
