import { ACCOUNT_MOCK } from '@/tests-tools/mocks/account.mock'
import {
	compareETHAddresses,
	getAccountWithAddress,
	getAccountWithAddressAndChainId,
} from '../generic'

describe('Generic File', () => {
	it('compareETHAddresses', async () => {
		const adr1 = '0x98BD1afBf1775A1FA55Cbb34B42AC567aA15Ff6E'
		const adr2 = '0x98BD1afBf1775A1FA55Cbb34B42AC567aA15Ff6E'
		const adr3 = '0x98BD1afBf1235A1FA55Cbb34B42AC482aA15Ff6E'

		const compare1 = compareETHAddresses(adr1, adr2)
		const compare2 = compareETHAddresses(adr1, adr3)

		expect(compare1).toBeTruthy()
		expect(compare2).toBeFalsy()
	})
	it('getAccountWithAddress', async () => {
		const adr1 = '0x98BD1afBf1775A1FA55Cbb34B42AC567aA15Ff6E'
		const res = getAccountWithAddress([ACCOUNT_MOCK], adr1)
		const res2 = getAccountWithAddress([ACCOUNT_MOCK], ACCOUNT_MOCK.address)

		expect(res).toBeUndefined()
		expect(res2).toEqual(ACCOUNT_MOCK)
	})
	it('getAccountWithAddressAndChainId', async () => {
		const chainId = 'eip155:1'
		const res = getAccountWithAddressAndChainId(
			[ACCOUNT_MOCK],
			ACCOUNT_MOCK.address,
			chainId,
		)

		const chainId2 = 'eip155:56'
		const res2 = getAccountWithAddressAndChainId(
			[ACCOUNT_MOCK],
			ACCOUNT_MOCK.address,
			chainId2,
		)

		expect(res).toEqual(ACCOUNT_MOCK)
		expect(res2).toBeUndefined()
	})
})
