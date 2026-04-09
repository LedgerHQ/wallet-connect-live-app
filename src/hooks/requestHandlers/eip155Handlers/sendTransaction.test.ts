import { EIP155_SIGNING_METHODS } from "@/data/methods/EIP155Data.methods";
import * as utils from "@/hooks/requestHandlers/utils";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendTransaction } from "./sendTransaction";

vi.mock("@/hooks/requestHandlers/utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/requestHandlers/utils")>()),
  acceptRequest: vi.fn(),
  rejectRequest: vi.fn(),
}));

describe("Testing send transaction on EIP155", () => {
  const account = {
    id: "account-id",
    address: "0xAbC123",
    currency: "ethereum",
  } as Account;
  const walletKit = {} as IWalletKit;
  const topic = "topic";
  const id = 0;
  const chainId = "eip155:1";
  const params = [
    {
      from: account.address,
      to: "0x0000000000000000000000000000000000000001",
      value: "0x1",
      gas: "0x5208",
      gasPrice: "0x3b9aca00",
      nonce: "0x0",
      data: "0x",
    },
  ] as const;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION,
    EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION,
  ])("should sign and accept %s requests", async (method) => {
    const signAndBroadcast = vi.fn(() => Promise.resolve("0xhash"));
    const walletAPIClient = {
      transaction: {
        signAndBroadcast,
      },
    } as unknown as WalletAPIClient;

    await sendTransaction(
      {
        method,
        params: [...params],
      },
      topic,
      id,
      chainId,
      [account],
      walletAPIClient,
      walletKit,
    );

    expect(signAndBroadcast).toHaveBeenCalledTimes(1);
    expect(signAndBroadcast).toHaveBeenCalledWith(
      account.id,
      expect.any(Object),
    );
    expect(utils.acceptRequest).toHaveBeenCalledTimes(1);
    expect(utils.acceptRequest).toHaveBeenCalledWith(
      walletKit,
      topic,
      id,
      "0xhash",
    );
    expect(utils.rejectRequest).not.toHaveBeenCalled();
  });

  it("should reject the request when no matching account is found", async () => {
    const signAndBroadcast = vi.fn();
    const walletAPIClient = {
      transaction: {
        signAndBroadcast,
      },
    } as unknown as WalletAPIClient;

    await sendTransaction(
      {
        method: EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION,
        params: [...params],
      },
      topic,
      id,
      chainId,
      [],
      walletAPIClient,
      walletKit,
    );

    expect(signAndBroadcast).not.toHaveBeenCalled();
    expect(utils.acceptRequest).not.toHaveBeenCalled();
    expect(utils.rejectRequest).toHaveBeenCalledTimes(1);
    expect(utils.rejectRequest).toHaveBeenCalledWith(
      walletKit,
      topic,
      id,
      utils.Errors.txDeclined,
    );
  });

  it("should reject the request when the user cancels the transaction", async () => {
    const signAndBroadcast = vi.fn(() =>
      Promise.reject(new Error("User cancelled")),
    );
    const walletAPIClient = {
      transaction: {
        signAndBroadcast,
      },
    } as unknown as WalletAPIClient;

    await sendTransaction(
      {
        method: EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION,
        params: [...params],
      },
      topic,
      id,
      chainId,
      [account],
      walletAPIClient,
      walletKit,
    );

    expect(signAndBroadcast).toHaveBeenCalledTimes(1);
    expect(utils.acceptRequest).not.toHaveBeenCalled();
    expect(utils.rejectRequest).toHaveBeenCalledTimes(1);
    expect(utils.rejectRequest).toHaveBeenCalledWith(
      walletKit,
      topic,
      id,
      utils.Errors.txDeclined,
    );
  });
});
