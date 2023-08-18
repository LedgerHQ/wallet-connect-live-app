import { Proposal } from "@/types/types"
import { Account } from "@ledgerhq/wallet-api-client"
import { SessionTypes } from "@walletconnect/types"
import { useCallback, useState } from "react"
import { useNavigation } from "@/hooks/common/useNavigation"
import { sessionSelector, useSessionsStore } from "@/storage/sessions.store"
import { accountSelector, useAccountsStore } from "@/storage/accounts.store"

import { getCurrencyByChainId, getDisplayName, getNamespace } from "@/helpers/helper.util"
import { web3wallet } from "@/helpers/walletConnect.util"
import useAnalytics from "@/hooks/common/useAnalytics"
import { useLedgerLive } from "./common/useLedgerLive"
import { SUPPORTED_NAMESPACE, SUPPORTED_NETWORK } from "@/data/network.config"
import { SUPPORTED_NAMESPACE_METHODS } from "@/data/methods/methods.index"

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

  const createChainsByFamily = (
    accountsByChain: AccountsInChain[],
    family: SUPPORTED_NAMESPACE,
  ) => {
    return Object.entries(SUPPORTED_NETWORK)
      .filter(([key, v]) => v.namespace.includes(family) && hasChain(key, accountsByChain))
      .map(([network]) => getNamespace(network))
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

    let res: Record<string, SessionTypes.BaseNamespace> = {}

    Object.keys(proposal.params.requiredNamespaces).map((namespace) => {
      const methods = proposal.params.requiredNamespaces[namespace].methods.concat(
        Object.values(
          SUPPORTED_NAMESPACE_METHODS[namespace as keyof typeof SUPPORTED_NAMESPACE_METHODS],
        ),
      )
      res = {
        ...res,
        [namespace]: {
          methods: [...new Set(methods)],
          chains: createChainsByFamily(
            accountsByChain,
            SUPPORTED_NAMESPACE[namespace as keyof typeof SUPPORTED_NAMESPACE],
          ),
          events:
            proposal.params.requiredNamespaces[namespace as keyof typeof SUPPORTED_NAMESPACE]
              .events,
          accounts: accountsToSend.filter((acc) => acc.includes(namespace)),
        },
        // For new namespace other than eip155 add new object here with same skeleton
      }
    })

    return res
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
