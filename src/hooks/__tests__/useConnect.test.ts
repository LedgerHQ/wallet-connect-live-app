import { connectionEntriesAtom } from "@/store/connectionEntry.store";
import { createHookWrapper, type TestStore } from "@/tests/hook-test.utils";
import { act, renderHook } from "@/tests/test.utils";
import type { UseNavigateResult } from "@tanstack/react-router";
import { createStore } from "jotai";
import { enqueueSnackbar } from "notistack";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useConnect } from "../useConnect";

const { mockPair, mockGetPairings } = vi.hoisted(() => ({
  mockPair: vi.fn(),
  mockGetPairings: vi.fn(),
}));

vi.mock("@/store/walletKit.store", async () => {
  const { atom } = await import("jotai");
  return {
    coreAtom: atom({
      pairing: { pair: mockPair, getPairings: mockGetPairings },
    }),
  };
});

vi.mock("notistack", () => ({
  enqueueSnackbar: vi.fn(),
}));

const topic =
  "7f6e504bfad60b485450578e05678ed3e8e8c4751d3c6160be17160d63ec90f9";
const wcUri = `wc:${topic}@2?relay-protocol=irn&symKey=587d5484ce2a2a6ee3ba1962fdd7e8588e06200c46823bd18fbd67def96ad303`;
const unsupportedUri = `wc:${topic}@1?bridge=https%3A%2F%2Fbridge.walletconnect.org&key=abc`;

type Navigate = UseNavigateResult<"/">;
type SearchUpdater = (search: Record<string, unknown>) => unknown;

describe("useConnect", () => {
  let store: TestStore;
  let navigate: ReturnType<typeof vi.fn>;

  const renderUseConnect = () =>
    renderHook(() => useConnect(navigate as unknown as Navigate), {
      wrapper: createHookWrapper(store),
    }).result.current;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetPairings.mockReturnValue([]);
    store = createStore();
    navigate = vi.fn().mockResolvedValue(undefined);
  });

  it.each(["scan", "paste", "deeplink"] as const)(
    "records the %s entry for the pairing topic and starts pairing",
    async (entry) => {
      const { onConnect } = renderUseConnect();

      await act(() => onConnect(new URL(wcUri), entry));

      expect(store.get(connectionEntriesAtom)).toEqual({ [topic]: entry });
      expect(mockPair).toHaveBeenCalledWith({ uri: wcUri });
    },
  );

  it("keeps the entries of active pairings and drops the others", async () => {
    store.set(connectionEntriesAtom, {
      "active-topic": "paste",
      "expired-topic": "deeplink",
    });
    mockGetPairings.mockReturnValue([{ topic: "active-topic" }]);
    const { onConnect } = renderUseConnect();

    await act(() => onConnect(new URL(wcUri), "scan"));

    expect(store.get(connectionEntriesAtom)).toEqual({
      "active-topic": "paste",
      [topic]: "scan",
    });
  });

  it("persists the recorded entries", async () => {
    const { onConnect } = renderUseConnect();

    await act(() => onConnect(new URL(wcUri), "paste"));

    expect(JSON.parse(localStorage.getItem("connectionEntries") ?? "")).toEqual(
      { [topic]: "paste" },
    );
  });

  it("records the entry of a Ledger Wallet wrapped uri", async () => {
    const { onConnect } = renderUseConnect();
    const wrapped = new URL(
      `ledgerlive:////wc?uri=${encodeURIComponent(wcUri)}`,
    );

    await act(() => onConnect(wrapped, "deeplink"));

    expect(store.get(connectionEntriesAtom)).toEqual({ [topic]: "deeplink" });
    expect(mockPair).toHaveBeenCalledWith({ uri: wcUri });
  });

  it.each([
    ["a Ledger Wallet uri without the wc path", "ledgerlive://other?uri=x"],
    ["a Ledger Wallet uri without uri param", "ledgerlive:////wc"],
    [
      "a Ledger Wallet uri wrapping an invalid url",
      "ledgerlive:////wc?uri=bad",
    ],
    ["an unknown protocol", "https://example.com"],
  ])("ignores %s", async (_, uri) => {
    const { onConnect } = renderUseConnect();

    await act(() => onConnect(new URL(uri), "paste"));

    expect(store.get(connectionEntriesAtom)).toEqual({});
    expect(mockPair).not.toHaveBeenCalled();
    expect(enqueueSnackbar).not.toHaveBeenCalled();
  });

  it("clears the uri search param once the pairing is started", async () => {
    const { onConnect } = renderUseConnect();

    await act(() => onConnect(new URL(wcUri), "paste"));

    expect(navigate).toHaveBeenCalledTimes(1);
    const { search } = navigate.mock.calls[0][0] as { search: SearchUpdater };
    expect(search({ uri: wcUri, theme: "dark" })).toEqual({ theme: "dark" });
  });

  it("redirects to the protocol not supported page for v1 uris", async () => {
    const { onConnect } = renderUseConnect();

    await act(() => onConnect(new URL(unsupportedUri), "scan"));

    expect(mockPair).not.toHaveBeenCalled();
    expect(store.get(connectionEntriesAtom)).toEqual({});
    const { to, search } = navigate.mock.calls[0][0] as {
      to: string;
      search: SearchUpdater;
    };
    expect(to).toBe("/protocol-not-supported");
    expect(search({ uri: unsupportedUri, lang: "en" })).toEqual({
      lang: "en",
    });
  });

  it("notifies the user when the pairing fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const error = new Error("pairing failed");
    mockPair.mockImplementationOnce(() => {
      throw error;
    });
    const { onConnect } = renderUseConnect();

    await act(() => onConnect(new URL(wcUri), "paste"));

    expect(enqueueSnackbar).toHaveBeenCalledWith(
      "pairing failed",
      expect.objectContaining({ variant: "errorNotification" }),
    );
    expect(consoleError).toHaveBeenCalledWith(error);
    expect(navigate).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });
});
