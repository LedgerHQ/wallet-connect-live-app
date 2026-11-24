import {
  RpcError,
  RpcErrorCode,
  ServerError,
} from "@ledgerhq/wallet-api-client";
import { getSdkError } from "@walletconnect/utils";
import { ZodError } from "zod";
import { CANCELED_ERROR_NAMES, Errors } from "../utils";
import type { SessionError } from "./types";

export const UNKNOWN_ERROR = "unknown";

const ERROR_MESSAGE_FORMATTED: Record<string, string> = {
  [Errors.userDecline]: "user_rejected",
  [Errors.txDeclined]: "transaction_declined",
  [Errors.msgDecline]: "message_declined",
  [Errors.unsupportedChains]: "unsupported_chains",
  [Errors.unsupportedMethods]: "unsupported_methods",
  [Errors.walletUpdateRequired]: "wallet_update_required",
  [getSdkError("USER_DISCONNECTED").message]: "user_disconnected",
};

export const formatErrorMessage = (message: string) =>
  ERROR_MESSAGE_FORMATTED[message] ?? UNKNOWN_ERROR;

const TRACKABLE_ERROR_NAMES: readonly string[] = [...CANCELED_ERROR_NAMES];

const getRpcCodeName = (error: RpcError) =>
  (RpcErrorCode[error.getCode()] as string | undefined)?.toLowerCase() ??
  UNKNOWN_ERROR;

export const toSessionError = (error: unknown): SessionError => {
  if (error instanceof ZodError) return { error: "ZodError" };
  if (error instanceof ServerError) {
    return { error: "ServerError", error_extra: error.getCode().toLowerCase() };
  }
  if (error instanceof RpcError) {
    return { error: "RpcError", error_extra: getRpcCodeName(error) };
  }
  if (error instanceof Error && TRACKABLE_ERROR_NAMES.includes(error.name)) {
    return { error: error.name };
  }
  return { error: UNKNOWN_ERROR };
};
