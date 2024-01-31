import "@testing-library/react/dont-cleanup-after-each";
import { cleanup, render, waitFor, screen } from "@/tests-tools/test.utils";
import AppScreen from "@/components/screens/Home";
import SessionProposal from "@/components/screens/SessionProposal";
import { vi, describe, it, expect } from "vitest";

// mock useRouter
vi.mock("next/router", () => ({
  useRouter: vi.fn(() => ({
    query: {},
    push: vi.fn(),
  })),
}));

// jest.mock("@/hooks/common/useNavigation", () => {
//   return {
//     useNavigation: jest.fn(() => {
//       return {
//         router: {
//           ...jest.requireActual("next/router"),
//           query: initialParamsHomePage,
//           push: mockPush,
//         },
//         navigate: jest.fn(),
//       };
//     }),
//   };
// });

// const mockPush = vi.fn();

afterEach(() => vi.clearAllMocks());
afterAll(() => cleanup());

// const proposalRouter = () =>
//   (useNavigate as jest.Mock).mockReturnValue({
//     router: {
//       query: { data: JSON.stringify(sessionProposalNotSupported) },
//       push: jest.fn(),
//     },
//     navigate: jest.fn(),
//   });

describe.skip("Network Support tests", () => {
  it("Should connect throught an uri and redirect to Error Support screen, then go back to Index Page", async () => {
    const { user: userApp } = render(<AppScreen />);

    await waitFor(
      () => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      },
      {
        timeout: 3000,
      }
    );

    await userApp.click(screen.getByRole("button", { name: /connect.cta/i }));

    cleanup();
    // proposalRouter();

    const { user: userProposal } = render(<SessionProposal />);

    expect(
      screen.getByText(/sessionProposal.error.title/i)
    ).toBeInTheDocument();

    expect(screen.getByText(/sessionProposal.error.desc/i)).toBeInTheDocument();

    await userProposal.click(
      screen.getByRole("button", { name: /sessionProposal.close/i })
    );

    cleanup();

    render(<AppScreen />);
  });
});
