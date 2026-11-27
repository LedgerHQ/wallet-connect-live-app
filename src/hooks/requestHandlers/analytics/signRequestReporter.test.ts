import { beforeEach, describe, expect, it, vi } from "vitest";
import { Errors } from "../utils";
import {
  isSigningMethod,
  SignRequestEvent,
  signRequestReporter,
} from "./signRequestReporter";
import type { SafeAnalyticsCallback } from "./types";

const properties = {
  dapp: "Uniswap",
  url: "https://app.uniswap.org",
  network: "eip155:1",
  method: "eth_signTransaction",
  request_id: 42,
};

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

describe("signRequestReporter", () => {
  const safeSendAnalytics = vi.fn<SafeAnalyticsCallback>();

  beforeEach(() => {
    safeSendAnalytics.mockReset();
  });

  it("tracks only signing methods", () => {
    expect(signRequestReporter.supportsMethod("personal_sign")).toBe(true);
    expect(signRequestReporter.supportsMethod("eth_accounts")).toBe(false);
  });

  it("tracks the received request", () => {
    signRequestReporter.onStart(safeSendAnalytics, properties);

    expect(safeSendAnalytics).toHaveBeenCalledWith(
      SignRequestEvent.received,
      properties,
    );
  });

  it("tracks a success", () => {
    signRequestReporter.onResponse(
      safeSendAnalytics,
      { id: 42, jsonrpc: "2.0", result: "0x" },
      properties,
    );

    expect(safeSendAnalytics).toHaveBeenCalledWith(
      SignRequestEvent.succeeded,
      properties,
    );
  });

  it("tracks a failure with the request, response and error fields", () => {
    signRequestReporter.onResponse(
      safeSendAnalytics,
      {
        id: 42,
        jsonrpc: "2.0",
        error: { code: 5000, message: Errors.txDeclined },
      },
      properties,
      { error: "ServerError", error_extra: "not_implemented_by_wallet" },
    );

    expect(safeSendAnalytics).toHaveBeenCalledWith(SignRequestEvent.failed, {
      ...properties,
      response_message: "transaction_declined",
      response_code: 5000,
      error: "ServerError",
      error_extra: "not_implemented_by_wallet",
    });
  });

  it("tracks a failure without error fields", () => {
    signRequestReporter.onResponse(
      safeSendAnalytics,
      {
        id: 42,
        jsonrpc: "2.0",
        error: { code: 5101, message: Errors.unsupportedMethods },
      },
      properties,
    );

    expect(safeSendAnalytics).toHaveBeenCalledWith(SignRequestEvent.failed, {
      ...properties,
      response_message: "unsupported_methods",
      response_code: 5101,
    });
  });

  it("tracks the expiry", () => {
    signRequestReporter.onExpire(safeSendAnalytics, properties);

    expect(safeSendAnalytics).toHaveBeenCalledWith(
      SignRequestEvent.expired,
      properties,
    );
  });
});
