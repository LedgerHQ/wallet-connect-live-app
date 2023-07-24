import { renderHook } from '@testing-library/react'

import { useAppStore } from '../app.store'
import { NETWORK_MOCK } from './mocks/network'

describe('App Store', () => {
	it('Should have initial state ok', () => {
		const { result } = renderHook(() => useAppStore())
		const { networks, theme } = result.current

		expect(networks).toEqual([])
		expect(theme).toEqual('dark')
	})

	it('should setTheme', () => {
		const theme = 'light'
		useAppStore.getState().setTheme(theme)
		expect(useAppStore.getState().theme).toEqual(theme)
	})
	it('should addNetworks', () => {
		useAppStore.getState().addNetworks([NETWORK_MOCK])
		expect(useAppStore.getState().networks.length).toEqual(1)
	})

	it('should clear networks', () => {
		useAppStore.getState().addNetworks([NETWORK_MOCK])
		useAppStore.getState().clearAppStore()

		expect(useAppStore.getState().networks.length).toEqual(0)
	})
})
