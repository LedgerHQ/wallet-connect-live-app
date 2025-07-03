import { SOLANA_SIGNING_METHODS } from "@/data/methods/Solana.methods";
import { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import { vi } from "vitest";
import { handleSolanaRequest } from "./Solana";
import * as signAllTransactionsModule from "./solanaHandlers/signAllTransactions";
import * as signAndSendTransactionModule from "./solanaHandlers/signAndSendTransaction";
import * as signMessageModule from "./solanaHandlers/signMessage";
import * as signTransactionModule from "./solanaHandlers/signTransaction";

vi.mock("./utils");

describe("Testing Solana request handler mapping", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should call sign transaction when request method is solana_signTransaction", async () => {
    const walletAPIClient = {} as WalletAPIClient;
    const walletKit = {} as IWalletKit;
    const topic = "topic";
    const id = 0;
    const request = {
      method: SOLANA_SIGNING_METHODS.SOLANA_SIGN_TRANSACTION,
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
      method: SOLANA_SIGNING_METHODS.SOLANA_SIGN_MESSAGE,
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

  it("should call sign all transactions when request method is solana_signAllTransactions", async () => {
    const walletAPIClient = {} as WalletAPIClient;
    const walletKit = {} as IWalletKit;
    const topic = "topic";
    const id = 0;
    const request = {
      method: SOLANA_SIGNING_METHODS.SOLANA_SIGN_ALL_TRANSACTION,
      params: {
        transactions: ["transaction1", "transaction2"],
      },
    };
    const accounts: Account[] = [];

    const signAllTransactionsSpy = vi.spyOn(
      signAllTransactionsModule,
      "signAllTransactions",
    );
    signAllTransactionsSpy.mockImplementationOnce(() => Promise.resolve());

    await handleSolanaRequest(
      request,
      topic,
      id,
      "any random chain id",
      accounts,
      walletAPIClient,
      walletKit,
    );

    expect(signAllTransactionsSpy).toHaveBeenCalledTimes(1);
    expect(signAllTransactionsSpy).toHaveBeenCalledWith(
      request,
      topic,
      id,
      "any random chain id",
      accounts,
      walletAPIClient,
      walletKit,
    );
  });

  it("should call sign and send transaction when request method is solana_signAndSendTransaction", async () => {
    const walletAPIClient = {} as WalletAPIClient;
    const walletKit = {} as IWalletKit;
    const topic = "topic";
    const id = 0;
    const request = {
      method: SOLANA_SIGNING_METHODS.SOLANA_SIGN_AND_SEND_TRANSACTION,
      params: {
        transaction: "some random transaction",
        sendOptions: {
          skipPreflight: false,
          preflightCommitment: "confirmed" as const,
          maxRetries: 3,
          minContextSlot: 0,
        },
      },
    };
    const accounts: Account[] = [];

    const signAndSendTransactionSpy = vi.spyOn(
      signAndSendTransactionModule,
      "signAndSendTransaction",
    );
    signAndSendTransactionSpy.mockImplementationOnce(() => Promise.resolve());

    await handleSolanaRequest(
      request,
      topic,
      id,
      "any random chain id",
      accounts,
      walletAPIClient,
      walletKit,
    );

    expect(signAndSendTransactionSpy).toHaveBeenCalledTimes(1);
    expect(signAndSendTransactionSpy).toHaveBeenCalledWith(
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
