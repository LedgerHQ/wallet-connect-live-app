import { EIP155_SIGNING_METHODS } from "@/data/methods/EIP155Data.methods";
import * as utils from "@/hooks/requestHandlers/utils";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signTransaction } from "./signTransaction";

vi.mock("@/hooks/requestHandlers/utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/requestHandlers/utils")>()),
  acceptRequest: vi.fn(),
  rejectRequest: vi.fn(),
}));

describe("Testing sign transaction on EIP155", () => {
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

  it("should sign and accept signTransaction requests", async () => {
    const sign = vi.fn(() => Promise.resolve(Buffer.from("deadbeef")));
    const signAndBroadcast = vi.fn();
    const walletAPIClient = {
      transaction: {
        sign,
        signAndBroadcast,
      },
    } as unknown as WalletAPIClient;

    await signTransaction(
      {
        method: EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION,
        params: [...params],
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
      expect.any(Object),
    );
    expect(signAndBroadcast).not.toHaveBeenCalled();
    expect(utils.acceptRequest).toHaveBeenCalledTimes(1);
    expect(utils.acceptRequest).toHaveBeenCalledWith(
      walletKit,
      topic,
      id,
      "0xdeadbeef",
    );
    expect(utils.rejectRequest).not.toHaveBeenCalled();
  });

  it("should throw when used with a non-sign transaction method", async () => {
    const walletAPIClient = {
      transaction: {
        sign: vi.fn(),
      },
    } as unknown as WalletAPIClient;

    await expect(
      signTransaction(
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
      ),
    ).rejects.toThrow(
      "Method eth_sendTransaction from request can not be used to sign transaction",
    );
  });

  it("should reject the request when no matching account is found", async () => {
    const sign = vi.fn();
    const walletAPIClient = {
      transaction: {
        sign,
      },
    } as unknown as WalletAPIClient;

    await signTransaction(
      {
        method: EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION,
        params: [...params],
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
      utils.Errors.txDeclined,
    );
  });

  it("should reject the request when the user cancels the transaction", async () => {
    const sign = vi.fn(() => Promise.reject(new Error("User cancelled")));
    const walletAPIClient = {
      transaction: {
        sign,
      },
    } as unknown as WalletAPIClient;

    await signTransaction(
      {
        method: EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION,
        params: [...params],
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
      utils.Errors.txDeclined,
    );
  });
});
