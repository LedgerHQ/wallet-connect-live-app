import BigNumber from 'bignumber.js'
import { EthTransaction, convertEthToLiveTX } from '../converters'
import eip55 from 'eip55'

const to = '0x98BD1afBf1775A1FA55Cbb34B42AC482aA15Ff6E'

describe('Converter File', () => {
	it('convertEthToLiveTX correclty formatted', async () => {
		const ethTx: EthTransaction = {
			value: '0x00300202020202',
			to,
			gasPrice: '0x00300202',
			gas: '0x0030020',
			data: '0x00FD33eeeeeeeeeeeeee2eEFDFFEE33eeeeeeeeeeee9903KDD',
		}

		const expected = {
			family: 'ethereum',
			amount: new BigNumber(ethTx.value.replace('0x', ''), 16),
			recipient: eip55.encode(ethTx.to),
			gasPrice: new BigNumber(ethTx.gasPrice.replace('0x', ''), 16),
			gasLimit: new BigNumber(ethTx.gas.replace('0x', ''), 16),
			data: Buffer.from(ethTx.data.replace('0x', ''), 'hex'),
		}
		const converted = convertEthToLiveTX(ethTx)

		expect(converted).toEqual(expected)
	})

	it('convertEthToLiveTX wrongly formatted', async () => {
		const ethTx: EthTransaction = {
			value: '',
			to,
			gasPrice: '',
			gas: '',
			data: '',
		}

		const expected = {
			family: 'ethereum',
			amount: new BigNumber(0),
			recipient: eip55.encode(ethTx.to),
			gasPrice: new BigNumber(0),
			gasLimit: new BigNumber(0),
			data: undefined,
		}
		const converted = convertEthToLiveTX(ethTx)

		expect(converted).toEqual(expected)
	})
})
