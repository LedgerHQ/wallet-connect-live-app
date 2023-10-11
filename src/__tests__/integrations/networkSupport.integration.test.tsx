/* eslint-disable testing-library/no-debugging-utils */
import "@testing-library/react/dont-cleanup-after-each";
import { cleanup, render, waitFor, screen } from "@/tests-tools/test.utils";
import { initialParamsHomePage } from "@/tests-tools/mocks/initialParams.mock";
import AppScreen from "@/pages/index";
import sessionProposalNotSupported from "@/data/mocks/sessionProposalNotSupported.example.json";
import SessionProposal from "@/pages/proposal";
import { useNavigation } from "@/hooks/common/useNavigation";

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

const mockPush = jest.fn();

afterEach(() => jest.clearAllMocks());
afterAll(() => cleanup());

const proposalRouter = () =>
  (useNavigation as jest.Mock).mockReturnValue({
    router: {
      query: { data: JSON.stringify(sessionProposalNotSupported) },
      push: jest.fn(),
    },
    navigate: jest.fn(),
  });

describe("Network Support tests", () => {
  it("Should connect throught an uri and redirect to Error Support screen, then go back to Index Page", async () => {
    const { user: userApp } = render(<AppScreen />);

    await waitFor(
      () => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      },
      {
        timeout: 3000,
      },
    );

    await userApp.click(screen.getByRole("button", { name: /connect.cta/i }));

    cleanup();
    proposalRouter();

    const { user: userProposal } = render(<SessionProposal />);

    expect(screen.getByText(/sessionProposal.error.title/i)).toBeInTheDocument();

    expect(screen.getByText(/sessionProposal.error.desc/i)).toBeInTheDocument();

    await userProposal.click(screen.getByRole("button", { name: /sessionProposal.close/i }));

    cleanup();

    render(<AppScreen />);
  });
});
