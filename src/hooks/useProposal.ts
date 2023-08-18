import { Proposal } from "@/types/types"
import { Account } from "@ledgerhq/wallet-api-client"
import { SessionTypes } from "@walletconnect/types"
import { useCallback, useState } from "react"
import { useNavigation } from "@/hooks/common/useNavigation"
import { sessionSelector, useSessionsStore } from "@/storage/sessions.store"
import { accountSelector, useAccountsStore } from "@/storage/accounts.store"

import { getCurrencyByChainId, getDisplayName, getNamespace } from "@/helpers/helper.util"
import { EIP155_SIGNING_METHODS } from "@/data/methods/EIP155Data.methods"
import { web3wallet } from "@/helpers/walletConnect.util"
import useAnalytics from "@/hooks/common/useAnalytics"
import { useLedgerLive } from "./common/useLedgerLive"
import { SUPPORTED_NAMESPACE, SUPPORTED_NETWORK } from "@/data/network.config"

type Props = {
  proposal: Proposal
}

type AccountsInChain = {
  chain: string
  isSupported: boolean
  isRequired: boolean
  accounts: Account[]
}

export function useProposal({ proposal }: Props) {
  const { navigate, routes, tabsIndexes, router } = useNavigation()

  const addSession = useSessionsStore(sessionSelector.addSession)
  const accounts = useAccountsStore(accountSelector.selectAccounts)
  const addAccount = useAccountsStore(accountSelector.addAccount)
  const analytics = useAnalytics()

  const { initWalletApiClient, closeTransport } = useLedgerLive()

  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])

  const proposer = proposal.params.proposer

  const handleClick = useCallback(
    (account: string) => {
      if (selectedAccounts.includes(account)) {
        setSelectedAccounts(selectedAccounts.filter((s) => s !== account))
      } else {
        setSelectedAccounts([...selectedAccounts, account])
      }
    },
    [selectedAccounts],
  )

  const handleClose = useCallback(() => {
    router.push(routes.home)
    analytics.track("button_clicked", {
      button: "Close",
      page: "Wallet Connect Error Unsupported Blockchains",
    })
  }, [])

  const getChains = (proposal: Proposal) => {
    const requiredNamespaces = Object.values(proposal.params.requiredNamespaces).map(
      (namespace) => ({ ...namespace, required: true }),
    )
    const optionalNamespaces = proposal.params.optionalNamespaces
      ? Object.values(proposal.params.optionalNamespaces)
      : []

    return [...requiredNamespaces, ...optionalNamespaces]
  }

  const formatAccountsByChain = (proposal: Proposal, accounts: Account[]) => {
    const families = getChains(proposal)

    const chains = families.map((f) => f.chains).reduce((value, acc) => acc.concat(value), [])

    const chainsDeduplicated = [...Array.from(new Set(chains))]

    const mappedChains = chainsDeduplicated.map((chain) => {
      const formatedChain = getCurrencyByChainId(chain)

      return {
        chain: formatedChain,
        displayName: getDisplayName(formatedChain),
        isSupported: Boolean(SUPPORTED_NETWORK[formatedChain] !== undefined),
        isRequired: families.some((family) => family.required && family.chains.includes(chain)),
        accounts: accounts.filter((acc) => acc.currency === formatedChain),
      }
    })

    return mappedChains
  }

  const hasChain = (chain: string, accountsByChain: AccountsInChain[]) =>
    accountsByChain.some((acc) => acc.chain === chain)

  const createChains = (accountsByChain: AccountsInChain[]) => {
    return Object.keys(SUPPORTED_NETWORK).map((network) => {
      const hasChainInAccount = hasChain(network, accountsByChain)
      if (hasChainInAccount) {
        return getNamespace(network)
      } else {
        return ""
      }
    })
  }
  const createNamespaces = (): Record<string, SessionTypes.BaseNamespace> => {
    const accountsByChain = formatAccountsByChain(proposal, accounts).filter(
      (a) => a.accounts.length > 0 && a.isSupported,
    )

    const accountsToSend = accountsByChain.reduce<string[]>(
      (accum, elem) =>
        accum.concat(
          elem.accounts
            .filter((acc) => selectedAccounts.includes(acc.id))
            .map((a) => `${getNamespace(a.currency)}:${a.address}`),
        ),
      [],
    )

    const methods = proposal.params.requiredNamespaces[SUPPORTED_NAMESPACE.eip155].methods.concat(
      Object.values(EIP155_SIGNING_METHODS),
    )

    return {
      eip155: {
        methods: [...new Set(methods)],
        chains: createChains(accountsByChain).filter((e) => e.length),
        events: proposal.params.requiredNamespaces[SUPPORTED_NAMESPACE.eip155].events,
        accounts: accountsToSend,
      },
      // For new namespace other than eip155 add new object here with same skeleton
    }
  }

  const approveSession = useCallback(async () => {
    web3wallet
      .approveSession({
        id: proposal.id,
        namespaces: createNamespaces(),
      })
      .then((res) => {
        addSession(res)
        navigate(routes.sessionDetails, res.topic)
      })
      .catch((error) => {
        console.error(error)
        // TODO : display error toast
        navigate(routes.home, { tab: tabsIndexes.connect })
      })
  }, [proposal])

  const rejectSession = useCallback(async () => {
    await web3wallet.rejectSession({
      id: proposal.id,
      reason: {
        code: 5000,
        message: "USER_REJECTED_METHODS",
      },
    })
    navigate(routes.home)
  }, [proposal])

  const addNewAccount = useCallback(async (currency: string) => {
    const walletApiClient = initWalletApiClient()
    try {
      const newAccount = await walletApiClient.account.request({
        currencyIds: [currency],
      })
      addAccount(newAccount)
    } catch (error) {
      console.error("request account canceled by user")
    }
    closeTransport()
  }, [])

  return {
    approveSession,
    rejectSession,
    proposer,
    handleClose,
    handleClick,
    accounts,
    selectedAccounts,
    formatAccountsByChain,
    addNewAccount,
  }
}
