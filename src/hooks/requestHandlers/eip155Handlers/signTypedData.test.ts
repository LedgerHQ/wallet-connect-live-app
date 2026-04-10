import { EIP155_SIGNING_METHODS } from "@/data/methods/EIP155Data.methods";
import * as utils from "@/hooks/requestHandlers/utils";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signTypedData } from "./signTypedData";

vi.mock("@/hooks/requestHandlers/utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/requestHandlers/utils")>()),
  acceptRequest: vi.fn(),
  rejectRequest: vi.fn(),
}));

describe("Testing sign typed data on EIP155", () => {
  const account = {
    id: "account-id",
    address: "0xAbC123",
    currency: "ethereum",
  } as Account;
  const walletKit = {} as IWalletKit;
  const topic = "topic";
  const id = 0;
  const chainId = "eip155:1";
  const message = '{"hello":"walletconnect"}';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA,
    EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3,
    EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4,
  ])("should sign and accept %s requests", async (method) => {
    const sign = vi.fn(() => Promise.resolve(Buffer.from("abcd", "hex")));
    const walletAPIClient = {
      message: {
        sign,
      },
    } as unknown as WalletAPIClient;

    await signTypedData(
      {
        method,
        params: [account.address, message],
      },
      topic,
      id,
      chainId,
      [account],
      walletAPIClient,
      walletKit,
    );

    expect(sign).toHaveBeenCalledTimes(1);
    expect(sign).toHaveBeenCalledWith(
      account.id,
      Buffer.from(message),
    );
    expect(utils.acceptRequest).toHaveBeenCalledTimes(1);
    expect(utils.acceptRequest).toHaveBeenCalledWith(
      walletKit,
      topic,
      id,
      "0xabcd",
    );
    expect(utils.rejectRequest).not.toHaveBeenCalled();
  });

  it("should reject the request when no matching account is found", async () => {
    const sign = vi.fn();
    const walletAPIClient = {
      message: {
        sign,
      },
    } as unknown as WalletAPIClient;

    await signTypedData(
      {
        method: EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4,
        params: [account.address, message],
      },
      topic,
      id,
      chainId,
      [],
      walletAPIClient,
      walletKit,
    );

    expect(sign).not.toHaveBeenCalled();
    expect(utils.acceptRequest).not.toHaveBeenCalled();
    expect(utils.rejectRequest).toHaveBeenCalledTimes(1);
    expect(utils.rejectRequest).toHaveBeenCalledWith(
      walletKit,
      topic,
      id,
      utils.Errors.msgDecline,
    );
  });

  it("should reject the request when the user cancels signing", async () => {
    const sign = vi.fn(() => Promise.reject(new Error("Canceled by user")));
    const walletAPIClient = {
      message: {
        sign,
      },
    } as unknown as WalletAPIClient;

    await signTypedData(
      {
        method: EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4,
        params: [account.address, message],
      },
      topic,
      id,
      chainId,
      [account],
      walletAPIClient,
      walletKit,
    );

    expect(sign).toHaveBeenCalledTimes(1);
    expect(utils.acceptRequest).not.toHaveBeenCalled();
    expect(utils.rejectRequest).toHaveBeenCalledTimes(1);
    expect(utils.rejectRequest).toHaveBeenCalledWith(
      walletKit,
      topic,
      id,
      utils.Errors.msgDecline,
    );
  });
});
