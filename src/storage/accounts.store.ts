import { Account } from '@ledgerhq/wallet-api-client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AccountsState {
	accounts: Account[]
	accountsConnected: Account[]
	addAccounts: (accounts: Account[]) => void
	addAccount: (account: Account) => void
	setAccountsConnected: (account: Account[]) => void
	clearAccounts: () => void
}

const useAccountsStore = create<AccountsState>()(
	persist(
		(set) => ({
			accounts: [],
			accountsConnected: [],
			setAccountsConnected: (accounts: Account[]) =>
				set(() => ({ accountsConnected: accounts })),
			addAccounts: (accounts: Account[]) =>
				set(() => ({ accounts: accounts })),
			addAccount: (account: Account) =>
				set((state) => ({ accounts: [...state.accounts, account] })),
			clearAccounts: () => set(() => ({ accounts: [] })),
		}),
		{
			name: 'accounts-storage',
		},
	),
)

const accountSelector = {
	selectAccounts: (state: AccountsState): Account[] => state.accounts,
	selectAccountsConnected: (state: AccountsState): Account[] =>
		state.accountsConnected,
	addAccounts: (state: AccountsState) => state.addAccounts,
	addAccount: (state: AccountsState) => state.addAccount,
	clearAccounts: (state: AccountsState) => state.clearAccounts,
	setAccountsConnected: (state: AccountsState) => state.setAccountsConnected,
}

export { useAccountsStore, accountSelector }
