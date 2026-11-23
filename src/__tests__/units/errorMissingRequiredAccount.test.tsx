import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/tests/test.utils";
import { ErrorMissingRequiredAccount } from "@/components/screens/sessionProposal/ErrorMissingRequiredAccount";
import { AccountsInChain } from "@/hooks/useProposal/util";

const { analyticsPageMock } = vi.hoisted(() => ({
  analyticsPageMock: vi.fn(),
}));

vi.mock("@/hooks/useAnalytics", () => ({
  default: () => ({ page: analyticsPageMock, track: vi.fn() }),
}));

const CHAINS: AccountsInChain[] = [
  {
    chain: "ethereum",
    displayName: "Ethereum",
    isSupported: true,
    isRequired: true,
    accounts: [],
  },
  {
    chain: "polygon",
    displayName: "Polygon",
    isSupported: true,
    isRequired: false,
    accounts: [],
  },
];

describe("ErrorMissingRequiredAccount", () => {
  it("tracks the Missing Required Account page once with the dApp and chains", async () => {
    const { rerender } = render(
      <ErrorMissingRequiredAccount
        appName="React App"
        appUrl="https://react-app.walletconnect.com"
        iconProposer={null}
        addNewAccounts={vi.fn()}
        chains={CHAINS}
      />,
    );

    expect(
      await screen.findByText("sessionProposal.missingRequired.title"),
    ).toBeInTheDocument();

    rerender(
      <ErrorMissingRequiredAccount
        appName="React App"
        appUrl="https://react-app.walletconnect.com"
        iconProposer={null}
        addNewAccounts={vi.fn()}
        chains={[...CHAINS]}
      />,
    );

    expect(analyticsPageMock).toHaveBeenCalledTimes(1);
    expect(analyticsPageMock).toHaveBeenCalledWith(
      "Wallet Connect Error Missing Required Account",
      {
        dapp: "React App",
        url: "https://react-app.walletconnect.com",
        chains: [
          { chain: "ethereum", isSupported: true, isRequired: true },
          { chain: "polygon", isSupported: true, isRequired: false },
        ],
      },
    );
  });
});
