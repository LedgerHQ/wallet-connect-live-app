/* eslint-disable testing-library/no-debugging-utils */
import '@testing-library/react/dont-cleanup-after-each'

import sessionProposalNotSupported from '@/data/mocks/sessionProposalNotSupported.example.json'
import { useNavigation } from '@/hooks/common/useNavigation'
import AppScreen from '@/pages/index'
import SessionProposal from '@/pages/proposal'
import { initialParamsHomePage } from '@/tests-tools/mocks/initialParams.mock'
import { act, cleanup, render, screen, waitFor } from '@/tests-tools/test.utils'

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
          pair: jest.fn(() => {
            setTimeout(() => {
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
        on: jest.fn((eventName, callback) =>
          window.addEventListener(eventName, callback),
        ),
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

const mockPush = jest.fn()

afterEach(() => jest.clearAllMocks())
afterAll(() => cleanup())

const proposalRouter = () =>
  (useNavigation as jest.Mock).mockReturnValue({
    router: {
      query: { data: JSON.stringify(sessionProposalNotSupported) },
      push: jest.fn(),
    },
    navigate: jest.fn(),
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

    await userApp.click(screen.getByRole('button', { name: /connect.cta/i }))

    cleanup()
    proposalRouter()

    const { user: userProposal } = render(<SessionProposal />)

    expect(screen.getByText(/sessionProposal.error.title/i)).toBeInTheDocument()

    expect(screen.getByText(/sessionProposal.error.desc/i)).toBeInTheDocument()

    await userProposal.click(
      screen.getByRole('button', { name: /sessionProposal.close/i }),
    )

    cleanup()

    render(<AppScreen />)
  })
})
