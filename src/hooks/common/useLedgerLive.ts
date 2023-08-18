import {
  WalletAPIClient,
  WindowMessageTransport,
} from '@ledgerhq/wallet-api-client'

export function useLedgerLive() {
  let transport: WindowMessageTransport

  const initWalletApiClient = () => {
    transport = new WindowMessageTransport()
    transport.connect()
    const walletApiClient = new WalletAPIClient(transport)
    return walletApiClient
  }
  const closeTransport = () => transport.disconnect()

  return {
    initWalletApiClient,
    closeTransport,
  }
}
