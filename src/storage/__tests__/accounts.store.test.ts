import { act, renderHook } from "@testing-library/react";

import { useAccountsStore } from "../accounts.store";
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
