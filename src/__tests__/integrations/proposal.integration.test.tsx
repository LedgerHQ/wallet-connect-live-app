/* eslint-disable testing-library/no-debugging-utils */
import "@testing-library/react/dont-cleanup-after-each";
import { cleanup, render, waitFor, screen } from "@/tests-tools/test.utils";
import { initialParamsHomePage } from "@/tests-tools/mocks/initialParams.mock";
// import AppScreen from "@/pages/index";
import sessionProposal from "@/data/mocks/sessionProposal.example.json";
import SessionProposal from "@/components/screens/SessionProposal";
import SessionDetail from "@/components/screens/SessionDetail";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import { createRoute, useNavigate } from "@tanstack/react-router";
import AppScreen from "@/components/screens/App";

// mock useRouter
// jest.mock("next/router", () => ({
//   useRouter: jest.fn(() => ({
//     query: {},
//     push: jest.fn(),
//   })),
// }));

vi.doMock("@tanstack/react-router", () => {
  return {
    // ...requireA
    createRoute: createRoute,
    useRouter: () => {
      console.log("HI");
    },
    useNavigate: vi.fn(() => {
      return {
        router: {
          // ...jest.requireActual("next/router"),
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

const proposalRouter = () =>
  (useNavigate as jest.Mock).mockReturnValue({
    router: {
      query: { data: JSON.stringify(sessionProposal) },
    },
    navigate: jest.fn(),
  });
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
    proposalRouter();
    render(<SessionProposal />);

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
    (useNavigate as jest.Mock).mockReturnValue({
      router: {
        query: initialParamsHomePage,
      },
      navigate: jest.fn(),
    });

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
    proposalRouter();

    const { user: userProposal } = render(<SessionProposal />);

    await userProposal.click(
      screen.getByRole("button", {
        name: /sessionProposal.connect/i,
      })
    );

    cleanup();
    render(<SessionDetail topic="" />);

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
