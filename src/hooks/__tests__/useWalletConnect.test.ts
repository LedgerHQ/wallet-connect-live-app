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
import { handleTezosRequest } from "../requestHandlers/Tezos";
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

vi.mock("../requestHandlers/Tezos", () => ({
  handleTezosRequest: vi.fn(),
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

vi.mock("react-i18next", () => ({
  useTranslation: vi.fn().mockReturnValue({ t: vi.fn() }) 
}));

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
import { useTranslation } from "react-i18next";

const { useNavigate } = await import("@tanstack/react-router");

const mockedUseAccounts = vi.mocked(useAccounts);
const mockedHandleWalletRequest = vi.mocked(handleWalletRequest);
const mockedHandleEIP155Request = vi.mocked(handleEIP155Request);
const mockedHandleBIP122Request = vi.mocked(handleBIP122Request);
const mockedHandleXrpRequest = vi.mocked(handleXrpRequest);
const mockedHandleSolanaRequest = vi.mocked(handleSolanaRequest);
const mockedHandleTezosRequest = vi.mocked(handleTezosRequest);
const mockedRejectRequest = vi.mocked(rejectRequest);
const mockedUseNavigate = vi.mocked(useNavigate);
const mockedTranslation = vi.mocked(useTranslation().t);

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
    mockedHandleTezosRequest.mockResolvedValue(undefined);
    mockedRejectRequest.mockResolvedValue(undefined);
  });

  function mountHook() {
    return renderHook(() => useWalletConnect(), {
      wrapper: createHookWrapper(store),
    });
  }

  it("shows a connected notification when the relayer is already connected", () => {
    mockedTranslation.mockReturnValueOnce("Connected to WalletConnect");
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

  it.each([
    { name: "canonical", chainId: "tezos:NetXdQprcVkpaWU" },
    { name: "taquito alias", chainId: "tezos:mainnet" },
  ])(
    "dispatches tezos requests ($name chain) when the capabilities are present",
    async ({ chainId }) => {
      store.set(walletCapabilitiesAtom as never, [
        "transaction.signRaw",
        "message.sign",
        "account.getPublicKey",
      ]);

      mountHook();

      walletKitListeners.get("session_request")?.({
        topic: "topic-1",
        id: 1,
        params: { chainId, request: { method: "tezos_send", params: {} } },
        verifyContext: {},
      });

      await waitFor(() => {
        expect(mockedHandleTezosRequest).toHaveBeenCalled();
      });
    },
  );

  it("rejects an unregistered tezos chain even when capabilities are present", async () => {
    store.set(walletCapabilitiesAtom as never, [
      "transaction.signRaw",
      "message.sign",
      "account.getPublicKey",
    ]);

    mountHook();

    walletKitListeners.get("session_request")?.({
      topic: "topic-1",
      id: 8,
      params: {
        chainId: "tezos:ghostnet",
        request: { method: "tezos_send", params: {} },
      },
      verifyContext: {},
    });

    await waitFor(() => {
      expect(mockedHandleTezosRequest).not.toHaveBeenCalled();
      expect(mockedRejectRequest).toHaveBeenCalledWith(
        walletKitMock,
        "topic-1",
        8,
        Errors.unsupportedChains,
        5100,
      );
    });
  });

  it("scopes tezos requests to the session-approved accounts", async () => {
    store.set(walletCapabilitiesAtom as never, [
      "transaction.signRaw",
      "message.sign",
      "account.getPublicKey",
    ]);

    const approved = { id: "tez-1", address: "tz1approved", currency: "tezos" };
    const unapproved = { id: "tez-2", address: "tz1other", currency: "tezos" };
    mockedUseAccounts.mockReturnValue({
      data: [approved, unapproved],
    } as ReturnType<typeof useAccounts>);
    walletKitMock.engine.signClient.session.get.mockReturnValue({
      ...sessionRecord,
      namespaces: {
        ...sessionRecord.namespaces,
        tezos: { accounts: ["tezos:NetXdQprcVkpaWU:tz1approved"] },
      },
    } as typeof sessionRecord);

    mountHook();

    walletKitListeners.get("session_request")?.({
      topic: "topic-1",
      id: 9,
      params: {
        chainId: "tezos:NetXdQprcVkpaWU",
        request: { method: "tezos_getAccounts", params: {} },
      },
      verifyContext: {},
    });

    await waitFor(() => {
      expect(mockedHandleTezosRequest).toHaveBeenCalled();
    });
    expect(mockedHandleTezosRequest.mock.calls[0][4]).toEqual([approved]);
  });

  it("rejects tezos requests when the capability gate is disabled", async () => {
    // Only transaction.signRaw is present (message.sign missing), so the gate is off.
    store.set(walletCapabilitiesAtom as never, ["transaction.signRaw"]);

    mountHook();

    walletKitListeners.get("session_request")?.({
      topic: "topic-1",
      id: 7,
      params: {
        chainId: "tezos:NetXdQprcVkpaWU",
        request: { method: "tezos_send", params: {} },
      },
      verifyContext: {},
    });

    await waitFor(() => {
      expect(mockedHandleTezosRequest).not.toHaveBeenCalled();
      expect(mockedRejectRequest).toHaveBeenCalledWith(
        walletKitMock,
        "topic-1",
        7,
        Errors.unsupportedChains,
        5100,
      );
    });
  });

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
