import { WalletConnectInit } from "@/components/WalletConnectInit";
import {
  loadingAtom,
  showBackToBrowserModalAtom,
} from "@/store/walletKit.store";
import { act, render, screen, waitFor } from "@/tests/test.utils";
import { createStore, Provider } from "jotai";
import { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockOnConnect, mockNavigate } = vi.hoisted(() => ({
  mockOnConnect: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock("@/hooks/useConnect", () => ({
  useConnect: () => ({ onConnect: mockOnConnect }),
}));

vi.mock("@/hooks/useWalletConnect", () => ({
  default: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

type SearchUpdater = (search: Record<string, unknown>) => unknown;

const wcUri =
  "wc:7f6e504bfad60b485450578e05678ed3e8e8c4751d3c6160be17160d63ec90f9@2?relay-protocol=irn&symKey=587d5484ce2a2a6ee3ba1962fdd7e8588e06200c46823bd18fbd67def96ad303";

describe("WalletConnectInit", () => {
  let store: ReturnType<typeof createStore>;

  const renderInit = (props: ComponentProps<typeof WalletConnectInit>) =>
    render(
      <Provider store={store}>
        <WalletConnectInit {...props} />
      </Provider>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    store = createStore();
    mockNavigate.mockResolvedValue(undefined);
  });

  it("connects with the deeplink entry when opened with a uri", async () => {
    let resolveConnect: () => void = () => undefined;
    mockOnConnect.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveConnect = resolve;
      }),
    );

    renderInit({ initialURI: wcUri });

    expect(mockOnConnect).toHaveBeenCalledWith(new URL(wcUri), "deeplink");
    expect(store.get(loadingAtom)).toBe(true);

    await act(async () => {
      resolveConnect();
      await Promise.resolve();
    });

    await waitFor(() => expect(store.get(loadingAtom)).toBe(false));
  });

  it("clears the uri without connecting when it has no pathname", () => {
    renderInit({ initialURI: "wc:" });

    expect(mockOnConnect).not.toHaveBeenCalled();
    const { search } = mockNavigate.mock.calls[0][0] as {
      search: SearchUpdater;
    };
    expect(search({ uri: "wc:", lang: "en" })).toEqual({ lang: "en" });
  });

  it("clears an invalid uri and stops loading", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    renderInit({ initialURI: "not a url" });

    expect(mockOnConnect).not.toHaveBeenCalled();
    expect(store.get(loadingAtom)).toBe(false);
    const { search } = mockNavigate.mock.calls[0][0] as {
      search: SearchUpdater;
    };
    expect(search({ uri: "not a url", lang: "en" })).toEqual({ lang: "en" });
    expect(consoleError).toHaveBeenCalledWith(
      "Invalid initialURI: ",
      expect.any(TypeError),
    );
    consoleError.mockRestore();
  });

  it("opens the session detail when opened with a request", () => {
    renderInit({ initialRequestId: "42", initialSessionTopic: "topic" });

    expect(mockOnConnect).not.toHaveBeenCalled();
    expect(store.get(loadingAtom)).toBe(true);
    const { to, params, search } = mockNavigate.mock.calls[0][0] as {
      to: string;
      params: Record<string, string>;
      search: SearchUpdater;
    };
    expect(to).toBe("/detail/$topic");
    expect(params).toEqual({ topic: "topic" });
    expect(
      search({ requestId: "42", sessionTopic: "topic", lang: "en" }),
    ).toEqual({ lang: "en" });
  });

  it("does nothing without uri nor request", () => {
    renderInit({});

    expect(mockOnConnect).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows the back to browser modal and closes it", async () => {
    store.set(showBackToBrowserModalAtom, true);
    const { user } = renderInit({});

    await user.click(await screen.findByText("backToBrowserModal.message"));

    expect(store.get(showBackToBrowserModalAtom)).toBe(false);
  });
});
