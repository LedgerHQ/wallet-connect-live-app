/* eslint-disable @typescript-eslint/no-explicit-any */
import { Proposal } from '@/types/types'
import { Account } from '@ledgerhq/live-app-sdk'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WalletConnectState {
	session: any | null
	timedOut: boolean
	selectedAccount?: Account
	proposal?: any
	clearStore: () => void
	setSession: (session: any) => void
	setTimedOut: (timed: boolean) => void
	setSelectedAccount: (account?: Account) => void
	setProposal: (proposal?: Proposal) => void
}
const useV1Store = create<WalletConnectState>()(
	persist(
		(set) => ({
			selectedAccount: undefined,
			proposal: undefined,
			timedOut: false,
			session: null,
			clearStore: () =>
				set(() => ({
					selectedAccount: undefined,
					session: null,
					timedOut: false,
				})),

			setSession: (session) =>
				set(() => ({
					session,
				})),

			setProposal: (newProposal) =>
				set(() => ({
					proposal: newProposal,
				})),
			setSelectedAccount: (account) =>
				set(() => ({
					selectedAccount: account,
				})),
			setTimedOut: (timedOut) =>
				set(() => ({
					timedOut,
				})),
		}),
		{
			name: 'v1-storage',
		},
	),
)

const v1Selector = {
	selectAccount: (state: WalletConnectState): Account | undefined =>
		state.selectedAccount,
	selectSession: (state: WalletConnectState) => state.session,
	selectTimeout: (state: WalletConnectState) => state.timedOut,
	selectProposal: (state: WalletConnectState) => state.proposal,
	clearStore: (state: WalletConnectState) => state.clearStore,
	setSelectedAccount: (state: WalletConnectState) => state.setSelectedAccount,
	setSession: (state: WalletConnectState) => state.setSession,
	setTimedOut: (state: WalletConnectState) => state.setTimedOut,
	setProposal: (state: WalletConnectState) => state.setProposal,
}

export { useV1Store, v1Selector }
