/* eslint-disable testing-library/no-debugging-utils */
import "@testing-library/react/dont-cleanup-after-each";
import { cleanup, render, waitFor, screen } from "@/tests/test.utils";
import { initialParamsHomePage } from "@/tests/mocks/initialParams.mock";
import sessionExample from "@/data/mocks/session.example.json";
import sessionProposal from "@/data/mocks/sessionProposal.example.json";
import SessionProposal from "@/components/screens/SessionProposal";
import SessionDetail from "@/components/screens/SessionDetail";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import { createRoute } from "@tanstack/react-router";
import AppScreen from "@/components/screens/App";
import { ProposalTypes, SessionTypes } from "@walletconnect/types";

const proposal = sessionProposal as ProposalTypes.Struct;
const session = sessionExample as SessionTypes.Struct;

vi.doMock("@tanstack/react-router", () => {
  return {
    createRoute: createRoute,
    useRouter: () => {
      console.log("HI");
    },
    useNavigate: vi.fn(() => {
      return {
        router: {
          query: initialParamsHomePage,
          push: mockPush,
        },
        navigate: vi.fn(),
      };
    }),
  };
});

const mockRejectSession = vi.fn(() =>
  Promise.resolve(() => console.log("REJECT DONE"))
);

const mockAcceptSession = vi.fn(() =>
  Promise.resolve(() => console.log("ACCEPT DONE"))
);

// TODO maybe remove as we already have a mock in the setup
vi.mock("@walletconnect/web3wallet", () => {
  return {
    Web3Wallet: {
      init: vi.fn(() => ({
        getActiveSessions: vi.fn(() => []),
        on: vi.fn((eventName, callback) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          window.addEventListener(eventName, callback);
        }),
        rejectSession: mockRejectSession,
        acceptSession: mockAcceptSession,
      })),
    },
  };
});

const mockPush = vi.fn();

beforeAll(() => {
  userEvent.setup();
});

afterEach(() => vi.clearAllMocks());
afterAll(() => cleanup());

describe.skip("Proposal Flow tests", () => {
  it("Should connect throught an uri, initialize Session proposal Screen", async () => {
    const { user } = render(<AppScreen />);

    await waitFor(
      () => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      },
      {
        timeout: 3000,
      }
    );

    await user.click(screen.getByRole("button", { name: /connect.cta/i }));

    cleanup();
    render(<SessionProposal proposal={proposal} />);

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", {
            name: /sessionProposal.connect/i,
          })
        ).toBeInTheDocument();
      },
      {
        timeout: 3000,
      }
    );

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", {
            name: /sessionProposal.reject/i,
          })
        ).toBeInTheDocument();
      },
      {
        timeout: 3000,
      }
    );
  });

  it("Should reject proposal", async () => {
    await userEvent.click(
      screen.getByRole("button", {
        name: /sessionProposal.reject/i,
      })
    );

    cleanup();

    render(<AppScreen />);

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: /connect.cta/i })
        ).toBeInTheDocument();
      },
      {
        timeout: 3000,
      }
    );
  });

  it("Should accept proposal and display Session details", async () => {
    console.log({ screen: screen.debug() });
    await userEvent.click(screen.getByRole("button", { name: /connect.cta/i }));
    cleanup();

    const { user: userProposal } = render(
      <SessionProposal proposal={proposal} />
    );

    await userProposal.click(
      screen.getByRole("button", {
        name: /sessionProposal.connect/i,
      })
    );

    cleanup();
    render(<SessionDetail session={session} />);

    expect(screen.getByText(/sessions\.detail\.title/i)).toBeInTheDocument();
    expect(
      screen.getByText(/sessions\.detail\.connected/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/sessions\.detail\.expires/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /sessions.detail.disconnect/i,
      })
    ).toBeInTheDocument();
  });
});
