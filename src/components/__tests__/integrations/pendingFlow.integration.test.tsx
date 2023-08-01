/* eslint-disable testing-library/no-debugging-utils */
import '@testing-library/react/dont-cleanup-after-each'
import { render, screen, waitFor, act, cleanup } from '@testing-library/react'
import AppScreen from '@/pages/index'
import { MockTheme } from '@/tests-tools/theme.mock'
import sessionProposal from '@/data/sessionProposal.payload.json'
import userEvent from '@testing-library/user-event'
import SessionProposal from '@/pages/proposal'
import { useNavigation } from '@/hooks/common/useNavigation'
import SessionDetail from '@/pages/detail'

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

const mockRejectSession = jest.fn(
	() => new Promise((resolve) => resolve(() => console.log('REJECT DONE'))),
)
const mockAcceptSession = jest.fn(
	() => new Promise((resolve) => resolve(() => console.log('ACCEPT DONE'))),
)

jest.mock('@walletconnect/web3wallet', () => {
	return {
		Web3Wallet: {
			init: jest.fn(() => ({
				getActiveSessions: jest.fn(() => []),
				on: jest.fn((eventName, callback) => {
					console.log('Add event listener', eventName, callback)
					window.addEventListener(eventName, callback)
				}),
				rejectSession: mockRejectSession,
				acceptSession: mockAcceptSession,
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
			data: sessionProposal,
		},
	}),
)

beforeAll(() => {
	userEvent.setup()
})

afterEach(() => jest.clearAllMocks())
afterAll(() => cleanup())

const proposalRouter = () =>
	(useNavigation as jest.Mock).mockReturnValue({
		router: {
			query: { data: JSON.stringify(sessionProposal) },
		},
		routes: { sessionProposal: '/proposal', home: '/' },
		navigate: jest.fn(),
		tabsIndexes: { connect: 0, sessions: 1 },
	})
describe('Pending Flow tests', () => {
	it('Should connect throught an uri, initialize Session proposal Screen', async () => {
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

		await userEvent.click(
			screen.getByRole('button', { name: /connect.cta/i }),
		)

		cleanup()
		proposalRouter()
		render(
			<MockTheme>
				<SessionProposal />
			</MockTheme>,
		)

		await waitFor(
			() => {
				expect(
					screen.getByRole('button', {
						name: /sessionProposal.connect/i,
					}),
				).toBeInTheDocument()
			},
			{
				timeout: 3000,
			},
		)

		await waitFor(
			() => {
				expect(
					screen.getByRole('button', {
						name: /sessionProposal.reject/i,
					}),
				).toBeInTheDocument()
			},
			{
				timeout: 3000,
			},
		)
	})

	it('Should reject proposal', async () => {
		await userEvent.click(
			screen.getByRole('button', {
				name: /sessionProposal.reject/i,
			}),
		)
		;(useNavigation as jest.Mock).mockReturnValue({
			router: {
				query: initialParamsHomePage,
			},
			routes: { sessionProposal: '/proposal', home: '/' },
			navigate: jest.fn(),
			tabsIndexes: { connect: 0, sessions: 1 },
		})

		cleanup()

		render(
			<MockTheme>
				<AppScreen />
			</MockTheme>,
		)

		await waitFor(
			() => {
				expect(
					screen.getByRole('button', { name: /connect.cta/i }),
				).toBeInTheDocument()
			},
			{
				timeout: 3000,
			},
		)
	})

	it('Should accept proposal and display Session details', async () => {
		await userEvent.click(
			screen.getByRole('button', { name: /connect.cta/i }),
		)
		cleanup()
		proposalRouter()

		render(
			<MockTheme>
				<SessionProposal />
			</MockTheme>,
		)

		await userEvent.click(
			screen.getByRole('button', {
				name: /sessionProposal.connect/i,
			}),
		)

		cleanup()
		render(
			<MockTheme>
				<SessionDetail />
			</MockTheme>,
		)

		expect(screen.getByText(/sessions\.detail\.title/i)).toBeInTheDocument()
		expect(
			screen.getByText(/sessions\.detail\.connected/i),
		).toBeInTheDocument()
		expect(
			screen.getByText(/sessions\.detail\.expires/i),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', {
				name: /sessions.detail.disconnect/i,
			}),
		).toBeInTheDocument()

		screen.logTestingPlaygroundURL()
	})
})
