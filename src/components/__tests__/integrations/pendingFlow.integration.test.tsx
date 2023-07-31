import { render, screen, waitFor, act } from '@testing-library/react'
import AppScreen from '@/pages/index'
import { MockTheme } from '@/tests-tools/theme.mock'
import sessionProposal from '@/data/sessionProposal.payload.json'

jest.mock('@walletconnect/core', () => {
	return {
		Core: jest.fn(() => {
			return {
				pairing: {
					// TODO : trigger a session_proposal event sending the proposal info
					pair: jest.fn((data) => {
						setTimeout(() => {
							console.log('PAIRING', data, sessionProposal)
							act(() =>
								window.dispatchEvent(
									new CustomEvent('session_proposal', {
										detail: sessionProposal,
									}),
								),
							)
						}, 200)
					}),
				},
			}
		}),
	}
})

jest.mock('@walletconnect/web3wallet', () => {
	return {
		Web3Wallet: {
			init: jest.fn(() => ({
				getActiveSessions: jest.fn(() => []),
				on: jest.fn((eventName, callback) => {
					console.log('Add event listener', eventName, callback)
					window.addEventListener(eventName, callback)
				}),
			})),
		},
	}
})

jest.mock('@ledgerhq/wallet-api-client', () => {
	return {
		WindowMessageTransport: jest.fn(() => {
			return {
				connect: jest.fn(),
				disconnect: jest.fn(),
			}
		}),
		WalletAPIClient: jest.fn(() => {
			return {
				account: {
					list: jest.fn(() => new Promise((resolve) => resolve([]))),
				},
				wallet: {
					userId: jest.fn(
						() => new Promise((resolve) => resolve('testUserId')),
					),
					info: jest.fn(
						() =>
							new Promise((resolve) =>
								resolve({
									tracking: false,
									wallet: {
										name: 'test-wallet',
										version: '1.0.0',
									},
								}),
							),
					),
				},
			}
		}),
	}
})

jest.mock('next/router', () => ({
	useRouter: jest.fn(() => ({
		query: {
			theme: 'dark',
			lang: 'en',
			uri: 'wc:63d3add7e715d3abcd9ebf5fec7482aa9f7a851ed0a8202a461d495e1512f9af@2?relay-protocol=irn&symKey=816d9a3e209bc4e4af45dafb4975b7ffd65a7c2413662f60d4d468455e6823bf',
			params: '{"networks":[{"currency":"ethereum","chainId":1},{"currency":"bsc","chainId":56},{"currency":"polygon","chainId":137}]}',
		},
		push: jest.fn((params) => console.log('ROUTER PUSH', params)),
	})),
}))

afterEach(() => jest.clearAllMocks())

describe('useWalletConnectEventsManager tests', () => {
	it('useWalletConnectEventsManager when the app is not fully initialized', async () => {
		render(
			<MockTheme>
				<AppScreen />
			</MockTheme>,
		)
		await waitFor(
			() => {
				expect(screen.getByRole('textbox')).toBeInTheDocument()
			},
			{
				timeout: 3000,
			},
		)
		await waitFor(
			() => {
				expect(screen.getByTestId('textbox')).toBeInTheDocument()
			},
			{
				timeout: 1000,
			},
		)

		screen.logTestingPlaygroundURL()
	})
})
