import {
  createAccountNotFound,
  createCurrencyNotFound,
  createNotImplementedByWallet,
  createPermissionDenied,
  RpcError,
  RpcErrorCode,
  ServerError,
} from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import {
  createSignRequestTracking,
  formatErrorMessage,
  getTrackingErrorFields,
  isSigningMethod,
  SignRequestEvent,
  type TrackEvent,
  UNKNOWN_ERROR,
} from "./signRequestTracker";
import { acceptRequest, Errors, rejectRequest } from "./utils";

const signRequest = {
  topic: "topic-1",
  id: 42,
  chainId: "eip155:1",
  method: "eth_signTransaction",
};

const requestProperties = {
  dapp: "Uniswap",
  url: "https://app.uniswap.org",
  network: "eip155:1",
  method: "eth_signTransaction",
  request_id: 42,
  entry: "scan",
  flow_id: "pairing-1",
};

describe("formatErrorMessage", () => {
  it.each([
    [Errors.userDecline, "user_rejected"],
    [Errors.txDeclined, "transaction_declined"],
    [Errors.msgDecline, "message_declined"],
    [Errors.unsupportedChains, "unsupported_chains"],
    [Errors.unsupportedMethods, "unsupported_methods"],
    [Errors.walletUpdateRequired, "wallet_update_required"],
  ])("maps %s to %s", (message, reason) => {
    expect(formatErrorMessage(message)).toBe(reason);
  });

  it("maps an unknown message to the unknown reason", () => {
    expect(formatErrorMessage("Something else")).toBe(UNKNOWN_ERROR);
  });
});

describe("getTrackingErrorFields", () => {
  it("maps a request validation error", () => {
    expect(getTrackingErrorFields(new ZodError([]))).toEqual({
      error: "ZodError",
    });
  });

  it.each([
    [
      createNotImplementedByWallet("transaction.sign"),
      "not_implemented_by_wallet",
    ],
    [createAccountNotFound("account-id"), "account_not_found"],
    [createCurrencyNotFound("currency-id"), "currency_not_found"],
    [createPermissionDenied("transaction.sign"), "permission_denied"],
  ])("maps a wallet server error to its code", (errorData, errorExtra) => {
    expect(getTrackingErrorFields(new ServerError(errorData))).toEqual({
      error: "ServerError",
      error_extra: errorExtra,
    });
  });

  it("maps a JSON-RPC error to its code name", () => {
    const error = new RpcError({
      code: RpcErrorCode.INVALID_PARAMS,
      message:
        "invalid params for 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    });

    expect(getTrackingErrorFields(error)).toEqual({
      error: "RpcError",
      error_extra: "invalid_params",
    });
  });

  it("maps a JSON-RPC error with an unknown code", () => {
    const error = new RpcError({
      code: -1 as RpcErrorCode,
      message: "unexpected",
    });

    expect(getTrackingErrorFields(error)).toEqual({
      error: "RpcError",
      error_extra: UNKNOWN_ERROR,
    });
  });

  it("maps an allowlisted wallet error name", () => {
    const error = Object.assign(new Error("User refused"), {
      name: "UserRefusedOnDevice",
    });

    expect(getTrackingErrorFields(error)).toEqual({
      error: "UserRefusedOnDevice",
    });
  });

  it("maps an error with a name outside the allowlist to unknown", () => {
    const error = Object.assign(new Error("Device locked"), {
      name: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    });

    expect(getTrackingErrorFields(error)).toEqual({ error: UNKNOWN_ERROR });
  });

  it.each([["a raw message"], [{ address: "tz1abc" }], [undefined]])(
    "maps a non-Error value to unknown",
    (error) => {
      expect(getTrackingErrorFields(error)).toEqual({ error: UNKNOWN_ERROR });
    },
  );
});

describe("isSigningMethod", () => {
  it.each([
    "personal_sign",
    "eth_sign",
    "eth_signTransaction",
    "eth_signTypedData",
    "eth_signTypedData_v3",
    "eth_signTypedData_v4",
    "eth_sendTransaction",
    "bip122_signMessage",
    "signMessage",
    "sendTransfer",
    "signPsbt",
    "solana_signTransaction",
    "solana_signMessage",
    "solana_signAllTransactions",
    "solana_signAndSendTransaction",
    "xrpl_signTransaction",
    "tezos_send",
    "tezos_sign",
    "cosmos_signAmino",
    "sui_signTransaction",
    "sui_signAndExecuteTransaction",
    "sui_signPersonalMessage",
  ])("accepts the signing method %s", (method) => {
    expect(isSigningMethod(method)).toBe(true);
  });

  it.each([
    "eth_accounts",
    "eth_requestAccounts",
    "getAccountAddresses",
    "solana_getAccounts",
    "tezos_getAccounts",
    "cosmos_getAccounts",
    "sui_getAccounts",
    "wallet_switchEthereumChain",
    "wallet_addEthereumChain",
    "unknown_method",
  ])("rejects the non-signing method %s", (method) => {
    expect(isSigningMethod(method)).toBe(false);
  });
});

describe("createSignRequestTracking", () => {
  const track = vi.fn<TrackEvent>();
  const sessionGet = vi.fn();
  const getEntry = vi.fn();
  const respondSessionRequest = vi.fn();
  const walletKit = {
    respondSessionRequest,
    updateSession: vi.fn(),
    engine: { signClient: { session: { get: sessionGet } } },
  } as unknown as IWalletKit;

  beforeEach(() => {
    vi.clearAllMocks();
    respondSessionRequest.mockResolvedValue("responded");
    sessionGet.mockReturnValue({
      pairingTopic: "pairing-1",
      peer: { metadata: { name: "Uniswap", url: "https://app.uniswap.org" } },
    });
    getEntry.mockImplementation((pairingTopic: string) =>
      pairingTopic === "pairing-1" ? "scan" : undefined,
    );
  });

  function trackedEvents() {
    return track.mock.calls.map(([eventName]) => eventName);
  }

  it("tracks the received request with the dApp and the network", () => {
    createSignRequestTracking(walletKit, track, getEntry).start(signRequest);

    expect(sessionGet).toHaveBeenCalledWith("topic-1");
    expect(track).toHaveBeenCalledWith(
      SignRequestEvent.received,
      requestProperties,
    );
  });

  it("reads the entry recorded for the pairing topic of the session", () => {
    createSignRequestTracking(walletKit, track, getEntry).start(signRequest);

    expect(getEntry).toHaveBeenCalledWith("pairing-1");
  });

  it("tracks an unknown entry when no entry was recorded for the pairing topic", () => {
    sessionGet.mockReturnValue({
      pairingTopic: "pairing-2",
      peer: { metadata: { name: "Uniswap", url: "https://app.uniswap.org" } },
    });

    createSignRequestTracking(walletKit, track, getEntry).start(signRequest);

    expect(track).toHaveBeenCalledWith(SignRequestEvent.received, {
      ...requestProperties,
      entry: "unknown",
      flow_id: "pairing-2",
    });
  });

  it("tracks an unknown entry and no flow id when the session is not found", () => {
    sessionGet.mockImplementation(() => {
      throw new Error("No matching key");
    });

    createSignRequestTracking(walletKit, track, getEntry).start(signRequest);

    expect(getEntry).not.toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith(SignRequestEvent.received, {
      ...requestProperties,
      dapp: undefined,
      url: undefined,
      entry: "unknown",
      flow_id: undefined,
    });
  });

  it("tracks a success and forwards the response to WalletKit", async () => {
    const tracker = createSignRequestTracking(walletKit, track, getEntry).start(
      signRequest,
    );

    const response = await acceptRequest(
      tracker.walletKit,
      "topic-1",
      42,
      "0x",
    );

    expect(response).toBe("responded");
    expect(respondSessionRequest).toHaveBeenCalledWith({
      topic: "topic-1",
      response: { id: 42, jsonrpc: "2.0", result: "0x" },
    });
    expect(track).toHaveBeenLastCalledWith(
      SignRequestEvent.succeeded,
      requestProperties,
    );
    expect(trackedEvents()).toEqual([
      SignRequestEvent.received,
      SignRequestEvent.succeeded,
    ]);
  });

  it("tracks a failure when a success cannot be sent and the request is then rejected", async () => {
    const tracker = createSignRequestTracking(walletKit, track, getEntry).start(
      signRequest,
    );
    respondSessionRequest.mockRejectedValueOnce(new Error("Relay error"));

    await expect(
      acceptRequest(tracker.walletKit, "topic-1", 42, "0x"),
    ).rejects.toThrow("Relay error");
    expect(trackedEvents()).toEqual([SignRequestEvent.received]);

    await rejectRequest(tracker.walletKit, "topic-1", 42, Errors.txDeclined);

    expect(trackedEvents()).toEqual([
      SignRequestEvent.received,
      SignRequestEvent.failed,
    ]);
    expect(track).toHaveBeenLastCalledWith(SignRequestEvent.failed, {
      ...requestProperties,
      response_message: "transaction_declined",
      response_code: 5000,
    });
  });

  it("keeps handling the request when tracking throws", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const trackingError = new Error("Analytics unavailable");
    track.mockImplementation(() => {
      throw trackingError;
    });
    const tracking = createSignRequestTracking(walletKit, track, getEntry);

    const tracker = tracking.start(signRequest);
    const response = await acceptRequest(
      tracker.walletKit,
      "topic-1",
      42,
      "0x",
    );
    tracking.expire(7);

    expect(response).toBe("responded");
    expect(respondSessionRequest).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledTimes(3);
    expect(consoleError).toHaveBeenCalledWith(
      "Sign request tracking failed",
      trackingError,
    );
    consoleError.mockRestore();
  });

  it("tracks a failure with its response message and response code", async () => {
    const tracker = createSignRequestTracking(walletKit, track, getEntry).start(
      signRequest,
    );

    await rejectRequest(
      tracker.walletKit,
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

  it("adds the error fields to a failure when an error is set", async () => {
    const tracker = createSignRequestTracking(walletKit, track, getEntry).start(
      signRequest,
    );

    tracker.setError(
      Object.assign(new Error("User refused"), {
        name: "UserRefusedOnDevice",
      }),
    );
    await rejectRequest(tracker.walletKit, "topic-1", 42, Errors.txDeclined);

    expect(track).toHaveBeenLastCalledWith(SignRequestEvent.failed, {
      ...requestProperties,
      response_message: "transaction_declined",
      response_code: 5000,
      error: "UserRefusedOnDevice",
    });
  });

  it("does not add the error message of an unknown error", async () => {
    const tracker = createSignRequestTracking(walletKit, track, getEntry).start(
      signRequest,
    );

    tracker.setError(new Error("Unsupported Tezos address: tz1abc"));
    await rejectRequest(tracker.walletKit, "topic-1", 42, Errors.txDeclined);

    expect(track).toHaveBeenLastCalledWith(SignRequestEvent.failed, {
      ...requestProperties,
      response_message: "transaction_declined",
      response_code: 5000,
      error: UNKNOWN_ERROR,
    });
  });

  it("tracks only the first outcome of a request", async () => {
    const tracking = createSignRequestTracking(walletKit, track, getEntry);
    const tracker = tracking.start(signRequest);

    await acceptRequest(tracker.walletKit, "topic-1", 42, "0x");
    await rejectRequest(tracker.walletKit, "topic-1", 42, Errors.txDeclined);

    expect(trackedEvents()).toEqual([
      SignRequestEvent.received,
      SignRequestEvent.succeeded,
    ]);
    expect(respondSessionRequest).toHaveBeenCalledTimes(2);
  });

  it("tracks the expiry of a pending request with its details", () => {
    const tracking = createSignRequestTracking(walletKit, track, getEntry);
    tracking.start(signRequest);

    tracking.expire(42);

    expect(track).toHaveBeenLastCalledWith(
      SignRequestEvent.expired,
      requestProperties,
    );
  });

  it("tracks the expiry of an unknown request with its id only", () => {
    createSignRequestTracking(walletKit, track, getEntry).expire(7);

    expect(track).toHaveBeenCalledWith(SignRequestEvent.expired, {
      request_id: 7,
    });
  });

  it("does not track a response after the request expired", async () => {
    const tracking = createSignRequestTracking(walletKit, track, getEntry);
    const tracker = tracking.start(signRequest);

    tracking.expire(42);
    await acceptRequest(tracker.walletKit, "topic-1", 42, "0x");

    expect(trackedEvents()).toEqual([
      SignRequestEvent.received,
      SignRequestEvent.expired,
    ]);
  });

  it("adds the error extra to a failure caused by a wallet server error", async () => {
    const tracker = createSignRequestTracking(walletKit, track, getEntry).start(
      signRequest,
    );

    tracker.setError(
      new ServerError(createNotImplementedByWallet("transaction.sign")),
    );
    await rejectRequest(tracker.walletKit, "topic-1", 42, Errors.txDeclined);

    expect(track).toHaveBeenLastCalledWith(SignRequestEvent.failed, {
      ...requestProperties,
      response_message: "transaction_declined",
      response_code: 5000,
      error: "ServerError",
      error_extra: "not_implemented_by_wallet",
    });
  });

  describe("with a non-signing method", () => {
    const queryRequest = { ...signRequest, method: "cosmos_getAccounts" };

    it("does not track the request or its success", async () => {
      const tracker = createSignRequestTracking(
        walletKit,
        track,
        getEntry,
      ).start(queryRequest);

      const response = await acceptRequest(
        tracker.walletKit,
        "topic-1",
        42,
        [],
      );

      expect(response).toBe("responded");
      expect(track).not.toHaveBeenCalled();
    });

    it("does not track a failure", async () => {
      const tracker = createSignRequestTracking(
        walletKit,
        track,
        getEntry,
      ).start(queryRequest);

      tracker.setError(new ZodError([]));
      await rejectRequest(tracker.walletKit, "topic-1", 42, Errors.txDeclined);

      expect(respondSessionRequest).toHaveBeenCalledTimes(1);
      expect(track).not.toHaveBeenCalled();
    });

    it("does not track its expiry", () => {
      const tracking = createSignRequestTracking(walletKit, track, getEntry);
      tracking.start(queryRequest);

      tracking.expire(42);

      expect(track).not.toHaveBeenCalled();
    });
  });

  it("gives handlers the other WalletKit members unchanged", () => {
    const tracker = createSignRequestTracking(walletKit, track, getEntry).start(
      signRequest,
    );

    expect(tracker.walletKit.updateSession).toBe(walletKit.updateSession);
    expect(tracker.walletKit.engine).toBe(walletKit.engine);
  });
});
