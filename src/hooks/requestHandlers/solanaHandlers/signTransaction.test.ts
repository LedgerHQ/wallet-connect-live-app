import {
  SOLANA_REQUESTS,
  SOLANA_SIGNING_METHODS,
} from "@/data/methods/Solana.methods";
import { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import base58 from "bs58";
import { vi } from "vitest";
import * as utils from "../utils";
import { signTransaction } from "./signTransaction";

vi.mock("../utils", async (importOriginal) => ({
  ...(await importOriginal()),
  acceptRequest: vi.fn(),
  rejectRequest: vi.fn(),
}));

describe("Testing sign transaction on Solana", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw an error when request can not be used to sign transaction", async () => {
    const request: SOLANA_REQUESTS = {
      method: SOLANA_SIGNING_METHODS.SOLANA_SIGN_MESSAGE,
      params: {
        message: "some random message",
        pubkey: PublicKey.unique().toString(),
      },
    };

    await expect(
      signTransaction(
        request,
        "some random topic",
        0,
        "some random chain id",
        [],
        {} as WalletAPIClient,
        {} as IWalletKit,
      ),
    ).rejects.toEqual(
      new Error(
        "Method " +
          SOLANA_SIGNING_METHODS.SOLANA_SIGN_MESSAGE +
          " from request can not be used to sign transaction",
      ),
    );
  });

  it("should throw the sign transaction request when no account found with the provided address and chain currency", async () => {
    const walletAPIClient = {
      transaction: {
        sign: vi.fn(() => Promise.resolve("any random value")),
      },
    } as unknown as WalletAPIClient;

    const walletKit = {} as IWalletKit;
    const topic = "topic";
    const id = 0;
    const request: SOLANA_REQUESTS = {
      method: SOLANA_SIGNING_METHODS.SOLANA_SIGN_TRANSACTION,
      params: {
        transaction:
          "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQABAzc1rOIrIJkfixB2PGXIAQSzJwuHJA9YroUmtv2PuvSPfowIh2C/3h3dzzLBfyCbgkLuUqrxMfrNiNDqLG0LBvIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH6MCIdgv94d3c8ywX8gm4JC7lKq8TH6zYjQ6ixtCwbyAQICAAEMAgAAAEBCDwAAAAAAAA==",
      },
    };
    const accounts: Account[] = [];

    await expect(
      signTransaction(
        request,
        topic,
        id,
        "any random value",
        accounts,
        walletAPIClient,
        walletKit,
      ),
    ).rejects.toEqual(new Error("No signer found for the current transaction"));

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { sign } = walletAPIClient.transaction;
    expect(sign).not.toHaveBeenCalled();
  });

  it("should throw the sign transaction request when sign and broadcast from Wallet API client fails", async () => {
    const account: Account = {
      id: "2fa370fd-2210-5487-b9c9-bc36971ebc72",
      address: "4iWtrn54zi89sHQv6xHyYwDsrPJvqcSKRJGBLrbErCsx",
      name: "Solana Account",
      currency: "solana",
      blockHeight: 0,
      balance: BigNumber(0),
      spendableBalance: BigNumber(0),
      lastSyncDate: new Date(),
    };

    const walletAPIClient = {
      transaction: {
        sign: vi.fn(() => Promise.reject(new Error("Error from unit test"))),
      },
    } as unknown as WalletAPIClient;

    const walletKit = {} as IWalletKit;
    const topic = "topic";
    const id = 0;
    const request: SOLANA_REQUESTS = {
      method: SOLANA_SIGNING_METHODS.SOLANA_SIGN_TRANSACTION,
      params: {
        transaction:
          "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQABAzc1rOIrIJkfixB2PGXIAQSzJwuHJA9YroUmtv2PuvSPfowIh2C/3h3dzzLBfyCbgkLuUqrxMfrNiNDqLG0LBvIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH6MCIdgv94d3c8ywX8gm4JC7lKq8TH6zYjQ6ixtCwbyAQICAAEMAgAAAEBCDwAAAAAAAA==",
      },
    };
    const accounts: Account[] = [account];

    const rejectRequestSpy = vi.spyOn(utils, "rejectRequest");
    rejectRequestSpy.mockImplementationOnce(() => Promise.resolve());

    await expect(
      signTransaction(
        request,
        topic,
        id,
        "any random value",
        accounts,
        walletAPIClient,
        walletKit,
      ),
    ).rejects.toEqual(new Error("Error from unit test"));

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { sign } = walletAPIClient.transaction;
    expect(sign).toHaveBeenCalledTimes(1);
    expect(sign).toHaveBeenCalledWith(
      account.id,
      expect.objectContaining({
        family: "solana",
        amount: BigNumber(0),
        recipient: "",
        raw: request.params.transaction,
        model: {
          kind: "transfer",
          uiState: {},
        },
      }),
    );

    expect(rejectRequestSpy).not.toHaveBeenCalled();

    rejectRequestSpy.mockReset();
  });

  it("should reject the sign transaction request with userDeclined when sign and broadcast from Wallet API client fails with a specific error", async () => {
    const account: Account = {
      id: "2fa370fd-2210-5487-b9c9-bc36971ebc72",
      address: "4iWtrn54zi89sHQv6xHyYwDsrPJvqcSKRJGBLrbErCsx",
      name: "Solana Account",
      currency: "solana",
      blockHeight: 0,
      balance: BigNumber(0),
      spendableBalance: BigNumber(0),
      lastSyncDate: new Date(),
    };

    const walletAPIClient = {
      transaction: {
        sign: vi.fn(() => Promise.reject(new Error("User cancelled"))),
      },
    } as unknown as WalletAPIClient;

    const walletKit = {} as IWalletKit;
    const topic = "topic";
    const id = 0;
    const request: SOLANA_REQUESTS = {
      method: SOLANA_SIGNING_METHODS.SOLANA_SIGN_TRANSACTION,
      params: {
        transaction:
          "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQABAzc1rOIrIJkfixB2PGXIAQSzJwuHJA9YroUmtv2PuvSPfowIh2C/3h3dzzLBfyCbgkLuUqrxMfrNiNDqLG0LBvIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH6MCIdgv94d3c8ywX8gm4JC7lKq8TH6zYjQ6ixtCwbyAQICAAEMAgAAAEBCDwAAAAAAAA==",
      },
    };
    const accounts: Account[] = [account];

    const rejectRequestSpy = vi.spyOn(utils, "rejectRequest");
    rejectRequestSpy.mockImplementationOnce(() => Promise.resolve());

    await signTransaction(
      request,
      topic,
      id,
      "any random value",
      accounts,
      walletAPIClient,
      walletKit,
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { sign } = walletAPIClient.transaction;
    expect(sign).toHaveBeenCalledTimes(1);
    expect(sign).toHaveBeenCalledWith(
      account.id,
      expect.objectContaining({
        family: "solana",
        amount: BigNumber(0),
        recipient: "",
        raw: request.params.transaction,
        model: {
          kind: "transfer",
          uiState: {},
        },
      }),
    );

    expect(rejectRequestSpy).toHaveBeenCalledTimes(1);
    expect(rejectRequestSpy).toHaveBeenCalledWith(
      walletKit,
      topic,
      id,
      utils.Errors.userDecline,
    );

    rejectRequestSpy.mockReset();
  });

  it("should accept the sign transaction request when sign and broadcast from Wallet API client succeed", async () => {
    const account = {
      id: "2fa370fd-2210-5487-b9c9-bc36971ebc72",
      address: "4iWtrn54zi89sHQv6xHyYwDsrPJvqcSKRJGBLrbErCsx",
      name: "Solana Account",
      currency: "solana",
      blockHeight: 0,
      balance: BigNumber(0),
      spendableBalance: BigNumber(0),
      lastSyncDate: new Date(),
    };

    const signedTransaction =
      "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQGAAQABAzc1rOIrIJkfixB2PGXIAQSzJwuHJA9YroUmtv2PuvSPfowIh2C/3h3dzzLBfyCbgkLuUqrxMfrNiNDqLG0LBvIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH6MCIdgv94d3c8ywX8gm4JC7lKq8TH6zYjQ6ixtCwbyAQICAAEMAgAAAEBCDwAAAAAAAA==";
    const walletAPIClient = {
      transaction: {
        sign: vi.fn(() =>
          Promise.resolve(Buffer.from(signedTransaction, "base64")),
        ),
      },
    } as unknown as WalletAPIClient;

    const walletKit = {} as IWalletKit;
    const topic = "topic";
    const id = 0;
    const request: SOLANA_REQUESTS = {
      method: SOLANA_SIGNING_METHODS.SOLANA_SIGN_TRANSACTION,
      params: {
        transaction:
          "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQABAzc1rOIrIJkfixB2PGXIAQSzJwuHJA9YroUmtv2PuvSPfowIh2C/3h3dzzLBfyCbgkLuUqrxMfrNiNDqLG0LBvIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH6MCIdgv94d3c8ywX8gm4JC7lKq8TH6zYjQ6ixtCwbyAQICAAEMAgAAAEBCDwAAAAAAAA==",
      },
    };
    const accounts: Account[] = [account];

    const acceptRequestSpy = vi.spyOn(utils, "acceptRequest");
    acceptRequestSpy.mockImplementationOnce(() => Promise.resolve());

    await signTransaction(
      request,
      topic,
      id,
      "any random value",
      accounts,
      walletAPIClient,
      walletKit,
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { sign } = walletAPIClient.transaction;
    expect(sign).toHaveBeenCalledTimes(1);
    expect(sign).toHaveBeenCalledWith(
      account.id,
      expect.objectContaining({
        family: "solana",
        amount: BigNumber(0),
        recipient: "",
        raw: request.params.transaction,
        model: {
          kind: "transfer",
          uiState: {},
        },
      }),
    );

    const dummySignature = new Uint8Array(64).fill(1); // 64-byte signature filled with ones
    const result = {
      signature: base58.encode(dummySignature),
      transaction: signedTransaction,
    };

    expect(acceptRequestSpy).toHaveBeenCalledTimes(1);
    expect(acceptRequestSpy).toHaveBeenCalledWith(walletKit, topic, id, result);

    acceptRequestSpy.mockReset();
  });

  it("should throw an error when the provided pubkey does not match the account address", async () => {
    const account: Account = {
      id: "2fa370fd-2210-5487-b9c9-bc36971ebc72",
      address: "4iWtrn54zi89sHQv6xHyYwDsrPJvqcSKRJGBLrbErCsx",
      name: "Solana Account",
      currency: "solana",
      blockHeight: 0,
      balance: BigNumber(0),
      spendableBalance: BigNumber(0),
      lastSyncDate: new Date(),
    };

    const walletAPIClient = {
      transaction: {
        sign: vi.fn(() => Promise.resolve("any random value")),
      },
    } as unknown as WalletAPIClient;

    const walletKit = {} as IWalletKit;
    const topic = "topic";
    const id = 0;

    // Create a different pubkey than the account address
    const differentPubkey = PublicKey.unique().toString();

    const request: SOLANA_REQUESTS = {
      method: SOLANA_SIGNING_METHODS.SOLANA_SIGN_TRANSACTION,
      params: {
        transaction:
          "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQABAzc1rOIrIJkfixB2PGXIAQSzJwuHJA9YroUmtv2PuvSPfowIh2C/3h3dzzLBfyCbgkLuUqrxMfrNiNDqLG0LBvIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH6MCIdgv94d3c8ywX8gm4JC7lKq8TH6zYjQ6ixtCwbyAQICAAEMAgAAAEBCDwAAAAAAAA==",
        pubkey: differentPubkey,
      },
    };
    const accounts: Account[] = [account];

    await expect(
      signTransaction(
        request,
        topic,
        id,
        "any random value",
        accounts,
        walletAPIClient,
        walletKit,
      ),
    ).rejects.toEqual(
      new Error(
        `The provided pubkey ${differentPubkey} does not match the account address ${account.address} found in the transaction`,
      ),
    );

    // Ensure the transaction.sign method is never called when pubkey validation fails
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { sign } = walletAPIClient.transaction;
    expect(sign).not.toHaveBeenCalled();
  });

  it("should successfully sign transaction when the provided pubkey matches the account address", async () => {
    const account = {
      id: "2fa370fd-2210-5487-b9c9-bc36971ebc72",
      address: "4iWtrn54zi89sHQv6xHyYwDsrPJvqcSKRJGBLrbErCsx",
      name: "Solana Account",
      currency: "solana",
      blockHeight: 0,
      balance: BigNumber(0),
      spendableBalance: BigNumber(0),
      lastSyncDate: new Date(),
    };

    const signedTransaction =
      "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQGAAQABAzc1rOIrIJkfixB2PGXIAQSzJwuHJA9YroUmtv2PuvSPfowIh2C/3h3dzzLBfyCbgkLuUqrxMfrNiNDqLG0LBvIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH6MCIdgv94d3c8ywX8gm4JC7lKq8TH6zYjQ6ixtCwbyAQICAAEMAgAAAEBCDwAAAAAAAA==";
    const walletAPIClient = {
      transaction: {
        sign: vi.fn(() =>
          Promise.resolve(Buffer.from(signedTransaction, "base64")),
        ),
      },
    } as unknown as WalletAPIClient;

    const walletKit = {} as IWalletKit;
    const topic = "topic";
    const id = 0;

    const request: SOLANA_REQUESTS = {
      method: SOLANA_SIGNING_METHODS.SOLANA_SIGN_TRANSACTION,
      params: {
        transaction:
          "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAQABAzc1rOIrIJkfixB2PGXIAQSzJwuHJA9YroUmtv2PuvSPfowIh2C/3h3dzzLBfyCbgkLuUqrxMfrNiNDqLG0LBvIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH6MCIdgv94d3c8ywX8gm4JC7lKq8TH6zYjQ6ixtCwbyAQICAAEMAgAAAEBCDwAAAAAAAA==",
        pubkey: account.address, // Use the same address as the account
      },
    };
    const accounts: Account[] = [account];

    const acceptRequestSpy = vi.spyOn(utils, "acceptRequest");
    acceptRequestSpy.mockImplementationOnce(() => Promise.resolve());

    await signTransaction(
      request,
      topic,
      id,
      "any random value",
      accounts,
      walletAPIClient,
      walletKit,
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { sign } = walletAPIClient.transaction;
    expect(sign).toHaveBeenCalledTimes(1);
    expect(sign).toHaveBeenCalledWith(
      account.id,
      expect.objectContaining({
        family: "solana",
        amount: BigNumber(0),
        recipient: "",
        raw: request.params.transaction,
        model: {
          kind: "transfer",
          uiState: {},
        },
      }),
    );

    const dummySignature = new Uint8Array(64).fill(1); // 64-byte signature filled with ones
    const result = {
      signature: base58.encode(dummySignature),
      transaction: signedTransaction,
    };

    expect(acceptRequestSpy).toHaveBeenCalledTimes(1);
    expect(acceptRequestSpy).toHaveBeenCalledWith(walletKit, topic, id, result);

    acceptRequestSpy.mockReset();
  });
});
