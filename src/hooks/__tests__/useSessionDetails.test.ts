import { createHookWrapper, type TestStore } from "@/tests/hook-test.utils";
import { act, renderHook, waitFor } from "@/tests/test.utils";
import { fetchBip122Addresses } from "@/utils/bip122";
import { Account } from "@ledgerhq/wallet-api-client";
import { createStore } from "jotai";
import { enqueueSnackbar } from "notistack";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useAccounts from "../useAccounts";
import useAnalytics from "../useAnalytics";
import { useSessionDetails } from "../useSessionDetails";
import { useSupportedNamespaces } from "../useSupportedNamespaces";

vi.mock("@/store/walletKit.store", async () => {
  const { atom } = await import("jotai");
  return {
    coreAtom: atom(null),
    walletKitAtom: atom(null),
    connectionStatusAtom: atom("disconnected"),
    loadingAtom: atom(false),
    showBackToBrowserModalAtom: atom(false),
    verifyContextByTopicAtom: atom({}),
    oneClickAuthPayloadAtom: atom(undefined),
  };
});

vi.mock("@/store/wallet-api.store", async () => {
  const { atom } = await import("jotai");
  return {
    walletAPIClientAtom: atom(null),
    walletInfoAtom: atom(null),
    walletCapabilitiesAtom: atom([]),
    transportAtom: atom(null),
    walletCurrenciesAtom: atom([]),
    walletCurrenciesByIdAtom: atom({}),
    walletUserIdAtom: atom(null),
  };
});

vi.mock("../useAccounts", () => ({
  default: vi.fn(),
}));

vi.mock("../useAnalytics", () => ({
  default: vi.fn(),
}));

vi.mock("../useSupportedNamespaces", () => ({
  useSupportedNamespaces: vi.fn(),
}));

vi.mock("@/utils/bip122", () => ({
  fetchBip122Addresses: vi.fn(),
}));

vi.mock("notistack", () => ({
  enqueueSnackbar: vi.fn(),
}));

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>(
    "@tanstack/react-router",
  );
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

import { walletAPIClientAtom } from "@/store/wallet-api.store";
import {
  showBackToBrowserModalAtom,
  walletKitAtom,
} from "@/store/walletKit.store";

const { useNavigate } = await import("@tanstack/react-router");

const mockedUseAccounts = vi.mocked(useAccounts);
const mockedUseAnalytics = vi.mocked(useAnalytics);
const mockedUseSupportedNamespaces = vi.mocked(useSupportedNamespaces);
const mockedFetchBip122Addresses = vi.mocked(fetchBip122Addresses);
const mockedUseNavigate = vi.mocked(useNavigate);

function makeAccount(id: string, currency: string, address: string): Account {
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

describe("useSessionDetails", () => {
  let store: TestStore;
  const navigateMock = vi.fn();
  const analyticsTrackMock = vi.fn();

  const firstEthereumAccount = makeAccount("eth-1", "ethereum", "0x111");
  const secondEthereumAccount = makeAccount("eth-2", "ethereum", "0x222");
  const bitcoinAccount = makeAccount("btc-1", "bitcoin", "bc1qbtc");

  const clientMock = {};
  const walletKitMock = {
    disconnectSession: vi.fn(),
    updateSession: vi.fn(),
    emitSessionEvent: vi.fn(),
    engine: {
      signClient: {
        session: { getAll: vi.fn().mockReturnValue([]) },
      },
    },
  };
  const buildSupportedNamespacesMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    store = createStore();
    store.set(walletKitAtom as never, walletKitMock);
    store.set(walletAPIClientAtom as never, clientMock);
    store.set(showBackToBrowserModalAtom as never, false);

    mockedUseNavigate.mockReturnValue(navigateMock);
    mockedUseAnalytics.mockReturnValue({ track: analyticsTrackMock } as never);
    mockedUseAccounts.mockReturnValue({
      data: [firstEthereumAccount, secondEthereumAccount, bitcoinAccount],
    } as ReturnType<typeof useAccounts>);
    mockedUseSupportedNamespaces.mockReturnValue({
      buildSupportedNamespaces: buildSupportedNamespacesMock,
      buildEip155Namespace: vi.fn(),
    });

    walletKitMock.disconnectSession.mockResolvedValue(undefined);
    walletKitMock.updateSession.mockResolvedValue(undefined);
    walletKitMock.emitSessionEvent.mockResolvedValue(undefined);
    mockedFetchBip122Addresses.mockResolvedValue([{ address: "bc1qpayment" }]);
    buildSupportedNamespacesMock.mockReturnValue({
      eip155: {
        accounts: ["eip155:1:0x111", "eip155:1:0x222"],
        methods: ["personal_sign"],
        events: ["accountsChanged"],
      },
    });
  });

  it("initializes session accounts, main account, and selected accounts from the session", async () => {
    const session = {
      topic: "topic-1",
      namespaces: {
        eip155: {
          chains: ["eip155:1"],
          methods: ["personal_sign"],
          events: ["accountsChanged"],
          accounts: ["eip155:1:0x111", "eip155:1:0x222"],
        },
      },
      requiredNamespaces: {},
      optionalNamespaces: {},
    } as never;

    const { result } = renderHook(() => useSessionDetails(session), {
      wrapper: createHookWrapper(store),
    });

    await waitFor(() => {
      expect(result.current.mainAccount?.id).toBe("eth-1");
    });

    expect(result.current.selectedAccounts).toEqual(["eth-1", "eth-2"]);
    expect(result.current.sessionAccounts).toEqual([
      ["ethereum", [firstEthereumAccount, secondEthereumAccount]],
    ]);
  });

  it("keeps the main account first when it is re-selected", async () => {
    const session = {
      topic: "topic-1",
      namespaces: {
        eip155: {
          chains: ["eip155:1"],
          methods: ["personal_sign"],
          events: ["accountsChanged"],
          accounts: ["eip155:1:0x111", "eip155:1:0x222"],
        },
      },
      requiredNamespaces: {},
      optionalNamespaces: {},
    } as never;

    const { result } = renderHook(() => useSessionDetails(session), {
      wrapper: createHookWrapper(store),
    });

    await waitFor(() => {
      expect(result.current.selectedAccounts).toEqual(["eth-1", "eth-2"]);
    });

    act(() => {
      result.current.handleClick("eth-1");
    });
    act(() => {
      result.current.handleClick("eth-1");
    });

    expect(result.current.selectedAccounts).toEqual(["eth-1", "eth-2"]);
  });

  it("shows an error when confirmEdition is called without selected accounts", async () => {
    const session = {
      topic: "topic-1",
      namespaces: {
        eip155: {
          chains: ["eip155:1"],
          methods: ["personal_sign"],
          events: ["accountsChanged"],
          accounts: ["eip155:1:0x111"],
        },
      },
      requiredNamespaces: {},
      optionalNamespaces: {},
    } as never;

    const { result } = renderHook(() => useSessionDetails(session), {
      wrapper: createHookWrapper(store),
    });

    await waitFor(() => {
      expect(result.current.selectedAccounts).toEqual(["eth-1"]);
    });

    act(() => {
      result.current.handleClick("eth-1");
    });

    await act(async () => {
      await result.current.confirmEdition();
    });

    expect(enqueueSnackbar).toHaveBeenCalledWith(
      "Please select at least one account",
      expect.objectContaining({ errorType: "Edit session error" }),
    );
    expect(walletKitMock.updateSession).not.toHaveBeenCalled();
  });

  it("updates the session with the chosen main account and navigates back to details", async () => {
    const session = {
      topic: "topic-1",
      namespaces: {
        eip155: {
          chains: ["eip155:1"],
          methods: ["personal_sign"],
          events: ["accountsChanged"],
          accounts: ["eip155:1:0x111", "eip155:1:0x222"],
        },
      },
      requiredNamespaces: {},
      optionalNamespaces: {},
    } as never;

    const { result } = renderHook(() => useSessionDetails(session), {
      wrapper: createHookWrapper(store),
    });

    await waitFor(() => {
      expect(result.current.mainAccount?.id).toBe("eth-1");
    });

    act(() => {
      result.current.setMainAccount(secondEthereumAccount);
    });

    await act(async () => {
      await result.current.confirmEdition();
    });

    expect(walletKitMock.updateSession).toHaveBeenCalledWith({
      topic: "topic-1",
      namespaces: {
        eip155: {
          accounts: ["eip155:1:0x222", "eip155:1:0x111"],
          methods: ["personal_sign"],
          events: ["accountsChanged"],
        },
      },
    });
    expect(navigateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "/detail/$topic/edit",
        to: "/detail/$topic",
        params: { topic: "topic-1" },
      }),
    );
  });

  it("disconnects the session, tracks analytics, and returns home", async () => {
    const session = {
      topic: "topic-1",
      namespaces: {
        eip155: {
          chains: ["eip155:1"],
          methods: ["personal_sign"],
          events: ["accountsChanged"],
          accounts: ["eip155:1:0x111"],
        },
      },
      requiredNamespaces: {},
      optionalNamespaces: {},
    } as never;

    const { result } = renderHook(() => useSessionDetails(session), {
      wrapper: createHookWrapper(store),
    });

    await act(async () => {
      result.current.handleDelete();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(walletKitMock.disconnectSession).toHaveBeenCalledWith({
        topic: "topic-1",
        reason: { code: 3, message: "Disconnect Session" },
      });
    });

    expect(analyticsTrackMock).toHaveBeenCalledWith("button_clicked", {
      button: "WC-Disconnect Session",
      page: "Wallet Connect Session Detail",
    });
    expect(navigateMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "/" }),
    );
  });

  it("switches accounts and emits BIP122 session events", async () => {
    const session = {
      topic: "topic-1",
      namespaces: {
        bip122: {
          chains: ["bip122:000000000019d6689c085ae165831e93"],
          methods: ["wallet_getCapabilities"],
          events: ["bip122_addressesChanged", "accountsChanged"],
          accounts: ["bip122:000000000019d6689c085ae165831e93:bc1qbtc"],
        },
      },
      requiredNamespaces: {},
      optionalNamespaces: {},
    };

    const { result } = renderHook(() => useSessionDetails(session as never), {
      wrapper: createHookWrapper(store),
    });

    await act(async () => {
      await result.current.handleSwitch(bitcoinAccount);
    });

    expect(walletKitMock.updateSession).toHaveBeenCalledWith({
      topic: "topic-1",
      namespaces: session.namespaces,
    });
    expect(walletKitMock.emitSessionEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: "topic-1",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        event: expect.objectContaining({
          name: "bip122_addressesChanged",
          data: [{ address: "bc1qpayment" }],
        }),
      }),
    );
    expect(walletKitMock.emitSessionEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: "topic-1",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        event: expect.objectContaining({
          name: "accountsChanged",
          data: ["bc1qbtc"],
        }),
      }),
    );
    expect(store.get(showBackToBrowserModalAtom as never)).toBe(true);
  });
});
