/* eslint-disable testing-library/no-debugging-utils */
import '@testing-library/react/dont-cleanup-after-each'
import { act, cleanup, render, waitFor, screen } from '@/tests-tools/test.utils'
import AppScreen from '@/pages/index'
import sessionProposalNotSupported from '@/data/mocks/sessionProposalNotSupported.example.json'

import SessionProposal from '@/pages/proposal'
import { useNavigation } from '@/hooks/common/useNavigation'

const initialParamsHomePage = {
	theme: 'dark',
	lang: 'en',
	uri: 'wc:63d3add7e715d3abcd9ebf5fec7482aa9f7a851ed0a8202a461d495e1512f9af@2?relay-protocol=irn&symKey=816d9a3e209bc4e4af45dafb4975b7ffd65a7c2413662f60d4d468455e6823bf',
	params: '{"networks":[{"currency":"ethereum","chainId":1},{"currency":"bsc","chainId":56},{"currency":"polygon","chainId":137}]}',
}

// mock useRouter
jest.mock('next/router', () => ({
	useRouter: jest.fn(() => ({
		query: {},
		push: jest.fn(),
	})),
}))

jest.mock('@/hooks/common/useNavigation', () => {
	return {
		useNavigation: jest.fn(() => {
			return {
				router: {
					...jest.requireActual('next/router'),
					query: initialParamsHomePage,
					push: mockPush,
				},
				tabsIndexes: { connect: 0 },
				routes: {
					sessionProposal: '/proposal',
					home: '/',
					sessionDetails: '/details',
				},
				navigate: jest.fn(),
			}
		}),
	}
})

jest.mock('@walletconnect/core', () => {
	return {
		Core: jest.fn(() => {
			return {
				pairing: {
					// TODO : trigger a session_proposal event sending the proposal info
					pair: jest.fn((data) => {
						setTimeout(() => {
							console.log(
								'PAIRING',
								data,
								sessionProposalNotSupported,
							)
							act(() =>
								window.dispatchEvent(
									new CustomEvent('session_proposal', {
										detail: sessionProposalNotSupported,
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

const mockPush = jest.fn(() =>
	console.log('ROUTER PUSH', {
		pathname: '/proposal',
		query: {
			data: sessionProposalNotSupported,
		},
	}),
)

afterEach(() => jest.clearAllMocks())
afterAll(() => cleanup())

const proposalRouter = () =>
	(useNavigation as jest.Mock).mockReturnValue({
		router: {
			query: { data: JSON.stringify(sessionProposalNotSupported) },
			push: jest.fn(),
		},
		routes: { sessionProposal: '/proposal', home: '/' },
		navigate: jest.fn(),
		tabsIndexes: { connect: 0, sessions: 1 },
	})

describe('Network Support tests', () => {
	it('Should connect throught an uri and redirect to Error Support screen, then go back to Index Page', async () => {
		const { user: userApp } = render(<AppScreen />)

		await waitFor(
			() => {
				expect(screen.getByRole('textbox')).toBeInTheDocument()
			},
			{
				timeout: 3000,
			},
		)

		await userApp.click(
			screen.getByRole('button', { name: /connect.cta/i }),
		)

		cleanup()
		proposalRouter()

		const { user: userProposal } = render(<SessionProposal />)

		expect(
			screen.getByText(/sessionProposal.error.title/i),
		).toBeInTheDocument()

		expect(
			screen.getByText(/sessionProposal.error.desc/i),
		).toBeInTheDocument()

		await userProposal.click(
			screen.getByRole('button', { name: /sessionProposal.close/i }),
		)

		cleanup()

		render(<AppScreen />)
	})
})
