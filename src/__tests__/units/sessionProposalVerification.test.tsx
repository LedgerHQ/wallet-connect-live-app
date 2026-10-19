import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/tests/test.utils";
import sessionProposal from "@/data/mocks/sessionProposal.example.json";
import { ProposalTypes } from "@walletconnect/types";
import SessionProposal from "@/components/screens/SessionProposal";
import useVerification from "@/hooks/useVerification";
import { VerificationStatus } from "@/types/types";

vi.mock("@/hooks/useVerification", () => ({ default: vi.fn() }));

vi.mock("@/hooks/useAnalytics", () => ({
  default: () => ({ page: vi.fn(), track: vi.fn() }),
}));

vi.mock("@/hooks/useProposal/useProposal", () => ({
  useProposal: () => ({
    handleClick: vi.fn(),
    handleClose: vi.fn(),
    approveSession: vi.fn(),
    approveSessionAuthenticate: vi.fn(),
    rejectSession: vi.fn(),
    rejectSessionAuthenticate: vi.fn(),
    accounts: [],
    selectedAccounts: ["eth-1"],
    addNewAccounts: vi.fn(),
    navigateToHome: vi.fn(),
  }),
}));

// One required, supported chain with its account selected, so only the
// verification status can disable Connect.
vi.mock("@/hooks/useProposal/util", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/useProposal/util")>()),
  formatAccountsByChain: () => [
    {
      chain: "eip155:1",
      displayName: "Ethereum",
      isSupported: true,
      isRequired: true,
      accounts: [{ id: "eth-1", currency: "ethereum", address: "0x111" }],
    },
  ],
}));

vi.mock("@/components/screens/sessionProposal/ChainRow", () => ({
  ChainRow: () => null,
}));

vi.mock("@/components/screens/sessionProposal/AccountRow", () => ({
  AccountRow: () => null,
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
const mockedUseVerification = vi.mocked(useVerification);

const getConnectButton = () =>
  screen.getByRole("button", { name: /sessionProposal.connect/i });

describe("SessionProposal verification", () => {
  it.each<VerificationStatus>(["VALID", "UNKNOWN"])(
    "enables Connect when the verification is %s",
    (status) => {
      mockedUseVerification.mockReturnValue(status);
      render(<SessionProposal proposal={proposal} />);
      expect(getConnectButton()).toBeEnabled();
    },
  );

  it("disables Connect when the dApp is flagged as a scam", () => {
    mockedUseVerification.mockReturnValue("SCAM");
    render(<SessionProposal proposal={proposal} />);
    expect(getConnectButton()).toBeDisabled();
  });
});
