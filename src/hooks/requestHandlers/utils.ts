import type { IWalletKit } from "@reown/walletkit";
import { stripHexPrefix } from "@/utils/currencyFormatter/helpers";

export enum Errors {
  userDecline = "User rejected",
  txDeclined = "Transaction declined",
  msgDecline = "Message signed declined",
  unsupportedChains = "unsupportedChains",
  unsupportedMethods = "unsupportedMethods",
}

const hexReg = /^ *(0x)?([a-fA-F0-9]+) *$/;
export const formatMessage = (buffer: Buffer) => {
  const message = stripHexPrefix(
    hexReg.exec(buffer.toString()) ? buffer.toString() : buffer.toString("hex"),
  );
  return "0x" + message;
};

/**
 * Sends a successful response to a WalletKit session request.
 *
 * @template T - The shape of the result to send back
 *
 * @param walletKit - The instance of the WalletKit used to send the response
 * @param topic - The session topic identifying the connection
 * @param id - The request ID to respond to
 * @param result - The result payload to return to the requester (should match with WC spec)
 */
export const acceptRequest = <T>(
  walletKit: IWalletKit,
  topic: string,
  id: number,
  result: T,
) => {
  return walletKit.respondSessionRequest({
    topic,
    response: {
      id,
      jsonrpc: "2.0",
      result,
    },
  });
};

export const rejectRequest = (
  walletKit: IWalletKit,
  topic: string,
  id: number,
  message: Errors,
  code = 5000,
) => {
  return walletKit.respondSessionRequest({
    topic,
    response: {
      id,
      jsonrpc: "2.0",
      error: {
        code,
        message,
      },
    },
  });
};

const CANCELED_ERROR_MESSAGES = ["User cancelled", "Canceled by user"];
const CANCELED_ERROR_NAMES = ["UserRefusedOnDevice"];

export const isCanceledError = (error: unknown) => {
  return (
    error instanceof Error &&
    (CANCELED_ERROR_MESSAGES.includes(error.message) ||
      CANCELED_ERROR_NAMES.includes(error.name))
  );
};
