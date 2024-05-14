import "@testing-library/react/dont-cleanup-after-each";
import { cleanup, render, waitFor, screen } from "@/tests/test.utils";
import AppScreen from "@/components/screens/App";
import sessionProposal from "@/data/mocks/sessionProposal.example.json";
import SessionProposal from "@/components/screens/SessionProposal.1";
import { vi, describe, it, expect } from "vitest";
import { ProposalTypes } from "@walletconnect/types";

const proposal = sessionProposal as ProposalTypes.Struct;

afterEach(() => vi.clearAllMocks());
afterAll(() => cleanup());

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

    const { user: userProposal } = render(
      <SessionProposal proposal={proposal} />
    );

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
