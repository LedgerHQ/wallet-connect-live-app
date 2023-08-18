import type { Account, WalletInfo } from '@ledgerhq/wallet-api-client'
import { useEffect, useState } from 'react'

import useAnalytics from '@/hooks/common/useAnalytics'
import { accountSelector, useAccountsStore } from '@/storage/accounts.store'
import { sessionSelector, useSessionsStore } from '@/storage/sessions.store'
import type { InputMode } from '@/types/types'

import Home from './Home'

export type WalletConnectProps = {
  initialMode?: InputMode
  initialURI?: string
  accounts: Account[]
  userId: string
  walletInfo: WalletInfo['result']
}

export default function WalletConnect({
  initialURI,
  initialMode,
  accounts,
  userId,
  walletInfo,

  ...rest
}: WalletConnectProps) {
  const [uri, setUri] = useState<string | undefined>(initialURI)

  const addAccounts = useAccountsStore(accountSelector.addAccounts)
  const clearAccounts = useAccountsStore(accountSelector.clearAccounts)
  const setLastSessionVisited = useSessionsStore(
    sessionSelector.setLastSessionVisited,
  )
  const analytics = useAnalytics()

  useEffect(() => {
    clearAccounts()
    setLastSessionVisited(null)
    if (accounts.length > 0) {
      addAccounts(accounts)
    }
  }, [accounts, addAccounts, clearAccounts, setLastSessionVisited])

  useEffect(() => {
    clearAccounts()
    addAccounts(accounts)
  }, [accounts, addAccounts, clearAccounts])

  useEffect(() => {
    analytics.start(userId, walletInfo)
  }, [analytics, userId, walletInfo])

  return (
    <Home
      initialMode={initialMode}
      setUri={setUri}
      accounts={accounts}
      initialURI={uri}
      {...rest}
    />
  )
}
