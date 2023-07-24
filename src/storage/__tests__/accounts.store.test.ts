import { renderHook } from '@testing-library/react'

import { useAccountsStore } from '../accounts.store'
import { ACCOUNT_MOCK } from './mocks/account'

describe('Accounts Store', () => {
	it('Should have initial state ok', () => {
		const { result } = renderHook(() => useAccountsStore())
		const { accounts } = result.current
		expect(accounts).toEqual([])
	})

	it('should add an Account', () => {
		useAccountsStore.getState().addAccount(ACCOUNT_MOCK)
		expect(useAccountsStore.getState().accounts.length).toEqual(1)
	})

	it('should add multiple Accounts', () => {
		useAccountsStore
			.getState()
			.addAccounts([
				ACCOUNT_MOCK,
				{ ...ACCOUNT_MOCK, id: 'Mock2', name: 'Mock_2' },
				{ ...ACCOUNT_MOCK, id: 'Mock3', name: 'Mock_3' },
			])
		expect(useAccountsStore.getState().accounts.length).toEqual(3)
	})
	it('should clear accounts', () => {
		useAccountsStore
			.getState()
			.addAccounts([
				ACCOUNT_MOCK,
				{ ...ACCOUNT_MOCK, id: 'Mock2', name: 'Mock_2' },
				{ ...ACCOUNT_MOCK, id: 'Mock3', name: 'Mock_3' },
			])
		useAccountsStore.getState().clearAccounts()
		expect(useAccountsStore.getState().accounts.length).toEqual(0)
	})
})
