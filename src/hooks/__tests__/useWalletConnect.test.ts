import { createHookWrapper, type TestStore } from "@/tests/hook-test.utils";
import { renderHook, waitFor } from "@/tests/test.utils";
import { createStore } from "jotai";
import { enqueueSnackbar } from "notistack";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { handleBIP122Request } from "../requestHandlers/BIP122";
import { handleEIP155Request } from "../requestHandlers/EIP155";
import { handleXrpRequest } from "../requestHandlers/Ripple";
import { handleSolanaRequest } from "../requestHandlers/Solana";
import { handleWalletRequest } from "../requestHandlers/Wallet";
import { Errors, rejectRequest } from "../requestHandlers/utils";
import useAccounts from "../useAccounts";
import useWalletConnect from "../useWalletConnect";

vi.mock("@/store/walletKit.store", async () => {
  const { atom } = await import("jotai");
  return {
    coreAtom: atom(null),
    walletKitAtom: atom(null),
    connectionStatusAtom: atom("disconnected"),
    loadingAtom: atom(false),
    showBackToBrowserModalAtom: atom(false),
    verifyContextByTopicAtom: atom<Record<string, unknown>>({}),
    oneClickAuthPayloadAtom: atom(undefined),
  };
});

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

vi.mock("../requestHandlers/BIP122", () => ({
  handleBIP122Request: vi.fn(),
}));

vi.mock("../requestHandlers/EIP155", () => ({
  handleEIP155Request: vi.fn(),
}));

vi.mock("../requestHandlers/Ripple", () => ({
  handleXrpRequest: vi.fn(),
}));

vi.mock("../requestHandlers/Solana", () => ({
  handleSolanaRequest: vi.fn(),
}));

vi.mock("../requestHandlers/Wallet", () => ({
  handleWalletRequest: vi.fn(),
}));

vi.mock("../requestHandlers/utils", () => ({
  Errors: {
    unsupportedChains: { message: "unsupported" },
    txDeclined: { message: "declined" },
  },
  rejectRequest: vi.fn(),
}));

vi.mock("notistack", () => ({
  enqueueSnackbar: vi.fn(),
}));

vi.mock("@sentry/react", () => ({
  withScope: vi.fn((callback) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    callback({
      setContext: vi.fn(),
      setTag: vi.fn(),
      setFingerprint: vi.fn(),
    });
  }),
  captureException: vi.fn(),
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

import {
  walletAPIClientAtom,
  walletCapabilitiesAtom,
  walletInfoAtom,
} from "@/store/wallet-api.store";
import {
  connectionStatusAtom,
  coreAtom,
  loadingAtom,
  oneClickAuthPayloadAtom,
  showBackToBrowserModalAtom,
  verifyContextByTopicAtom,
  walletKitAtom,
} from "@/store/walletKit.store";

const { useNavigate } = await import("@tanstack/react-router");

const mockedUseAccounts = vi.mocked(useAccounts);
const mockedHandleWalletRequest = vi.mocked(handleWalletRequest);
const mockedHandleEIP155Request = vi.mocked(handleEIP155Request);
const mockedHandleBIP122Request = vi.mocked(handleBIP122Request);
const mockedHandleXrpRequest = vi.mocked(handleXrpRequest);
const mockedHandleSolanaRequest = vi.mocked(handleSolanaRequest);
const mockedRejectRequest = vi.mocked(rejectRequest);
const mockedUseNavigate = vi.mocked(useNavigate);

describe("useWalletConnect", () => {
  let store: TestStore;
  const navigateMock = vi.fn();

  const walletKitListeners = new Map<string, (...args: unknown[]) => void>();
  const relayerListeners = new Map<string, (...args: unknown[]) => void>();

  const clientMock = {};
  const accountsMock = [
    { id: "eth-1", address: "0x111", currency: "ethereum" },
  ];
  const sessionRecord = {
    namespaces: {
      bip122: {
        accounts: ["bip122:000000000019d6689c085ae165831e93:bc1qbtc"],
      },
    },
    peer: {
      metadata: {
        redirect: {
          universal: "https://react-app.walletconnect.com",
        },
      },
    },
  };

  const coreMock = {
    relayer: {
      connected: false,
      on: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
        relayerListeners.set(event, callback);
      }),
      off: vi.fn(),
    },
  };

  const walletKitMock = {
    on: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
      walletKitListeners.set(event, callback);
    }),
    off: vi.fn(),
    engine: {
      signClient: {
        session: {
          get: vi.fn(() => sessionRecord),
          getAll: vi.fn(() => []),
        },
        proposal: {
          getAll: vi.fn(() => []),
        },
      },
    },
  };

  const walletInfo = {
    wallet: { name: "ledger-live-desktop", version: "2.127.0" },
    tracking: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    walletKitListeners.clear();
    relayerListeners.clear();
    coreMock.relayer.connected = false;
    walletKitMock.engine.signClient.session.get.mockReturnValue(sessionRecord);
    window.open = vi.fn();

    store = createStore();
    store.set(coreAtom as never, coreMock);
    store.set(walletKitAtom as never, walletKitMock);
    store.set(walletAPIClientAtom as never, clientMock);
    store.set(walletInfoAtom as never, walletInfo);
    store.set(walletCapabilitiesAtom as never, ["transaction.signRaw"]);
    store.set(connectionStatusAtom as never, "disconnected");
    store.set(loadingAtom as never, false);
    store.set(showBackToBrowserModalAtom as never, false);
    store.set(verifyContextByTopicAtom as never, {});
    store.set(oneClickAuthPayloadAtom as never, undefined);

    mockedUseNavigate.mockReturnValue(navigateMock);
    mockedUseAccounts.mockReturnValue({
      data: accountsMock,
    } as ReturnType<typeof useAccounts>);

    mockedHandleWalletRequest.mockResolvedValue(undefined);
    mockedHandleEIP155Request.mockResolvedValue(undefined);
    mockedHandleBIP122Request.mockResolvedValue(undefined);
    mockedHandleXrpRequest.mockResolvedValue(undefined);
    mockedHandleSolanaRequest.mockResolvedValue(undefined);
    mockedRejectRequest.mockResolvedValue(undefined);
  });

  function mountHook() {
    return renderHook(() => useWalletConnect(), {
      wrapper: createHookWrapper(store),
    });
  }

  it("shows a connected notification when the relayer is already connected", () => {
    coreMock.relayer.connected = true;

    mountHook();

    expect(enqueueSnackbar).toHaveBeenCalledWith(
      "Connected to WalletConnect",
      expect.objectContaining({ connected: true }),
    );
  });

  it("handles session proposals by navigating to the proposal page", async () => {
    mountHook();

    walletKitListeners.get("session_proposal")?.({
      id: 12,
      params: { pairingTopic: "pairing-topic" },
      verifyContext: { verified: { origin: "https://app.example" } },
    });

    await waitFor(() => {
      const lastCall = navigateMock.mock.calls.at(-1)?.[0] as
        | { to?: string; params?: { id?: string } }
        | undefined;
      expect(lastCall).toEqual(
        expect.objectContaining({
          to: "/proposal/$id",
          params: { id: "12" },
        }),
      );
    });
  });

  it.each([
    {
      name: "wallet",
      chainId: "eip155:1",
      method: "wallet_getCapabilities",
      handler: () => mockedHandleWalletRequest,
    },
    {
      name: "eip155",
      chainId: "eip155:1",
      method: "personal_sign",
      handler: () => mockedHandleEIP155Request,
    },
    {
      name: "bip122",
      chainId: "bip122:000000000019d6689c085ae165831e93",
      method: "btc_getAccountAddresses",
      handler: () => mockedHandleBIP122Request,
    },
    {
      name: "xrpl",
      chainId: "xrpl:0",
      method: "xrpl_signTransaction",
      handler: () => mockedHandleXrpRequest,
    },
    {
      name: "solana",
      chainId: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
      method: "solana_signTransaction",
      handler: () => mockedHandleSolanaRequest,
    },
  ])(
    "dispatches $name requests to the correct handler",
    async ({ chainId, method, handler }) => {
      mountHook();

      walletKitListeners.get("session_request")?.({
        topic: "topic-1",
        id: 1,
        params: { chainId, request: { method, params: {} } },
        verifyContext: {},
      });

      await waitFor(() => {
        expect(handler()).toHaveBeenCalled();
      });
    },
  );

  it("rejects unsupported chains", async () => {
    mountHook();

    walletKitListeners.get("session_request")?.({
      topic: "topic-1",
      id: 9,
      params: {
        chainId: "cosmos:1",
        request: { method: "cosmos_signDirect", params: {} },
      },
      verifyContext: {},
    });

    await waitFor(() => {
      expect(mockedRejectRequest).toHaveBeenCalledWith(
        walletKitMock,
        "topic-1",
        9,
        Errors.unsupportedChains,
        5100,
      );
    });
  });

  it("shows an error toast and rejects the request when a handler fails", async () => {
    mockedHandleEIP155Request.mockRejectedValue(new ZodError([]));

    mountHook();

    walletKitListeners.get("session_request")?.({
      topic: "topic-1",
      id: 10,
      params: {
        chainId: "eip155:1",
        request: { method: "personal_sign", params: [] },
      },
      verifyContext: {},
    });

    await waitFor(() => {
      expect(enqueueSnackbar).toHaveBeenCalled();
      expect(mockedRejectRequest).toHaveBeenCalledWith(
        walletKitMock,
        "topic-1",
        10,
        Errors.txDeclined,
      );
      expect(window.open).toHaveBeenCalledWith(
        "https://react-app.walletconnect.com",
      );
    });
  });

  it("stores the one-click auth payload and navigates to the auth screen", async () => {
    mountHook();

    const payload = {
      topic: "topic-1",
      verifyContext: { verified: { origin: "https://app.example" } },
      params: {
        authPayload: {
          chains: ["eip155:1"],
          methods: ["personal_sign"],
        },
      },
    };

    walletKitListeners.get("session_authenticate")?.(payload);

    await waitFor(() => {
      expect(store.get(oneClickAuthPayloadAtom as never)).toEqual(payload);
      const lastCall = navigateMock.mock.calls.at(-1)?.[0] as
        | { to?: string }
        | undefined;
      expect(lastCall).toEqual(
        expect.objectContaining({ to: "/oneclickauth" }),
      );
    });
  });
});
