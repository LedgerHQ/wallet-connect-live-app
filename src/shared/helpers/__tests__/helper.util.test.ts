import { SUPPORTED_NETWORK } from '@/data/network.config'
import {
	getCurrencyByChainId,
	getDisplayName,
	getNamespace,
	getNetwork,
	getTicker,
} from '../helper.util'

describe('Helper Util', () => {
	it('getTicker', async () => {
		const text = getTicker('polygon')
		expect(text).toEqual('MATIC')

		const textETh = getTicker('ethereum')
		expect(textETh).toEqual('ETH')
	})
	it('getNamespace', async () => {
		const text = getNamespace('ethereum')

		expect(text).toEqual('eip155:1')

		const falseText = getNamespace('polygome')
		expect(falseText).toEqual('polygome')
	})
	it('getCurrencyByChainId', async () => {
		const text = getCurrencyByChainId('error-title-blockchain-support')

		expect(text).toEqual('error-title-blockchain-support')

		const polygon = getCurrencyByChainId('eip155:137')

		expect(polygon).toEqual('polygon')
	})

	it('getNetwork', async () => {
		const matic = getNetwork('polygon')
		expect(matic.chainId).toEqual(SUPPORTED_NETWORK['polygon'].chainId)

		const arb = getNetwork('arbitrum')
		expect(arb.chainId).toEqual(SUPPORTED_NETWORK['arbitrum'].chainId)
	})

	it('getDisplayName', async () => {
		const matic = getDisplayName('polygon')
		expect(matic).toEqual(SUPPORTED_NETWORK['polygon'].displayName)

		const arb = getDisplayName('arboretum')
		expect(arb).toEqual('arboretum')
	})
})
