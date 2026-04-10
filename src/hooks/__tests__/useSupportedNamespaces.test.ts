import { renderHook } from "@/tests/test.utils";
import { createHookWrapper, type TestStore } from "@/tests/hook-test.utils";
import { Account, WalletInfo } from "@ledgerhq/wallet-api-client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import sessionProposal from "@/data/mocks/sessionProposal.example.json";
import { useSupportedNamespaces } from "../useSupportedNamespaces";
import useAccounts from "../useAccounts";
import { formatAccountsByChain } from "../useProposal/util";
import { createStore } from "jotai";

vi.mock("@/store/wallet-api.store", async () => {
  const { atom } = await import("jotai");
  return {
    walletAPIClientAtom: atom(null),
    walletInfoAtom: atom(null),
    walletCapabilitiesAtom: atom<string[]>([]),
    transportAtom: atom(null),
    walletCurrenciesAtom: atom([]),
    walletCurrenciesByIdAtom: atom({}),
    walletUserIdAtom: atom(null),
  };
});

vi.mock("../useAccounts", () => ({
  default: vi.fn(),
}));

vi.mock("../useProposal/util", () => ({
  formatAccountsByChain: vi.fn(),
}));

import {
  walletAPIClientAtom,
  walletInfoAtom,
  walletCapabilitiesAtom,
} from "@/store/wallet-api.store";

const mockedUseAccounts = vi.mocked(useAccounts);
const mockedFormatAccountsByChain = vi.mocked(formatAccountsByChain);

const baseWalletInfo: WalletInfo["result"] = {
  wallet: {
    name: "ledger-live-desktop",
    version: "2.127.0",
  },
  tracking: false,
};

function makeAccount(
  id: string,
  currency: string,
  address: string,
): Account {
  return {
    id,
    name: id,
    currency,
    address,
    balance: 0 as never,
    spendableBalance: 0 as never,
    blockHeight: 0,
    lastSyncDate: new Date("2024-01-01T00:00:00.000Z"),
  };
}

describe("useSupportedNamespaces", () => {
  let store: TestStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createStore();

    store.set(walletAPIClientAtom as never, {});
    store.set(walletInfoAtom as never, baseWalletInfo);
    store.set(walletCapabilitiesAtom as never, []);

    mockedUseAccounts.mockReturnValue(
      { data: [] } as unknown as ReturnType<typeof useAccounts>,
    );
  });

  it("returns only selected EIP155 accounts and supported methods/events", () => {
    const firstEth = makeAccount("eth-1", "ethereum", "0x111");
    const secondEth = makeAccount("eth-2", "ethereum", "0x222");

    mockedUseAccounts.mockReturnValue({
      data: [firstEth, secondEth],
    } as ReturnType<typeof useAccounts>);
    mockedFormatAccountsByChain.mockReturnValue([
      {
        chain: "ethereum",
        displayName: "Ethereum",
        isSupported: true,
        isRequired: true,
        accounts: [firstEth, secondEth],
      },
    ]);

    const proposal = {
      ...sessionProposal,
      requiredNamespaces: {
        eip155: {
          methods: ["eth_sendTransaction", "wallet_getCapabilities", "bad_method"],
          chains: ["eip155:1"],
          events: ["chainChanged"],
        },
      },
      optionalNamespaces: {
        eip155: {
          methods: ["personal_sign", "wallet_getCapabilities", "still_bad"],
          chains: ["eip155:1"],
          events: ["accountsChanged"],
        },
      },
    };

    const { result } = renderHook(
      () => useSupportedNamespaces(proposal, ["eth-2"]),
      { wrapper: createHookWrapper(store) },
    );

    const namespace = result.current.buildEip155Namespace(
      proposal.requiredNamespaces,
      proposal.optionalNamespaces,
    );

    expect(namespace).toEqual({
      chains: ["eip155:1"],
      methods: ["eth_sendTransaction", "personal_sign"],
      events: ["chainChanged", "accountsChanged"],
      accounts: ["eip155:1:0x222"],
    });
  });

  it("omits XRPL and Solana namespaces when support gates are disabled", () => {
    const eth = makeAccount("eth-1", "ethereum", "0x111");
    const btc = makeAccount("btc-1", "bitcoin", "bc1qxyz");
    const xrp = makeAccount("xrp-1", "ripple", "rXYZ");
    const sol = makeAccount("sol-1", "solana", "So111");

    mockedUseAccounts.mockReturnValue({
      data: [eth, btc, xrp, sol],
    } as ReturnType<typeof useAccounts>);

    store.set(walletInfoAtom as never, {
      wallet: { name: "ledger-live-desktop", version: "2.125.0" },
      tracking: false,
    } satisfies WalletInfo["result"]);

    mockedFormatAccountsByChain.mockReturnValue([
      {
        chain: "ethereum",
        displayName: "Ethereum",
        isSupported: true,
        isRequired: true,
        accounts: [eth],
      },
      {
        chain: "bitcoin",
        displayName: "Bitcoin",
        isSupported: true,
        isRequired: false,
        accounts: [btc],
      },
      {
        chain: "ripple",
        displayName: "Ripple",
        isSupported: true,
        isRequired: false,
        accounts: [xrp],
      },
      {
        chain: "solana",
        displayName: "Solana",
        isSupported: true,
        isRequired: false,
        accounts: [sol],
      },
    ]);

    const proposal = {
      ...sessionProposal,
      requiredNamespaces: {
        eip155: {
          methods: ["personal_sign"],
          chains: ["eip155:1"],
          events: ["accountsChanged"],
        },
      },
      optionalNamespaces: {
        bip122: {
          methods: ["wallet_getCapabilities"],
          chains: ["bip122:000000000019d6689c085ae165831e93"],
          events: ["bip122_addressesChanged"],
        },
        xrpl: {
          methods: ["xrpl_signTransaction"],
          chains: ["xrpl:0"],
          events: ["accountsChanged"],
        },
        solana: {
          methods: ["solana_signTransaction"],
          chains: ["solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"],
          events: ["accountsChanged"],
        },
      },
    };

    const { result } = renderHook(
      () => useSupportedNamespaces(proposal, ["eth-1", "btc-1", "xrp-1", "sol-1"]),
      { wrapper: createHookWrapper(store) },
    );

    expect(result.current.buildSupportedNamespaces(proposal)).toEqual({
      eip155: {
        chains: ["eip155:1"],
        methods: ["personal_sign"],
        events: ["accountsChanged"],
        accounts: ["eip155:1:0x111"],
      },
      bip122: {
        chains: ["bip122:000000000019d6689c085ae165831e93"],
        methods: [],
        events: ["bip122_addressesChanged"],
        accounts: ["bip122:000000000019d6689c085ae165831e93:bc1qxyz"],
      },
    });
  });

  it("includes XRPL and legacy Solana namespaces when support gates are enabled", () => {
    const xrp = makeAccount("xrp-1", "ripple", "rXYZ");
    const sol = makeAccount("sol-1", "solana", "So111");

    mockedUseAccounts.mockReturnValue({
      data: [xrp, sol],
    } as ReturnType<typeof useAccounts>);

    store.set(walletCapabilitiesAtom as never, ["transaction.signRaw"]);

    mockedFormatAccountsByChain.mockReturnValue([
      {
        chain: "ripple",
        displayName: "Ripple",
        isSupported: true,
        isRequired: false,
        accounts: [xrp],
      },
      {
        chain: "solana",
        displayName: "Solana",
        isSupported: true,
        isRequired: false,
        accounts: [sol],
      },
    ]);

    const proposal = {
      ...sessionProposal,
      requiredNamespaces: {
        xrpl: {
          methods: ["xrpl_signTransaction"],
          chains: ["xrpl:0"],
          events: ["accountsChanged"],
        },
        solana: {
          methods: ["solana_signTransaction"],
          chains: ["solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ"],
          events: ["accountsChanged"],
        },
      },
      optionalNamespaces: {},
    };

    const { result } = renderHook(
      () => useSupportedNamespaces(proposal, ["xrp-1", "sol-1"]),
      { wrapper: createHookWrapper(store) },
    );

    expect(result.current.buildSupportedNamespaces(proposal)).toEqual({
      xrpl: {
        chains: ["xrpl:0"],
        methods: ["xrpl_signTransaction"],
        events: ["accountsChanged"],
        accounts: ["xrpl:0:rXYZ"],
      },
      solana: {
        chains: ["solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ"],
        methods: ["solana_signTransaction"],
        events: ["accountsChanged"],
        accounts: ["solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ:So111"],
      },
    });
  });
});
