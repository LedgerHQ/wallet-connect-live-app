import { renderHook, act } from '@testing-library/react'

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
		const { result } = renderHook(() => useAppStore())

		act(() => result.current.setTheme(theme))
		expect(result.current.theme).toEqual(theme)
	})
	it('should addNetworks', () => {
		const { result } = renderHook(() => useAppStore())

		act(() => result.current.addNetworks([NETWORK_MOCK]))
		expect(result.current.networks.length).toEqual(1)
	})

	it('should clear networks', () => {
		const { result } = renderHook(() => useAppStore())

		act(() => result.current.addNetworks([NETWORK_MOCK]))
		expect(result.current.networks.length).toEqual(1)
		act(() => result.current.clearAppStore())
		expect(result.current.networks.length).toEqual(0)
	})
})
