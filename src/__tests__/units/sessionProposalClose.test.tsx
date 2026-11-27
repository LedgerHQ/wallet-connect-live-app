import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/tests/test.utils";
import sessionProposal from "@/data/mocks/sessionProposal.example.json";
import { ProposalTypes } from "@walletconnect/types";
import SessionProposal from "@/components/screens/SessionProposal";
import { AccountsInChain } from "@/hooks/useProposal/util";

const { handleCloseMock, analyticsPageMock, accountsByChainMock } = vi.hoisted(
  () => ({
    handleCloseMock: vi.fn(),
    analyticsPageMock: vi.fn(),
    accountsByChainMock: vi.fn<() => AccountsInChain[]>(),
  }),
);

vi.mock("@/hooks/useVerification", () => ({ default: () => "VALID" }));

vi.mock("@/hooks/useAnalytics", () => ({
  default: () => ({ page: analyticsPageMock, track: vi.fn() }),
}));

vi.mock("@/hooks/useProposal/useProposal", () => ({
  useProposal: () => ({
    handleClick: vi.fn(),
    handleClose: handleCloseMock,
    approveSession: vi.fn(),
    approveSessionAuthenticate: vi.fn(),
    rejectSession: vi.fn(),
    rejectSessionAuthenticate: vi.fn(),
    accounts: [],
    selectedAccounts: [],
    addNewAccounts: vi.fn(),
    navigateToHome: vi.fn(),
  }),
}));

vi.mock("@/hooks/useProposal/util", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/useProposal/util")>()),
  formatAccountsByChain: accountsByChainMock,
}));

vi.mock("@/store/wallet-api.store", async (importOriginal) => {
  const { atom } = await import("jotai");
  return {
    ...(await importOriginal<typeof import("@/store/wallet-api.store")>()),
    walletCurrenciesByIdAtom: atom({}),
    walletInfoAtom: atom({
      wallet: { name: "ledger-live-desktop", version: "2.127.0" },
      tracking: false,
    }),
    walletCapabilitiesAtom: atom([]),
  };
});

const proposal = sessionProposal as ProposalTypes.Struct;

const ethereum = {
  chain: "ethereum",
  displayName: "Ethereum",
  isRequired: true,
  accounts: [],
};

describe("SessionProposal error screens Close", () => {
  it.each([
    {
      screenName: "Unsupported Blockchains",
      chains: [{ ...ethereum, isSupported: false }],
      page: "Wallet Connect Error Unsupported Blockchains",
    },
    {
      screenName: "Missing Required Account",
      chains: [{ ...ethereum, isSupported: true }],
      page: "Wallet Connect Error Missing Required Account",
    },
  ])(
    "shows the $screenName screen and closes with its page name",
    async ({ chains, page }) => {
      accountsByChainMock.mockReturnValue(chains);

      const { user } = render(<SessionProposal proposal={proposal} />);

      expect(analyticsPageMock).toHaveBeenCalledWith(page, expect.anything());

      await user.click(
        screen.getByRole("button", { name: /sessionProposal.close/i }),
      );

      expect(handleCloseMock).toHaveBeenCalledWith(page);
    },
  );
});
