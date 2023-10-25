/* eslint-disable testing-library/no-debugging-utils */
import "@testing-library/react/dont-cleanup-after-each";
import { cleanup, render, waitFor, screen } from "@/tests-tools/test.utils";
import { initialParamsHomePage } from "@/tests-tools/mocks/initialParams.mock";
import AppScreen from "@/pages/index";
import sessionProposal from "@/data/mocks/sessionProposal.example.json";
import SessionProposal from "@/pages/proposal";
import { useNavigation } from "@/hooks/common/useNavigation";
import SessionDetail from "@/pages/detail";
import userEvent from "@testing-library/user-event";
import { createWeb3Wallet } from "@/shared/helpers/walletConnect.util";

// mock useRouter
jest.mock("next/router", () => ({
  useRouter: jest.fn(() => ({
    query: {},
    push: jest.fn(),
  })),
}));

jest.mock("@/hooks/common/useNavigation", () => {
  return {
    useNavigation: jest.fn(() => {
      return {
        router: {
          ...jest.requireActual("next/router"),
          query: initialParamsHomePage,
          push: mockPush,
        },
        navigate: jest.fn(),
      };
    }),
  };
});

const mockRejectSession = jest.fn(() => Promise.resolve(() => console.log("REJECT DONE")));

const mockAcceptSession = jest.fn(() => Promise.resolve(() => console.log("ACCEPT DONE")));

jest.mock("@walletconnect/web3wallet", () => {
  return {
    Web3Wallet: {
      init: jest.fn(() => ({
        getActiveSessions: jest.fn(() => []),
        on: jest.fn((eventName, callback) => {
          window.addEventListener(eventName, callback);
        }),
        rejectSession: mockRejectSession,
        acceptSession: mockAcceptSession,
      })),
    },
  };
});

const mockPush = jest.fn();

beforeAll(() => {
  userEvent.setup();
});

afterEach(() => jest.clearAllMocks());
afterAll(() => cleanup());

const proposalRouter = () =>
  (useNavigation as jest.Mock).mockReturnValue({
    router: {
      query: { data: JSON.stringify(sessionProposal) },
    },
    navigate: jest.fn(),
  });
describe("Proposal Flow tests", () => {
  it("Should connect throught an uri, initialize Session proposal Screen", async () => {
    const { user } = render(<AppScreen />);

    await waitFor(
      () => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      },
      {
        timeout: 3000,
      },
    );

    await user.click(screen.getByRole("button", { name: /connect.cta/i }));

    cleanup();
    proposalRouter();
    render(<SessionProposal />);
    await createWeb3Wallet();

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", {
            name: /sessionProposal.connect/i,
          }),
        ).toBeInTheDocument();
      },
      {
        timeout: 3000,
      },
    );

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", {
            name: /sessionProposal.reject/i,
          }),
        ).toBeInTheDocument();
      },
      {
        timeout: 3000,
      },
    );
  });

  it("Should reject proposal", async () => {
    await userEvent.click(
      screen.getByRole("button", {
        name: /sessionProposal.reject/i,
      }),
    );
    (useNavigation as jest.Mock).mockReturnValue({
      router: {
        query: initialParamsHomePage,
      },
      navigate: jest.fn(),
    });

    cleanup();

    render(<AppScreen />);

    await waitFor(
      () => {
        expect(screen.getByRole("button", { name: /connect.cta/i })).toBeInTheDocument();
      },
      {
        timeout: 3000,
      },
    );
  });

  it("Should accept proposal and display Session details", async () => {
    await userEvent.click(screen.getByRole("button", { name: /connect.cta/i }));
    cleanup();
    proposalRouter();

    const { user: userProposal } = render(<SessionProposal />);

    await userProposal.click(
      screen.getByRole("button", {
        name: /sessionProposal.connect/i,
      }),
    );

    cleanup();
    render(<SessionDetail />);

    expect(screen.getByText(/sessions\.detail\.title/i)).toBeInTheDocument();
    expect(screen.getByText(/sessions\.detail\.connected/i)).toBeInTheDocument();
    expect(screen.getByText(/sessions\.detail\.expires/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /sessions.detail.disconnect/i,
      }),
    ).toBeInTheDocument();
  });
});
