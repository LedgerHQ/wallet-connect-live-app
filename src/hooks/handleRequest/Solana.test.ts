import { SOLANA_SIGNING_METHODS } from "@/data/methods/Solana.methods";
import { handleSolanaRequest } from "./Solana";
import { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import { vi } from "vitest";
import * as signTransactionModule from "./signTransaction/signTransaction";
import * as signMessageModule from "./signMessage/signMessage";

vi.mock("./utils");

describe("Testing Solana request handler mapping", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should call sign transaction when request method is solana_signTransaction", async () => {
    const walletAPIClient = {} as WalletAPIClient;
    const walletKit = {} as IWalletKit;
    const topic = "topic";
    const id = 0;
    const request = {
      method: SOLANA_SIGNING_METHODS.SOLANA_SIGNTRANSACTION,
      params: {
        transaction: "some random transaction",
      },
    };
    const accounts: Account[] = [];

    const signTransactionSpy = vi.spyOn(
      signTransactionModule,
      "signTransaction",
    );
    signTransactionSpy.mockImplementationOnce(() => Promise.resolve());

    await handleSolanaRequest(
      request,
      topic,
      id,
      "any random chain id",
      accounts,
      walletAPIClient,
      walletKit,
    );

    expect(signTransactionSpy).toHaveBeenCalledTimes(1);
    expect(signTransactionSpy).toHaveBeenCalledWith(
      request,
      topic,
      id,
      "any random chain id",
      accounts,
      walletAPIClient,
      walletKit,
    );
  });

  it("should call sign message when request method is solana_signMessage", async () => {
    const walletAPIClient = {} as WalletAPIClient;
    const walletKit = {} as IWalletKit;
    const topic = "topic";
    const id = 0;
    const request = {
      method: SOLANA_SIGNING_METHODS.SOLANA_SIGNMESSAGE,
      params: {
        message: "some random message",
        pubkey: "some random public key",
      },
    };
    const accounts: Account[] = [];

    const signMessageSpy = vi.spyOn(signMessageModule, "signMessage");
    signMessageSpy.mockImplementationOnce(() => Promise.resolve());

    await handleSolanaRequest(
      request,
      topic,
      id,
      "any random chain id",
      accounts,
      walletAPIClient,
      walletKit,
    );

    expect(signMessageSpy).toHaveBeenCalledTimes(1);
    expect(signMessageSpy).toHaveBeenCalledWith(
      request,
      topic,
      id,
      "any random chain id",
      accounts,
      walletAPIClient,
      walletKit,
    );
  });
});
