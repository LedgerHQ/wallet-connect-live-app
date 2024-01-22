import { Account } from "@ledgerhq/wallet-api-client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { StorageKeys } from "@/storage/types";
export type AccountsState = {
  accounts: Account[];
  addAccounts: (accounts: Account[]) => void;
  addAccount: (account: Account) => void;
  clearAccounts: () => void;
};

const useAccountsStore = create<AccountsState>()(
  persist(
    (set) => ({
      accounts: [],
      addAccounts: (accounts: Account[]) => set(() => ({ accounts: accounts })),
      addAccount: (account: Account) =>
        set((state) => ({ accounts: [...state.accounts, account] })),
      clearAccounts: () => set(() => ({ accounts: [] })),
    }),
    {
      name: StorageKeys.Accounts,
    }
  )
);

const accountSelector = {
  selectAccounts: (state: AccountsState): Account[] => state.accounts,
  addAccounts: (state: AccountsState) => state.addAccounts,
  addAccount: (state: AccountsState) => state.addAccount,
  clearAccounts: (state: AccountsState) => state.clearAccounts,
};

export { useAccountsStore, accountSelector };
