import {
  createNotImplementedByWallet,
  ServerError,
} from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { reportSessionError } from "../requestHandlers/analytics/sessionErrorReporter";
import { SignRequestEvent } from "../requestHandlers/analytics/signRequestReporter";
import type { TrackEvent } from "../requestHandlers/analytics/types";
import { acceptRequest, Errors, rejectRequest } from "../requestHandlers/utils";
import { useSessionRequestAnalytics } from "../useSessionRequestAnalytics";

const signRequest = {
  topic: "topic-1",
  id: 42,
  chainId: "eip155:1",
  method: "eth_signTransaction",
};

const queryRequest = { ...signRequest, id: 43, method: "eth_accounts" };

const requestProperties = {
  dapp: "Uniswap",
  url: "https://app.uniswap.org",
  network: "eip155:1",
  method: "eth_signTransaction",
  request_id: 42,
};

describe("useSessionRequestAnalytics", () => {
  const track = vi.fn<TrackEvent>();
  const sessionGet = vi.fn();
  const respondSessionRequest = vi.fn();
  const walletKit = {
    respondSessionRequest,
    updateSession: vi.fn(),
    engine: { signClient: { session: { get: sessionGet } } },
  } as unknown as IWalletKit;

  beforeEach(() => {
    vi.clearAllMocks();
    track.mockReset();
    respondSessionRequest.mockResolvedValue("responded");
    sessionGet.mockReturnValue({
      peer: { metadata: { name: "Uniswap", url: "https://app.uniswap.org" } },
    });
  });

  function mount(trackEvent: TrackEvent = track) {
    return renderHook(
      ({ trackEvent }) => useSessionRequestAnalytics(walletKit, trackEvent),
      { initialProps: { trackEvent } },
    );
  }

  function sentAnalyticsEvents(mock = track) {
    return mock.mock.calls.map(([eventName]) => eventName);
  }

  it("tracks the received request with the dApp and the network", () => {
    mount().result.current.startSessionRequestAnalytics(signRequest);

    expect(sessionGet).toHaveBeenCalledWith("topic-1");
    expect(track).toHaveBeenCalledWith(
      SignRequestEvent.received,
      requestProperties,
    );
  });

  it("tracks a success and forwards the response to WalletKit", async () => {
    const { analyticsWalletKit } =
      mount().result.current.startSessionRequestAnalytics(signRequest);

    const response = await acceptRequest(
      analyticsWalletKit,
      "topic-1",
      42,
      "0x",
    );

    expect(response).toBe("responded");
    expect(respondSessionRequest).toHaveBeenCalledWith({
      topic: "topic-1",
      response: { id: 42, jsonrpc: "2.0", result: "0x" },
    });
    expect(sentAnalyticsEvents()).toEqual([
      SignRequestEvent.received,
      SignRequestEvent.succeeded,
    ]);
    expect(track).toHaveBeenLastCalledWith(
      SignRequestEvent.succeeded,
      requestProperties,
    );
  });

  it("tracks a failure with its request properties, response message and code", async () => {
    const { analyticsWalletKit } =
      mount().result.current.startSessionRequestAnalytics(signRequest);

    await rejectRequest(
      analyticsWalletKit,
      "topic-1",
      42,
      Errors.unsupportedMethods,
      5101,
    );

    expect(track).toHaveBeenLastCalledWith(SignRequestEvent.failed, {
      ...requestProperties,
      response_message: "unsupported_methods",
      response_code: 5101,
    });
  });

  it.each([
    [
      Object.assign(new Error("User refused"), { name: "UserRefusedOnDevice" }),
      { error: "UserRefusedOnDevice" },
    ],
    [
      new ServerError(createNotImplementedByWallet("transaction.sign")),
      { error: "ServerError", error_extra: "not_implemented_by_wallet" },
    ],
    [new ZodError([]), { error: "ZodError" }],
    [new Error("Unsupported Tezos address: tz1abc"), { error: "unknown" }],
  ])("adds the error fields to a failure", async (error, errorFields) => {
    const { analyticsWalletKit } =
      mount().result.current.startSessionRequestAnalytics(signRequest);

    reportSessionError(analyticsWalletKit, error);
    await rejectRequest(analyticsWalletKit, "topic-1", 42, Errors.txDeclined);

    expect(track).toHaveBeenLastCalledWith(SignRequestEvent.failed, {
      ...requestProperties,
      response_message: "transaction_declined",
      response_code: 5000,
      ...errorFields,
    });
  });

  it("tracks a failure when a success cannot be sent and the request is then rejected", async () => {
    const { analyticsWalletKit } =
      mount().result.current.startSessionRequestAnalytics(signRequest);
    respondSessionRequest.mockRejectedValueOnce(new Error("Relay error"));

    await expect(
      acceptRequest(analyticsWalletKit, "topic-1", 42, "0x"),
    ).rejects.toThrow("Relay error");
    expect(sentAnalyticsEvents()).toEqual([SignRequestEvent.received]);

    await rejectRequest(analyticsWalletKit, "topic-1", 42, Errors.txDeclined);

    expect(sentAnalyticsEvents()).toEqual([
      SignRequestEvent.received,
      SignRequestEvent.failed,
    ]);
  });

  it.each([
    [
      "a success",
      (walletKit: IWalletKit) => acceptRequest(walletKit, "topic-1", 42, "0x"),
    ],
    [
      "a rejection",
      (walletKit: IWalletKit) =>
        rejectRequest(walletKit, "topic-1", 42, Errors.txDeclined),
    ],
  ])(
    "tracks a disconnection when %s cannot be sent because the session was deleted",
    async (_, respond) => {
      const { result } = mount();
      const { analyticsWalletKit } =
        result.current.startSessionRequestAnalytics(signRequest);
      reportSessionError(
        analyticsWalletKit,
        Object.assign(new Error("User refused"), {
          name: "UserRefusedOnDevice",
        }),
      );
      sessionGet.mockImplementation(() => {
        throw new Error("No matching key. session: topic-1");
      });
      respondSessionRequest.mockRejectedValueOnce(
        new Error("No matching key. session topic doesn't exist: topic-1"),
      );

      await expect(respond(analyticsWalletKit)).rejects.toThrow(
        "No matching key",
      );
      result.current.expireSessionRequestAnalytics(42);

      expect(sentAnalyticsEvents()).toEqual([
        SignRequestEvent.received,
        SignRequestEvent.failed,
      ]);
      expect(track).toHaveBeenLastCalledWith(SignRequestEvent.failed, {
        ...requestProperties,
        response_message: "user_disconnected",
        response_code: 6000,
        error: "UserRefusedOnDevice",
      });
    },
  );

  it("does not track a request whose session was deleted after it settled", async () => {
    const { analyticsWalletKit } =
      mount().result.current.startSessionRequestAnalytics(signRequest);

    await acceptRequest(analyticsWalletKit, "topic-1", 42, "0x");
    sessionGet.mockImplementation(() => {
      throw new Error("No matching key. session: topic-1");
    });
    respondSessionRequest.mockRejectedValueOnce(new Error("No matching key"));
    await expect(
      rejectRequest(analyticsWalletKit, "topic-1", 42, Errors.txDeclined),
    ).rejects.toThrow("No matching key");

    expect(sentAnalyticsEvents()).toEqual([
      SignRequestEvent.received,
      SignRequestEvent.succeeded,
    ]);
  });

  it("tracks only the first outcome of a request", async () => {
    const { analyticsWalletKit } =
      mount().result.current.startSessionRequestAnalytics(signRequest);

    await acceptRequest(analyticsWalletKit, "topic-1", 42, "0x");
    await rejectRequest(analyticsWalletKit, "topic-1", 42, Errors.txDeclined);

    expect(sentAnalyticsEvents()).toEqual([
      SignRequestEvent.received,
      SignRequestEvent.succeeded,
    ]);
    expect(respondSessionRequest).toHaveBeenCalledTimes(2);
  });

  it("tracks the expiry of a pending request with its details", () => {
    const { result } = mount();
    result.current.startSessionRequestAnalytics(signRequest);

    result.current.expireSessionRequestAnalytics(42);

    expect(track).toHaveBeenLastCalledWith(
      SignRequestEvent.expired,
      requestProperties,
    );
  });

  it("does not track the expiry of an unknown request", () => {
    mount().result.current.expireSessionRequestAnalytics(7);

    expect(track).not.toHaveBeenCalled();
  });

  it("tracks an expiry only once", () => {
    const { result } = mount();
    result.current.startSessionRequestAnalytics(signRequest);

    result.current.expireSessionRequestAnalytics(42);
    result.current.expireSessionRequestAnalytics(42);

    expect(sentAnalyticsEvents()).toEqual([
      SignRequestEvent.received,
      SignRequestEvent.expired,
    ]);
  });

  it("does not track a response after the request expired", async () => {
    const { result } = mount();
    const { analyticsWalletKit } =
      result.current.startSessionRequestAnalytics(signRequest);

    result.current.expireSessionRequestAnalytics(42);
    await acceptRequest(analyticsWalletKit, "topic-1", 42, "0x");

    expect(sentAnalyticsEvents()).toEqual([
      SignRequestEvent.received,
      SignRequestEvent.expired,
    ]);
  });

  it("does not track the expiry of a request that already got a response", async () => {
    const { result } = mount();
    const { analyticsWalletKit } =
      result.current.startSessionRequestAnalytics(signRequest);

    await acceptRequest(analyticsWalletKit, "topic-1", 42, "0x");
    result.current.expireSessionRequestAnalytics(42);

    expect(sentAnalyticsEvents()).toEqual([
      SignRequestEvent.received,
      SignRequestEvent.succeeded,
    ]);
  });

  it("keeps a newer request with the same id pending when the older one settles", async () => {
    const { result } = mount();
    const first = result.current.startSessionRequestAnalytics(signRequest);
    result.current.startSessionRequestAnalytics(signRequest);

    await acceptRequest(first.analyticsWalletKit, "topic-1", 42, "0x");
    result.current.expireSessionRequestAnalytics(42);

    expect(sentAnalyticsEvents()).toEqual([
      SignRequestEvent.received,
      SignRequestEvent.received,
      SignRequestEvent.succeeded,
      SignRequestEvent.expired,
    ]);
  });

  describe("with a non-signing method", () => {
    it("does not track the request, its success or its expiry", async () => {
      const { result } = mount();
      const { analyticsWalletKit } =
        result.current.startSessionRequestAnalytics(queryRequest);

      const response = await acceptRequest(
        analyticsWalletKit,
        "topic-1",
        43,
        [],
      );
      result.current.expireSessionRequestAnalytics(43);

      expect(response).toBe("responded");
      expect(track).not.toHaveBeenCalled();
    });

    it("does not track a failure", async () => {
      const { analyticsWalletKit } =
        mount().result.current.startSessionRequestAnalytics(queryRequest);

      reportSessionError(analyticsWalletKit, new ZodError([]));
      await rejectRequest(analyticsWalletKit, "topic-1", 43, Errors.txDeclined);

      expect(respondSessionRequest).toHaveBeenCalledTimes(1);
      expect(track).not.toHaveBeenCalled();
    });
  });

  it("does not leak reporters from a signing request into a later non-signing one", async () => {
    const { result } = mount();
    const sign = result.current.startSessionRequestAnalytics(signRequest);
    const query = result.current.startSessionRequestAnalytics(queryRequest);

    await acceptRequest(query.analyticsWalletKit, "topic-1", 43, []);
    await acceptRequest(sign.analyticsWalletKit, "topic-1", 42, "0x");

    expect(sentAnalyticsEvents()).toEqual([
      SignRequestEvent.received,
      SignRequestEvent.succeeded,
    ]);
  });

  it("keeps handling the request when analytics throws", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const analyticsError = new Error("Analytics unavailable");
    track.mockImplementation(() => {
      throw analyticsError;
    });
    const { result } = mount();

    const { analyticsWalletKit } =
      result.current.startSessionRequestAnalytics(signRequest);
    const response = await acceptRequest(
      analyticsWalletKit,
      "topic-1",
      42,
      "0x",
    );

    expect(response).toBe("responded");
    expect(respondSessionRequest).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledTimes(2);
    expect(consoleError).toHaveBeenCalledWith(
      "Session request analytics failed",
      analyticsError,
    );
    consoleError.mockRestore();
  });

  it("gives handlers the other WalletKit members unchanged", () => {
    const { analyticsWalletKit } =
      mount().result.current.startSessionRequestAnalytics(signRequest);

    expect(analyticsWalletKit.updateSession).toBe(walletKit.updateSession);
    expect(analyticsWalletKit.engine).toBe(walletKit.engine);
  });

  describe("across renders", () => {
    it("returns stable callbacks", () => {
      const { result, rerender } = mount();
      const first = result.current;

      rerender({ trackEvent: vi.fn<TrackEvent>() });

      expect(result.current.startSessionRequestAnalytics).toBe(
        first.startSessionRequestAnalytics,
      );
      expect(result.current.expireSessionRequestAnalytics).toBe(
        first.expireSessionRequestAnalytics,
      );
    });

    it("keeps pending requests and uses the latest track", () => {
      const { result, rerender } = mount();
      result.current.startSessionRequestAnalytics(signRequest);
      const latestTrack = vi.fn<TrackEvent>();

      rerender({ trackEvent: latestTrack });
      result.current.expireSessionRequestAnalytics(42);

      expect(sentAnalyticsEvents()).toEqual([SignRequestEvent.received]);
      expect(latestTrack).toHaveBeenCalledWith(
        SignRequestEvent.expired,
        requestProperties,
      );
    });
  });
});
