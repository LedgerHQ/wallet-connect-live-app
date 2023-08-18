import React, { useEffect, useRef, useState } from "react"
import {
  Account,
  WalletInfo,
  WindowMessageTransport,
  WalletAPIClient,
} from "@ledgerhq/wallet-api-client"

type WalletApiClientProviderProps = {
  children: (
    accounts: Account[],
    userId: string,
    walletInfo: WalletInfo["result"],
  ) => React.ReactElement
}

export function WalletApiClientProvider({ children }: WalletApiClientProviderProps) {
  const walletApiClientRef = useRef<WalletAPIClient | null>(null)

  const [accounts, setAccounts] = useState<Account[] | undefined>(undefined)
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [walletInfo, setWalletInfo] = useState<WalletInfo["result"] | undefined>(undefined)

  useEffect(() => {
    const transport = new WindowMessageTransport()
    transport.connect()
    const walletApiClient = new WalletAPIClient(transport)
    walletApiClient.account.list().then((allAccounts) => {
      setAccounts(allAccounts)
    })

    walletApiClient.wallet.userId().then((userId) => setUserId(userId))

    walletApiClient.wallet.info().then((info) => setWalletInfo(info))

    walletApiClientRef.current = walletApiClient

    return () => {
      transport.disconnect()
    }
  }, [])

  if (walletApiClientRef.current && accounts && userId && walletInfo) {
    return children(accounts, userId, walletInfo)
  }
  return null
}
