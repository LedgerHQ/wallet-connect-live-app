import { EIP155_SIGNING_METHODS } from "@/data/methods/EIP155Data.methods";
import * as utils from "@/hooks/requestHandlers/utils";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signMessage } from "./signMessage";

vi.mock("@/hooks/requestHandlers/utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/requestHandlers/utils")>()),
  acceptRequest: vi.fn(),
  rejectRequest: vi.fn(),
}));

describe("Testing sign message on EIP155", () => {
  const account = {
    id: "account-id",
    address: "0xAbC123",
    currency: "ethereum",
  } as Account;
  const walletKit = {} as IWalletKit;
  const topic = "topic";
  const id = 0;
  const chainId = "eip155:1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should sign and accept eth_sign requests", async () => {
    const sign = vi.fn(() => Promise.resolve(Buffer.from("abcd", "hex")));
    const walletAPIClient = {
      message: {
        sign,
      },
    } as unknown as WalletAPIClient;

    await signMessage(
      {
        method: EIP155_SIGNING_METHODS.ETH_SIGN,
        params: [account.address, "0x68656c6c6f"],
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
      Buffer.from("68656c6c6f", "hex"),
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

  it("should sign and accept personal_sign requests with the wallet address in the second param", async () => {
    const sign = vi.fn(() => Promise.resolve(Buffer.from("beef", "hex")));
    const walletAPIClient = {
      message: {
        sign,
      },
    } as unknown as WalletAPIClient;

    await signMessage(
      {
        method: EIP155_SIGNING_METHODS.PERSONAL_SIGN,
        params: ["0x68656c6c6f", account.address],
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
      Buffer.from("68656c6c6f", "hex"),
    );
    expect(utils.acceptRequest).toHaveBeenCalledTimes(1);
    expect(utils.acceptRequest).toHaveBeenCalledWith(
      walletKit,
      topic,
      id,
      "0xbeef",
    );
  });

  it("should reject the request when no matching account is found", async () => {
    const sign = vi.fn();
    const walletAPIClient = {
      message: {
        sign,
      },
    } as unknown as WalletAPIClient;

    await signMessage(
      {
        method: EIP155_SIGNING_METHODS.ETH_SIGN,
        params: [account.address, "0x68656c6c6f"],
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
      utils.Errors.userDecline,
    );
  });

  it("should reject the request when the user cancels signing", async () => {
    const sign = vi.fn(() => Promise.reject(new Error("User cancelled")));
    const walletAPIClient = {
      message: {
        sign,
      },
    } as unknown as WalletAPIClient;

    await signMessage(
      {
        method: EIP155_SIGNING_METHODS.ETH_SIGN,
        params: [account.address, "0x68656c6c6f"],
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
      utils.Errors.userDecline,
    );
  });
});
