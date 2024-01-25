import { describe, expect, it } from 'vitest'
import { act, renderHook } from "@testing-library/react";

import { AccountsState, accountSelector, useAccountsStore } from "../accounts.store";
import { ACCOUNT_MOCK } from "@/tests-tools/mocks/account.mock";

describe("Accounts Store", () => {
  it("Should have initial state ok", () => {
    const { result } = renderHook(() => useAccountsStore());
    const { accounts } = result.current;
    expect(accounts).toEqual([]);
  });

  it("should add an Account", () => {
    const { result } = renderHook(() => useAccountsStore());

    act(() => result.current.addAccount(ACCOUNT_MOCK));
    expect(result.current.accounts.length).toEqual(1);
  });

  it("should add multiple Accounts", () => {
    const { result } = renderHook(() => useAccountsStore());

    act(() =>
      result.current.addAccounts([
        ACCOUNT_MOCK,
        { ...ACCOUNT_MOCK, id: "Mock2", name: "Mock_2" },
        { ...ACCOUNT_MOCK, id: "Mock3", name: "Mock_3" },
      ]),
    );
    expect(result.current.accounts.length).toEqual(3);
  });
  it("should clear accounts", () => {
    const { result } = renderHook(() => useAccountsStore());

    act(() =>
      result.current.addAccounts([
        ACCOUNT_MOCK,
        { ...ACCOUNT_MOCK, id: "Mock2", name: "Mock_2" },
        { ...ACCOUNT_MOCK, id: "Mock3", name: "Mock_3" },
      ]),
    );

    expect(result.current.accounts.length).toEqual(3);
    act(() => result.current.clearAccounts());
    expect(result.current.accounts.length).toEqual(0);
  });
});

describe("accountSelector", () => {
  it("should select accounts", () => {
    const mockState: AccountsState = {
      accounts: [
        { ...ACCOUNT_MOCK, id: "6", name: "Account 6" },
        { ...ACCOUNT_MOCK, id: "7", name: "Account 7" },
      ],
      addAccounts: () => jest.fn(),
      addAccount: () => jest.fn(),
      clearAccounts: () => jest.fn(),
    };

    const selectedAccounts = accountSelector.selectAccounts(mockState);

    expect(selectedAccounts).toEqual(mockState.accounts);
  });
});
