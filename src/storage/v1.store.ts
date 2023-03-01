/* eslint-disable @typescript-eslint/no-explicit-any */
import { Proposal } from '@/types/types'
import { Account } from '@ledgerhq/live-app-sdk'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WalletConnectState {
	session: any | null
	sessionURI?: string
	timedOut: boolean
	selectedAccount?: Account
	proposal?: any
	modalOpen: boolean
	clearStore: () => void
	setSession: (session: any) => void
	setModalOpen: (open: boolean) => void
	setSessionUri: (sessionUri?: string) => void
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
			sessionURI: undefined,
			modalOpen: false,
			clearStore: () =>
				set(() => ({
					selectedAccount: undefined,
					proposal: undefined,
					timedOut: false,
					session: null,
					sessionURI: undefined,
					modalOpen: false,
				})),
			setSession: (session) =>
				set(() => ({
					session,
				})),
			setSessionUri: (sessionURI) =>
				set(() => ({
					sessionURI,
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
			setModalOpen: (open) =>
				set(() => ({
					modalOpen: open,
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
	selectModalOpen: (state: WalletConnectState): boolean => state.modalOpen,
	selectSession: (state: WalletConnectState) => state.session,
	selectSessionUri: (state: WalletConnectState) => state.sessionURI,
	selectTimeout: (state: WalletConnectState) => state.timedOut,
	selectProposal: (state: WalletConnectState) => state.proposal,
	clearStore: (state: WalletConnectState) => state.clearStore,
	setSelectedAccount: (state: WalletConnectState) => state.setSelectedAccount,
	setSession: (state: WalletConnectState) => state.setSession,
	setSessionUri: (state: WalletConnectState) => state.setSessionUri,
	setTimedOut: (state: WalletConnectState) => state.setTimedOut,
	setProposal: (state: WalletConnectState) => state.setProposal,
	setModalOpen: (state: WalletConnectState) => state.setModalOpen,
}

export { useV1Store, v1Selector }
