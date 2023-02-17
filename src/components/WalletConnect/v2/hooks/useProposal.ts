import { Proposal } from '@/types/types'
import { Account } from '@ledgerhq/live-app-sdk'
import { SessionTypes } from '@walletconnect/types'

import router from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { EIP155_SIGNING_METHODS } from '../data/EIP155Data'
import { formatChainName } from '../utils/HelperUtil'
import { web3wallet } from '../utils/WalletConnectUtil'
import useNavigation from './useNavigation'
import { accounts, networks, platformSDK } from './useLedgerLive'

type Props = {
	proposal: Proposal
}

const getNamespace = (chain: string) => {
	switch (chain) {
		case 'ethereum':
		default:
			return 'eip155:1'
		case 'polygon':
			return 'eip155:137'
		case 'bsc':
			return ' eip155:56'
	}
}

export function useProposal({ proposal }: Props) {
	const { navigate, routes } = useNavigation()

	const [accountsLocal, setAccounts] = useState<Account[]>([])

	const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])

	const proposer = proposal.params.proposer

	useEffect(() => {
		setAccounts(accounts)
	}, [])

	const handleClick = useCallback(
		(account: string) => {
			if (selectedAccounts.includes(account)) {
				setSelectedAccounts(
					selectedAccounts.filter((s) => s !== account),
				)
			} else {
				setSelectedAccounts([...selectedAccounts, account])
			}
		},
		[selectedAccounts],
	)

	const handleClose = useCallback(() => {
		router.push('/')
	}, [])

	const getChains = (proposal: Proposal) =>
		Object.values(proposal.params.requiredNamespaces)

	const formatAccountsByChain = (proposal: Proposal, accounts: Account[]) => {
		const families = getChains(proposal)

		const chainsRequested = Object.values(families)
			.map((f) => f.chains)
			.reduce((value, acc) => acc.concat(value), [])

		const mappedChains = chainsRequested.map((chain) => {
			const formatedChain = formatChainName(chain).toLowerCase()

			return {
				chain: formatedChain,
				isSupported: networks
					.map((n) => n.currency)
					.includes(formatedChain),
				accounts: accounts.filter(
					(acc) => acc.currency === formatedChain,
				),
			}
		})

		return mappedChains
	}

	const createNamespaces = (): Record<string, SessionTypes.BaseNamespace> => {
		const accountsByChain = formatAccountsByChain(
			proposal,
			accountsLocal,
		).filter((a) => a.accounts.length > 0 && a.isSupported)
		const hasETH = accountsByChain.find((acc) => acc.chain === 'ethereum')
		const hasPolygon = accountsByChain.find(
			(acc) => acc.chain === 'polygon',
		)
		const hasBSC = accountsByChain.find((acc) => acc.chain === 'bsc')

		const accountsToSend = accountsByChain.reduce<string[]>(
			(accum, elem) =>
				accum.concat(
					elem.accounts
						.filter((acc) => selectedAccounts.includes(acc.address))
						.map((a) => `${getNamespace(a.currency)}:${a.address}`),
				),
			[],
		)

		return {
			eip155: {
				methods: [
					EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION,
					EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION,
					EIP155_SIGNING_METHODS.ETH_SIGN,
					EIP155_SIGNING_METHODS.PERSONAL_SIGN,
					EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA,
					EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3,
					EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4,
				],
				chains: [
					hasETH ? 'eip155:1' : '',
					hasBSC ? 'eip155:56' : '',
					hasPolygon ? 'eip155:137' : '',
				].filter((e) => e.length),
				events: ['chainChanged', 'accountsChanged'],
				accounts: accountsToSend,
			},
		}
	}

	const approveSession = useCallback(async () => {
		web3wallet
			.approveSession({
				id: proposal.id,
				namespaces: createNamespaces(),
			})
			.then(() => navigate(routes.connect))
			.catch((error) => {
				console.log(error)
				navigate(routes.reject, error)
			})
	}, [proposal])

	const rejectSession = useCallback(async () => {
		await web3wallet.rejectSession({
			id: proposal.id,
			reason: {
				code: 5000,
				message: 'USER_REJECTED_METHODS',
			},
		})
		navigate(routes.reject)
	}, [])

	const addNewAccount = useCallback(async (currency: string) => {
		try {
			const newAccount = await platformSDK.requestAccount({
				currencies: [currency],
			})

			setAccounts([...accountsLocal, newAccount])
		} catch (error) {
			console.log('request account canceled by user')
		}
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
