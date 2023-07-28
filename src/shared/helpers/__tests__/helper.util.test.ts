import { EIP155_CHAINS } from '@/data/EIP155Data'
import {
	formatChainName,
	getCurrencyByChainId,
	getNamespace,
	getTicker,
} from '../helper.util'

describe('Helper Util', () => {
	it('formatChainName', async () => {
		const existing = formatChainName('eip155:1')
		const notExisting = formatChainName('eip155:12332')

		expect(existing).toEqual(EIP155_CHAINS['eip155:1'].name)
		expect(notExisting).toEqual('eip155:12332')
	})
	it('getTicker', async () => {
		const text = getTicker('polygon')
		expect(text).toEqual('MATIC')

		const textETh = getTicker('ethereum')
		expect(textETh).toEqual('ETH')

		const textDefault = getTicker('eratum')
		expect(textDefault).toEqual('ETH')
	})
	it('getNamespace', async () => {
		const text = getNamespace('ethereum')

		expect(text).toEqual('eip155:1')

		const falseText = getNamespace('polygome')
		expect(falseText).toEqual('eip155:1')
	})
	it('getCurrencyByChainId', async () => {
		const text = getCurrencyByChainId('error-title-blockchain-support')

		expect(text).toEqual('ethereum')

		const polygon = getCurrencyByChainId('eip155:137')

		expect(polygon).toEqual('polygon')
	})
})
