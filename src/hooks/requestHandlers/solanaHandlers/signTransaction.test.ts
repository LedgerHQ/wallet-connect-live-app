import { SOLANA_SIGNING_METHODS } from "@/data/methods/Solana.methods";
import * as utilsGeneric from "@/utils/generic";
import { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import {
  PublicKey,
  SystemProgram,
  VersionedMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { vi } from "vitest";
import * as utils from "../utils";
import { signTransaction } from "./signTransaction";

vi.mock("../utils");

describe("Testing sign transaction on Solana", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw an error when request can not be used to sign transaction", async () => {
    const request = {
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

  it("should reject the sign transaction request when no account found with the provided address and chain currency", async () => {
    const getAccountWithAddressAndChainIdSpy = vi
      .spyOn(utilsGeneric, "getAccountWithAddressAndChainId")
      .mockImplementationOnce(() => undefined);

    const walletAPIClient = {
      transaction: {
        signAndBroadcast: vi.fn(() => Promise.resolve("any random value")),
      },
    } as unknown as WalletAPIClient;

    const walletKit = {} as IWalletKit;
    const topic = "topic";
    const id = 0;
    const request = {
      method: SOLANA_SIGNING_METHODS.SOLANA_SIGN_TRANSACTION,
      params: {
        transaction: "transaction",
      },
    };
    const accounts: Account[] = [];

    const solanaTransaction = {
      message: {
        staticAccountKeys: [SystemProgram.programId],
        compiledInstructions: [
          {
            programIdIndex: 0,
            accountKeyIndexes: [0],
          },
        ],
        isAccountSigner: (index: number) => index == 0,
      } as unknown as VersionedMessage,
    } as VersionedTransaction;
    const deserializeSpy = vi.spyOn(VersionedTransaction, "deserialize");
    deserializeSpy.mockImplementationOnce(
      (_serializedTransaction: Uint8Array) => solanaTransaction,
    );

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

    expect(deserializeSpy).toHaveBeenCalledTimes(1);
    expect(deserializeSpy).toHaveBeenCalledWith(
      Buffer.from(request.params.transaction, "base64"),
    );

    expect(getAccountWithAddressAndChainIdSpy).toHaveBeenCalledTimes(1);
    expect(getAccountWithAddressAndChainIdSpy).toHaveBeenCalledWith(
      accounts,
      solanaTransaction.message.staticAccountKeys[0].toString(),
      "solana",
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { signAndBroadcast } = walletAPIClient.transaction;
    expect(signAndBroadcast).not.toHaveBeenCalled();

    expect(rejectRequestSpy).toHaveBeenCalledTimes(1);
    expect(rejectRequestSpy).toHaveBeenCalledWith(
      walletKit,
      topic,
      id,
      utils.Errors.txDeclined,
    );
  });

  it("should reject the sign transaction request when sign and broadcast from Wallet API client fails", async () => {
    const account = { id: "0" } as Account;
    const getAccountWithAddressAndChainIdSpy = vi
      .spyOn(utilsGeneric, "getAccountWithAddressAndChainId")
      .mockImplementationOnce(() => account);

    const walletAPIClient = {
      transaction: {
        signAndBroadcast: vi.fn(() => {
          throw new Error("Error from unit test");
        }),
      },
    } as unknown as WalletAPIClient;

    const walletKit = {} as IWalletKit;
    const topic = "topic";
    const id = 0;
    const request = {
      method: SOLANA_SIGNING_METHODS.SOLANA_SIGN_TRANSACTION,
      params: {
        transaction: "transaction",
      },
    };
    const accounts: Account[] = [];

    const solanaTransaction = {
      message: {
        staticAccountKeys: [SystemProgram.programId],
        compiledInstructions: [
          {
            programIdIndex: 0,
            accountKeyIndexes: [0],
          },
        ],
        isAccountSigner: (index: number) => index == 0,
      } as unknown as VersionedMessage,
    } as VersionedTransaction;
    const deserializeSpy = vi.spyOn(VersionedTransaction, "deserialize");
    deserializeSpy.mockImplementationOnce(
      (_serializedTransaction: Uint8Array) => solanaTransaction,
    );

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

    expect(deserializeSpy).toHaveBeenCalledTimes(1);
    expect(deserializeSpy).toHaveBeenCalledWith(
      Buffer.from(request.params.transaction, "base64"),
    );

    expect(getAccountWithAddressAndChainIdSpy).toHaveBeenCalledTimes(1);
    expect(getAccountWithAddressAndChainIdSpy).toHaveBeenCalledWith(
      accounts,
      solanaTransaction.message.staticAccountKeys[0].toString(),
      "solana",
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { signAndBroadcast } = walletAPIClient.transaction;
    expect(signAndBroadcast).toHaveBeenCalledTimes(1);
    expect(signAndBroadcast).toHaveBeenCalledWith(
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
      utils.Errors.txDeclined,
    );
  });

  it("should accept the sign transaction request when sign and broadcast from Wallet API client succeed", async () => {
    const account = { id: "0" } as Account;
    const getAccountWithAddressAndChainIdSpy = vi
      .spyOn(utilsGeneric, "getAccountWithAddressAndChainId")
      .mockImplementationOnce(() => account);

    const hash = "some random hash";
    const walletAPIClient = {
      transaction: {
        signAndBroadcast: vi.fn(() => Promise.resolve(hash)),
      },
    } as unknown as WalletAPIClient;

    const walletKit = {} as IWalletKit;
    const topic = "topic";
    const id = 0;
    const request = {
      method: SOLANA_SIGNING_METHODS.SOLANA_SIGN_TRANSACTION,
      params: {
        transaction: "transaction",
      },
    };
    const accounts: Account[] = [];

    const solanaTransaction = {
      message: {
        staticAccountKeys: [SystemProgram.programId],
        compiledInstructions: [
          {
            programIdIndex: 0,
            accountKeyIndexes: [0],
          },
        ],
        isAccountSigner: (index: number) => index == 0,
      } as unknown as VersionedMessage,
    } as VersionedTransaction;
    const deserializeSpy = vi.spyOn(VersionedTransaction, "deserialize");
    deserializeSpy.mockImplementationOnce(
      (_serializedTransaction: Uint8Array) => solanaTransaction,
    );

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

    expect(getAccountWithAddressAndChainIdSpy).toHaveBeenCalledTimes(1);
    expect(getAccountWithAddressAndChainIdSpy).toHaveBeenCalledWith(
      accounts,
      solanaTransaction.message.staticAccountKeys[0].toString(),
      "solana",
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { signAndBroadcast } = walletAPIClient.transaction;
    expect(signAndBroadcast).toHaveBeenCalledTimes(1);
    expect(signAndBroadcast).toHaveBeenCalledWith(
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

    expect(acceptRequestSpy).toHaveBeenCalledTimes(1);
    expect(acceptRequestSpy).toHaveBeenCalledWith(walletKit, topic, id, hash);
  });
});
