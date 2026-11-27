import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/tests/test.utils";
import sessionProposal from "@/data/mocks/sessionProposal.example.json";
import { ProposalTypes } from "@walletconnect/types";
import SessionProposal from "@/components/screens/SessionProposal";

const SOLANA_MAINNET = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";

const mocks = vi.hoisted(() => ({
  page: vi.fn(),
  track: vi.fn(),
  getApprovedChains: vi.fn(),
  approveSession: vi.fn(),
  rejectSession: vi.fn(),
}));

vi.mock("@/hooks/useVerification", () => ({ default: () => "VALID" }));

vi.mock("@/hooks/useAnalytics", () => ({
  default: () => ({ page: mocks.page, track: mocks.track }),
}));

vi.mock("@/hooks/useProposal/useProposal", () => ({
  useProposal: () => ({
    handleClick: vi.fn(),
    handleClose: vi.fn(),
    approveSession: mocks.approveSession,
    approveSessionAuthenticate: vi.fn(),
    rejectSession: mocks.rejectSession,
    rejectSessionAuthenticate: vi.fn(),
    accounts: [],
    selectedAccounts: ["eth-1"],
    addNewAccounts: vi.fn(),
    navigateToHome: vi.fn(),
    getApprovedChains: mocks.getApprovedChains,
  }),
}));

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

const proposal = {
  ...sessionProposal,
  requiredNamespaces: {
    eip155: {
      ...sessionProposal.requiredNamespaces.eip155,
      chains: ["eip155:1", "eip155:137"],
    },
  },
  optionalNamespaces: {
    eip155: { chains: ["eip155:1", "eip155:8453"], methods: [], events: [] },
    "eip155:10": { methods: [], events: [] },
    solana: { chains: [SOLANA_MAINNET], methods: [], events: [] },
  },
} as ProposalTypes.Struct;

const requestedChains = [
  "eip155:1",
  "eip155:137",
  "eip155:8453",
  "eip155:10",
  SOLANA_MAINNET,
];

const dapp = sessionProposal.proposer.metadata.name;
const url = sessionProposal.proposer.metadata.url;

describe("SessionProposal analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.approveSession.mockResolvedValue(undefined);
    mocks.rejectSession.mockResolvedValue(undefined);
    mocks.getApprovedChains.mockReturnValue(["eip155:1", "eip155:137"]);
  });

  it("sends the requested networks with the page view", () => {
    render(<SessionProposal proposal={proposal} />);

    expect(mocks.page).toHaveBeenCalledWith("Wallet Connect Session Request", {
      dapp,
      url,
      network: requestedChains,
    });
  });

  it("sends the approved networks when connecting", async () => {
    const { user } = render(<SessionProposal proposal={proposal} />);

    await user.click(
      screen.getByRole("button", { name: /sessionProposal.connect/i }),
    );

    expect(mocks.track).toHaveBeenCalledWith("button_clicked", {
      button: "WC-Connect",
      page: "Wallet Connect Session Request",
      dapp,
      url,
      network: ["eip155:1", "eip155:137"],
    });
    expect(mocks.approveSession).toHaveBeenCalled();
  });

  it("still approves with an empty network when approved chains cannot be computed", async () => {
    mocks.getApprovedChains.mockImplementation(() => {
      throw new Error("approved chains failure");
    });
    const { user } = render(<SessionProposal proposal={proposal} />);

    await user.click(
      screen.getByRole("button", { name: /sessionProposal.connect/i }),
    );

    expect(mocks.track).toHaveBeenCalledWith("button_clicked", {
      button: "WC-Connect",
      page: "Wallet Connect Session Request",
      dapp,
      url,
      network: [],
    });
    expect(mocks.approveSession).toHaveBeenCalled();
  });

  it("sends the requested networks when rejecting", async () => {
    const { user } = render(<SessionProposal proposal={proposal} />);

    await user.click(
      screen.getByRole("button", { name: /sessionProposal.reject/i }),
    );

    expect(mocks.track).toHaveBeenCalledWith("button_clicked", {
      button: "WC-Reject",
      page: "Wallet Connect Session Request",
      dapp,
      url,
      network: requestedChains,
    });
    expect(mocks.rejectSession).toHaveBeenCalled();
  });
});
