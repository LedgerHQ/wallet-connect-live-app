import {
  EIP155_SIGNING_METHODS,
  type EIP155_REQUESTS,
} from "@/data/methods/EIP155Data.methods";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleEIP155Request } from "./EIP155";
import * as sendTransactionModule from "./eip155Handlers/sendTransaction";
import * as signMessageModule from "./eip155Handlers/signMessage";
import * as signTypedDataModule from "./eip155Handlers/signTypedData";
import * as utils from "./utils";

vi.mock("./utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./utils")>()),
  rejectRequest: vi.fn(),
}));

describe("Testing EIP155 request handler mapping", () => {
  const walletAPIClient = {} as WalletAPIClient;
  const walletKit = {} as IWalletKit;
  const topic = "topic";
  const id = 0;
  const chainId = "eip155:1";
  const accounts: Account[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call sign message when request method is eth_sign", async () => {
    const request: EIP155_REQUESTS = {
      method: EIP155_SIGNING_METHODS.ETH_SIGN,
      params: ["0x123", "0x68656c6c6f"],
    };

    const signMessageSpy = vi.spyOn(signMessageModule, "signMessage");
    signMessageSpy.mockImplementationOnce(() => Promise.resolve());

    await handleEIP155Request(
      request,
      topic,
      id,
      chainId,
      accounts,
      walletAPIClient,
      walletKit,
    );

    expect(signMessageSpy).toHaveBeenCalledTimes(1);
    expect(signMessageSpy).toHaveBeenCalledWith(
      request,
      topic,
      id,
      chainId,
      accounts,
      walletAPIClient,
      walletKit,
    );
  });

  it("should call sign message when request method is personal_sign", async () => {
    const request: EIP155_REQUESTS = {
      method: EIP155_SIGNING_METHODS.PERSONAL_SIGN,
      params: ["0x68656c6c6f", "0x123"],
    };

    const signMessageSpy = vi.spyOn(signMessageModule, "signMessage");
    signMessageSpy.mockImplementationOnce(() => Promise.resolve());

    await handleEIP155Request(
      request,
      topic,
      id,
      chainId,
      accounts,
      walletAPIClient,
      walletKit,
    );

    expect(signMessageSpy).toHaveBeenCalledTimes(1);
    expect(signMessageSpy).toHaveBeenCalledWith(
      request,
      topic,
      id,
      chainId,
      accounts,
      walletAPIClient,
      walletKit,
    );
  });

  it.each([
    EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA,
    EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3,
    EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4,
  ])("should call sign typed data when request method is %s", async (method) => {
    const request: EIP155_REQUESTS = {
      method,
      params: ["0x123", '{"hello":"world"}'],
    };

    const signTypedDataSpy = vi.spyOn(signTypedDataModule, "signTypedData");
    signTypedDataSpy.mockImplementationOnce(() => Promise.resolve());

    await handleEIP155Request(
      request,
      topic,
      id,
      chainId,
      accounts,
      walletAPIClient,
      walletKit,
    );

    expect(signTypedDataSpy).toHaveBeenCalledTimes(1);
    expect(signTypedDataSpy).toHaveBeenCalledWith(
      request,
      topic,
      id,
      chainId,
      accounts,
      walletAPIClient,
      walletKit,
    );
  });

  it.each([
    EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION,
    EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION,
  ])("should call send transaction when request method is %s", async (method) => {
    const request: EIP155_REQUESTS = {
      method,
      params: [
        {
          from: "0x123",
        },
      ],
    };

    const sendTransactionSpy = vi.spyOn(
      sendTransactionModule,
      "sendTransaction",
    );
    sendTransactionSpy.mockImplementationOnce(() => Promise.resolve());

    await handleEIP155Request(
      request,
      topic,
      id,
      chainId,
      accounts,
      walletAPIClient,
      walletKit,
    );

    expect(sendTransactionSpy).toHaveBeenCalledTimes(1);
    expect(sendTransactionSpy).toHaveBeenCalledWith(
      request,
      topic,
      id,
      chainId,
      accounts,
      walletAPIClient,
      walletKit,
    );
  });

  it("should reject unsupported methods with code 5101", async () => {
    await handleEIP155Request(
      {
        method: EIP155_SIGNING_METHODS.ETH_ACCOUNTS,
        params: [],
      } as unknown as never,
      topic,
      id,
      chainId,
      accounts,
      walletAPIClient,
      walletKit,
    );

    expect(utils.rejectRequest).toHaveBeenCalledTimes(1);
    expect(utils.rejectRequest).toHaveBeenCalledWith(
      walletKit,
      topic,
      id,
      utils.Errors.unsupportedMethods,
      5101,
    );
  });
});
