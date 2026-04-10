import { renderHook, act, waitFor } from "@/tests/test.utils";
import { createHookWrapper, type TestStore } from "@/tests/hook-test.utils";
import { Account } from "@ledgerhq/wallet-api-client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import sessionProposal from "@/data/mocks/sessionProposal.example.json";
import { useProposal } from "../useProposal/useProposal";
import useAccounts from "../useAccounts";
import useAnalytics from "../useAnalytics";
import { useSupportedNamespaces } from "../useSupportedNamespaces";
import { enqueueSnackbar } from "notistack";
import { fetchBip122Addresses } from "@/utils/bip122";
import { createStore } from "jotai";
import {
  buildApprovedNamespaces,
  buildAuthObject,
  populateAuthPayload,
} from "@walletconnect/utils";

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

vi.mock("@/store/recentConnectionAppsAtom", async () => {
  const { atom } = await import("jotai");
  return {
    sortedRecentConnectionAppsAtom: atom(null),
    recentConnectionAppsAtom: atom({}),
    initialValue: {},
  };
});

vi.mock("../useAccounts", async () => {
  const actual =
    await vi.importActual<typeof import("../useAccounts")>("../useAccounts");
  return {
    ...actual,
    default: vi.fn(),
  };
});

vi.mock("../useAnalytics", () => ({
  default: vi.fn(),
}));

vi.mock("../useSupportedNamespaces", () => ({
  useSupportedNamespaces: vi.fn(),
}));

vi.mock("@/utils/bip122", () => ({
  fetchBip122Addresses: vi.fn(),
}));

vi.mock("@walletconnect/utils", async () => {
  const actual =
    await vi.importActual<typeof import("@walletconnect/utils")>(
      "@walletconnect/utils",
    );
  return {
    ...actual,
    buildApprovedNamespaces: vi.fn(),
    buildAuthObject: vi.fn(),
    populateAuthPayload: vi.fn(),
  };
});

vi.mock("notistack", () => ({
  enqueueSnackbar: vi.fn(),
}));

vi.mock("@tanstack/react-router", async () => {
  const actual =
    await vi.importActual<typeof import("@tanstack/react-router")>(
      "@tanstack/react-router",
    );
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

import {
  walletKitAtom,
  showBackToBrowserModalAtom,
} from "@/store/walletKit.store";
import { walletAPIClientAtom } from "@/store/wallet-api.store";

const { useNavigate } = await import("@tanstack/react-router");

const mockedUseAccounts = vi.mocked(useAccounts);
const mockedUseAnalytics = vi.mocked(useAnalytics);
const mockedUseSupportedNamespaces = vi.mocked(useSupportedNamespaces);
const mockedFetchBip122Addresses = vi.mocked(fetchBip122Addresses);
const mockedBuildApprovedNamespaces = vi.mocked(buildApprovedNamespaces);
const mockedBuildAuthObject = vi.mocked(buildAuthObject);
const mockedPopulateAuthPayload = vi.mocked(populateAuthPayload);
const mockedUseNavigate = vi.mocked(useNavigate);

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

describe("useProposal", () => {
  let store: TestStore;
  const navigateMock = vi.fn();
  const analyticsTrackMock = vi.fn();

  const account = makeAccount("eth-1", "ethereum", "0x111");
  const bitcoinAccount = makeAccount("btc-1", "bitcoin", "bc1qbtc");

  const clientMock = {
    message: { sign: vi.fn() },
    account: { request: vi.fn() },
  };

  const walletKitMock = {
    approveSession: vi.fn(),
    approveSessionAuthenticate: vi.fn(),
    rejectSession: vi.fn(),
    rejectSessionAuthenticate: vi.fn(),
    emitSessionEvent: vi.fn(),
    formatAuthMessage: vi.fn(),
    engine: {
      signClient: {
        session: { getAll: vi.fn().mockReturnValue([]) },
      },
    },
  };

  const buildSupportedNamespacesMock = vi.fn();
  const buildEip155NamespaceMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.open = vi.fn();

    store = createStore();
    store.set(walletKitAtom as never, walletKitMock);
    store.set(walletAPIClientAtom as never, clientMock);
    store.set(showBackToBrowserModalAtom as never, false);

    mockedUseNavigate.mockReturnValue(navigateMock);
    mockedUseAnalytics.mockReturnValue({ track: analyticsTrackMock } as never);
    mockedUseAccounts.mockReturnValue({
      data: [account, bitcoinAccount],
    } as ReturnType<typeof useAccounts>);
    mockedUseSupportedNamespaces.mockReturnValue({
      buildSupportedNamespaces: buildSupportedNamespacesMock,
      buildEip155Namespace: buildEip155NamespaceMock,
    });

    buildSupportedNamespacesMock.mockReturnValue({ eip155: { accounts: [] } });
    buildEip155NamespaceMock.mockReturnValue({
      chains: ["eip155:1"],
      methods: ["personal_sign"],
      accounts: ["eip155:1:0x111"],
    });
    mockedBuildApprovedNamespaces.mockReturnValue({
      eip155: {
        accounts: ["eip155:1:0x111"],
        methods: ["personal_sign"],
        events: ["accountsChanged"],
      },
    } as never);
    walletKitMock.approveSession.mockResolvedValue({
      topic: "topic-1",
      namespaces: {
        eip155: {
          accounts: ["eip155:1:0x111"],
          methods: ["personal_sign"],
          events: ["accountsChanged"],
        },
      },
      peer: { metadata: { name: "React App" } },
    });
    walletKitMock.approveSessionAuthenticate.mockResolvedValue({
      session: {
        topic: "topic-1",
        peer: { metadata: { name: "React App" } },
      },
    });
    walletKitMock.rejectSession.mockResolvedValue(undefined);
    walletKitMock.rejectSessionAuthenticate.mockResolvedValue(undefined);
    walletKitMock.emitSessionEvent.mockResolvedValue(undefined);
    walletKitMock.formatAuthMessage.mockReturnValue("message-to-sign");
    clientMock.message.sign.mockResolvedValue(Buffer.from("signature"));
    clientMock.account.request.mockResolvedValue(account);
    mockedFetchBip122Addresses.mockResolvedValue([
      { address: "bc1qpayment" },
    ]);
    mockedPopulateAuthPayload.mockReturnValue({ aud: "audience" } as never);
    mockedBuildAuthObject.mockReturnValue({ iss: "eip155:1:0x111" } as never);
  });

  it("toggles selected accounts through handleClick", () => {
    const { result } = renderHook(() => useProposal(sessionProposal), {
      wrapper: createHookWrapper(store),
    });

    act(() => {
      result.current.handleClick("eth-1");
    });

    expect(result.current.selectedAccounts).toEqual(["eth-1"]);

    act(() => {
      result.current.handleClick("eth-1");
    });

    expect(result.current.selectedAccounts).toEqual([]);
  });

  it("approves a session, emits BIP122 addresses, and navigates to the detail page", async () => {
    walletKitMock.approveSession.mockResolvedValue({
      topic: "topic-1",
      namespaces: {
        bip122: {
          events: ["bip122_addressesChanged"],
          accounts: [
            "bip122:000000000019d6689c085ae165831e93:bc1qbtc",
            "bip122:000000000019d6689c085ae165831e93:bc1qother",
          ],
        },
      },
      peer: { metadata: { name: "React App" } },
    });

    const proposal = {
      ...sessionProposal,
      proposer: {
        ...sessionProposal.proposer,
        metadata: {
          ...sessionProposal.proposer.metadata,
          redirect: {
            universal: "https://react-app.walletconnect.com",
          },
        },
      },
    };

    const { result } = renderHook(() => useProposal(proposal), {
      wrapper: createHookWrapper(store),
    });

    await act(async () => {
      await result.current.approveSession();
    });

    expect(walletKitMock.approveSession).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "/detail/$topic",
        params: { topic: "topic-1" },
      }),
    );
    expect(walletKitMock.emitSessionEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: "topic-1",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        event: expect.objectContaining({
          name: "bip122_addressesChanged",
          data: [{ address: "bc1qpayment" }],
        }),
        chainId: "bip122:000000000019d6689c085ae165831e93",
      }),
    );
    expect(window.open).toHaveBeenCalledWith(
      "https://react-app.walletconnect.com",
    );
  });

  it("emits BIP122 addresses only once per chain", async () => {
    walletKitMock.approveSession.mockResolvedValue({
      topic: "topic-1",
      namespaces: {
        bip122: {
          events: ["bip122_addressesChanged"],
          accounts: [
            "bip122:000000000019d6689c085ae165831e93:bc1qbtc",
            "bip122:000000000019d6689c085ae165831e93:bc1qother",
          ],
        },
      },
      peer: { metadata: { name: "React App" } },
    });

    const { result } = renderHook(() => useProposal(sessionProposal), {
      wrapper: createHookWrapper(store),
    });

    await act(async () => {
      await result.current.approveSession();
    });

    expect(mockedFetchBip122Addresses).toHaveBeenCalledTimes(1);
  });

  it("signs and approves one-click auth sessions", async () => {
    const oneClickAuthPayload = {
      id: 42,
      topic: "auth-topic",
      verifyContext: { verified: { origin: "https://app.example" } },
      params: {
        authPayload: {
          domain: "app.example",
          aud: "https://app.example",
          nonce: "nonce",
          type: "eip4361",
          chains: ["eip155:1"],
          statement: "Sign in",
          methods: ["personal_sign"],
        },
      },
    } as never;

    const { result } = renderHook(
      () => useProposal(sessionProposal, oneClickAuthPayload),
      { wrapper: createHookWrapper(store) },
    );

    await act(async () => {
      await result.current.approveSessionAuthenticate();
    });

    expect(walletKitMock.approveSessionAuthenticate).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "/detail/$topic",
        params: { topic: "topic-1" },
      }),
    );
  });

  it("rejects a proposal and navigates home", async () => {
    const proposal = {
      ...sessionProposal,
      proposer: {
        ...sessionProposal.proposer,
        metadata: {
          ...sessionProposal.proposer.metadata,
          redirect: {},
        },
      },
    };

    const { result } = renderHook(() => useProposal(proposal), {
      wrapper: createHookWrapper(store),
    });

    await act(async () => {
      await result.current.rejectSession();
    });

    expect(walletKitMock.rejectSession).toHaveBeenCalledWith({
      id: proposal.id,
      reason: { code: 5000, message: "USER_REJECTED_METHODS" },
    });
    expect(navigateMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "/" }),
    );
    expect(store.get(showBackToBrowserModalAtom as never)).toBe(true);
  });

  it("rejects one-click auth requests with the payload id", async () => {
    const oneClickAuthPayload = {
      id: 77,
      topic: "auth-topic",
      params: {
        authPayload: {
          chains: ["eip155:1"],
          methods: ["personal_sign"],
        },
      },
    } as never;

    const { result } = renderHook(
      () => useProposal(sessionProposal, oneClickAuthPayload),
      { wrapper: createHookWrapper(store) },
    );

    await act(async () => {
      await result.current.rejectSessionAuthenticate();
    });

    expect(walletKitMock.rejectSessionAuthenticate).toHaveBeenCalledWith({
      id: 77,
      reason: { code: 5000, message: "USER_REJECTED_METHODS" },
    });
    expect(navigateMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "/" }),
    );
  });

  it("adds a new account once and selects it", async () => {
    const newAccount = makeAccount("new-account", "ethereum", "0x999");
    clientMock.account.request.mockResolvedValue(newAccount);

    const { result } = renderHook(() => useProposal(sessionProposal), {
      wrapper: createHookWrapper(store),
    });

    await act(async () => {
      await result.current.addNewAccount("ethereum");
    });

    await waitFor(() => {
      expect(result.current.selectedAccounts).toEqual(["new-account"]);
    });

    await act(async () => {
      await result.current.addNewAccount("ethereum");
    });

    expect(result.current.selectedAccounts).toEqual(["new-account"]);
  });

  it("swallows user-cancelled account creation errors", async () => {
    clientMock.account.request.mockRejectedValue(new Error("Canceled by user"));

    const { result } = renderHook(() => useProposal(sessionProposal), {
      wrapper: createHookWrapper(store),
    });

    await act(async () => {
      await result.current.addNewAccounts(["ethereum", "bitcoin"]);
    });

    expect(enqueueSnackbar).not.toHaveBeenCalled();
    expect(result.current.selectedAccounts).toEqual([]);
  });
});
