import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/tests/test.utils";
import sessionProposal from "@/data/mocks/sessionProposal.example.json";
import { ProposalTypes } from "@walletconnect/types";
import SessionProposal from "@/components/screens/SessionProposal";
import {
  ConnectionEntry,
  connectionEntriesAtom,
  TrackedConnectionEntry,
} from "@/store/connectionEntry.store";
import { createStore, Provider } from "jotai";

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
    approveSessionAuthenticate: vi.fn().mockResolvedValue(undefined),
    rejectSession: mocks.rejectSession,
    rejectSessionAuthenticate: vi.fn().mockResolvedValue(undefined),
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

const approvedChains = ["eip155:1", "eip155:137"];

const flowId = proposal.pairingTopic;
const dapp = proposal.proposer.metadata.name;
const url = proposal.proposer.metadata.url;

const renderProposal = (entry?: ConnectionEntry) => {
  const store = createStore();
  if (entry) {
    store.set(connectionEntriesAtom, { [flowId]: entry });
  }
  return render(
    <Provider store={store}>
      <SessionProposal proposal={proposal} />
    </Provider>,
  );
};

describe("SessionProposal analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.approveSession.mockResolvedValue(undefined);
    mocks.rejectSession.mockResolvedValue(undefined);
    mocks.getApprovedChains.mockReturnValue(approvedChains);
  });

  it("sends the requested networks with the page view", () => {
    renderProposal();

    expect(mocks.page).toHaveBeenCalledWith("Wallet Connect Session Request", {
      dapp,
      url,
      network: requestedChains,
      entry: "unknown",
      flow_id: flowId,
    });
  });

  it("sends the approved networks when connecting", async () => {
    const { user } = renderProposal();

    await user.click(
      screen.getByRole("button", { name: /sessionProposal.connect/i }),
    );

    expect(mocks.track).toHaveBeenCalledWith("button_clicked", {
      button: "WC-Connect",
      page: "Wallet Connect Session Request",
      dapp,
      url,
      network: approvedChains,
      entry: "unknown",
      flow_id: flowId,
    });
    expect(mocks.approveSession).toHaveBeenCalled();
  });

  it("still approves with an empty network when approved chains cannot be computed", async () => {
    mocks.getApprovedChains.mockImplementation(() => {
      throw new Error("approved chains failure");
    });
    const { user } = renderProposal();

    await user.click(
      screen.getByRole("button", { name: /sessionProposal.connect/i }),
    );

    expect(mocks.track).toHaveBeenCalledWith("button_clicked", {
      button: "WC-Connect",
      page: "Wallet Connect Session Request",
      dapp,
      url,
      network: [],
      entry: "unknown",
      flow_id: flowId,
    });
    expect(mocks.approveSession).toHaveBeenCalled();
  });

  it("sends the requested networks when rejecting", async () => {
    const { user } = renderProposal();

    await user.click(
      screen.getByRole("button", { name: /sessionProposal.reject/i }),
    );

    expect(mocks.track).toHaveBeenCalledWith("button_clicked", {
      button: "WC-Reject",
      page: "Wallet Connect Session Request",
      dapp,
      url,
      network: requestedChains,
      entry: "unknown",
      flow_id: flowId,
    });
    expect(mocks.rejectSession).toHaveBeenCalled();
  });

  describe.each<[ConnectionEntry | undefined, TrackedConnectionEntry]>([
    ["scan", "scan"],
    ["paste", "paste"],
    ["deeplink", "deeplink"],
    [undefined, "unknown"],
  ])("when the recorded entry is %s", (recordedEntry, entry) => {
    it(`tracks the page view with the ${entry} entry and the flow id`, () => {
      renderProposal(recordedEntry);

      expect(mocks.page).toHaveBeenCalledWith(
        "Wallet Connect Session Request",
        {
          dapp,
          url,
          network: requestedChains,
          entry,
          flow_id: flowId,
        },
      );
    });

    it.each([
      ["WC-Connect", /sessionProposal.connect/i, approvedChains],
      ["WC-Reject", /sessionProposal.reject/i, requestedChains],
    ])(
      `tracks %s with the ${entry} entry and the flow id`,
      async (button, name, network) => {
        const { user } = renderProposal(recordedEntry);

        await user.click(screen.getByRole("button", { name }));

        expect(mocks.track).toHaveBeenCalledWith("button_clicked", {
          button,
          page: "Wallet Connect Session Request",
          dapp,
          url,
          network,
          entry,
          flow_id: flowId,
        });
      },
    );
  });

  it("uses the entry of its own pairing topic", () => {
    const store = createStore();
    store.set(connectionEntriesAtom, { "another-topic": "scan" });
    render(
      <Provider store={store}>
        <SessionProposal proposal={proposal} />
      </Provider>,
    );

    expect(mocks.page).toHaveBeenCalledWith(
      "Wallet Connect Session Request",
      expect.objectContaining({ entry: "unknown", flow_id: flowId }),
    );
  });
});
