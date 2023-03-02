/* eslint-disable @typescript-eslint/no-explicit-any */
import { Proposal } from '@/types/types'
import { Account } from '@ledgerhq/live-app-sdk'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import WalletConnectClient from '@walletconnect/client'
interface WalletConnectState {
	walletConnectClient?: WalletConnectClient
	sessionURI?: string
	session?: any
	timedOut: boolean
	selectedAccount?: Account
	proposal?: any
	modalOpen: boolean
	clearStore: () => void
	setModalOpen: (open: boolean) => void
	setSessionUri: (sessionUri?: string) => void
	setTimedOut: (timed: boolean) => void
	setSelectedAccount: (account?: Account) => void
	setProposal: (proposal?: Proposal) => void
	setSession: (session?: any) => void
	setWalletConnectClient: (walletConnectClient?: WalletConnectClient) => void
}
const useV1Store = create<WalletConnectState>()(
	persist(
		(set) => ({
			selectedAccount: undefined,
			proposal: undefined,
			timedOut: false,
			sessionURI: undefined,
			modalOpen: false,
			walletConnectClient: undefined,
			session: undefined,
			clearStore: () =>
				set(() => ({
					selectedAccount: undefined,
					proposal: undefined,
					timedOut: false,
					sessionURI: undefined,
					modalOpen: false,
					walletConnectClient: undefined,
					session: undefined,
				})),
			setWalletConnectClient: (walletConnectClient) =>
				set(() => ({
					walletConnectClient,
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
			setSession: (session) =>
				set(() => ({
					session: session,
				})),
		}),
		{
			name: 'v1-storage',
		},
	),
)

const v1Selector = {
	selectWalletConnectClient: (
		state: WalletConnectState,
	): WalletConnectClient | undefined => state.walletConnectClient,
	selectSession: (state: WalletConnectState): any | undefined =>
		state.session,
	selectAccount: (state: WalletConnectState): Account | undefined =>
		state.selectedAccount,
	selectModalOpen: (state: WalletConnectState): boolean => state.modalOpen,
	selectSessionUri: (state: WalletConnectState) => state.sessionURI,
	selectTimeout: (state: WalletConnectState) => state.timedOut,
	selectProposal: (state: WalletConnectState) => state.proposal,
	clearStore: (state: WalletConnectState) => state.clearStore,
	setSelectedAccount: (state: WalletConnectState) => state.setSelectedAccount,
	setSessionUri: (state: WalletConnectState) => state.setSessionUri,
	setTimedOut: (state: WalletConnectState) => state.setTimedOut,
	setProposal: (state: WalletConnectState) => state.setProposal,
	setModalOpen: (state: WalletConnectState) => state.setModalOpen,
	setSession: (state: WalletConnectState) => state.setSession,
	setWalletConnectClient: (state: WalletConnectState) =>
		state.setWalletConnectClient,
}

export { useV1Store, v1Selector }
