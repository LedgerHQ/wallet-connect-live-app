import type { Web3Wallet } from "@walletconnect/web3wallet/dist/types/client";
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

export const acceptRequest = (
  web3wallet: Web3Wallet,
  topic: string,
  id: number,
  signedMessage: string,
) => {
  return web3wallet.respondSessionRequest({
    topic,
    response: {
      id,
      jsonrpc: "2.0",
      result: signedMessage,
    },
  });
};

export const rejectRequest = (
  web3wallet: Web3Wallet,
  topic: string,
  id: number,
  message: Errors,
  code = 5000,
) => {
  return web3wallet.respondSessionRequest({
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
