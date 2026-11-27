import {
  createAccountNotFound,
  createCurrencyNotFound,
  createNotImplementedByWallet,
  createPermissionDenied,
  RpcError,
  RpcErrorCode,
  ServerError,
} from "@ledgerhq/wallet-api-client";
import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { Errors } from "../utils";
import { formatErrorMessage, toSessionError, UNKNOWN_ERROR } from "./common";

describe("formatErrorMessage", () => {
  it.each([
    [Errors.userDecline, "user_rejected"],
    [Errors.txDeclined, "transaction_declined"],
    [Errors.msgDecline, "message_declined"],
    [Errors.unsupportedChains, "unsupported_chains"],
    [Errors.unsupportedMethods, "unsupported_methods"],
    [Errors.walletUpdateRequired, "wallet_update_required"],
    ["User disconnected.", "user_disconnected"],
  ])("maps %s to %s", (message, reason) => {
    expect(formatErrorMessage(message)).toBe(reason);
  });

  it("maps an unknown message to the unknown reason", () => {
    expect(formatErrorMessage("Something else")).toBe(UNKNOWN_ERROR);
  });
});

describe("toSessionError", () => {
  it("maps a request validation error", () => {
    expect(toSessionError(new ZodError([]))).toEqual({ error: "ZodError" });
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
    expect(toSessionError(new ServerError(errorData))).toEqual({
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

    expect(toSessionError(error)).toEqual({
      error: "RpcError",
      error_extra: "invalid_params",
    });
  });

  it("maps a JSON-RPC error with an unknown code", () => {
    const error = new RpcError({
      code: -1 as RpcErrorCode,
      message: "unexpected",
    });

    expect(toSessionError(error)).toEqual({
      error: "RpcError",
      error_extra: UNKNOWN_ERROR,
    });
  });

  it("maps an allowlisted wallet error name", () => {
    const error = Object.assign(new Error("User refused"), {
      name: "UserRefusedOnDevice",
    });

    expect(toSessionError(error)).toEqual({ error: "UserRefusedOnDevice" });
  });

  it("maps an error with a name outside the allowlist to unknown", () => {
    const error = Object.assign(new Error("Device locked"), {
      name: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    });

    expect(toSessionError(error)).toEqual({ error: UNKNOWN_ERROR });
  });

  it.each([["a raw message"], [{ address: "tz1abc" }], [undefined]])(
    "maps a non-Error value to unknown",
    (error) => {
      expect(toSessionError(error)).toEqual({ error: UNKNOWN_ERROR });
    },
  );
});
