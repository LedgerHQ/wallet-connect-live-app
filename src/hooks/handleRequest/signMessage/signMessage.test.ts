import { SOLANA_SIGNING_METHODS } from "@/data/methods/Solana.methods";
import { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import { PublicKey } from "@solana/web3.js";
import { vi } from "vitest";
import * as utils from "../utils";
import * as utilsGeneric from "@/utils/generic";
import { signMessage } from "./signMessage";

vi.mock("../../../utils");
vi.mock("@/utils/generic");

describe("Testing sign message on Solana", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw an error when request can not be used to sign message", async () => {
    const request = {
      method: SOLANA_SIGNING_METHODS.SOLANA_SIGNTRANSACTION,
      params: {
        transaction: "some random transaction",
      },
    };

    await expect(
      signMessage(
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
          SOLANA_SIGNING_METHODS.SOLANA_SIGNTRANSACTION +
          " from request can not be used to sign message",
      ),
    );
  });

  it("should reject the sign message request when no account found with the provided address and chain currency", async () => {
    const getAccountWithAddressAndChainIdSpy = vi
      .spyOn(utilsGeneric, "getAccountWithAddressAndChainId")
      .mockImplementationOnce(() => undefined);

    const walletAPIClient = {
      message: {
        sign: vi.fn(),
      },
    } as unknown as WalletAPIClient;

    const walletKit = {} as IWalletKit;
    const topic = "topic";
    const id = 0;
    const request = {
      method: SOLANA_SIGNING_METHODS.SOLANA_SIGNMESSAGE,
      params: {
        message: "hello from Wallet Connect",
        pubkey: PublicKey.unique().toString(),
      },
    };
    const accounts: Account[] = [];

    const acceptRequestSpy = vi.spyOn(utils, "acceptRequest");
    acceptRequestSpy.mockImplementationOnce(() => Promise.resolve());

    const rejectRequestSpy = vi.spyOn(utils, "rejectRequest");
    rejectRequestSpy.mockImplementationOnce(() => Promise.resolve());

    await signMessage(
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
      request.params.pubkey,
      "solana",
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { sign } = walletAPIClient.message;
    expect(sign).not.toHaveBeenCalled();

    expect(acceptRequestSpy).not.toHaveBeenCalled();

    expect(rejectRequestSpy).toHaveBeenCalledTimes(1);
    expect(rejectRequestSpy).toHaveBeenCalledWith(
      walletKit,
      topic,
      id,
      utils.Errors.txDeclined,
    );
  });

  it("should reject the sign message request when sign message from Wallet API client fails", async () => {
    const account = { id: "0" } as Account;
    const getAccountWithAddressAndChainIdSpy = vi
      .spyOn(utilsGeneric, "getAccountWithAddressAndChainId")
      .mockImplementationOnce(() => account);

    const walletAPIClient = {
      message: {
        sign: vi.fn(() => {
          throw new Error("Error from unit test");
        }),
      },
    } as unknown as WalletAPIClient;

    const walletKit = {} as IWalletKit;
    const topic = "topic";
    const id = 0;
    const message = "Hello from Wallet Connect";
    const request = {
      method: SOLANA_SIGNING_METHODS.SOLANA_SIGNMESSAGE,
      params: {
        message: message,
        pubkey: PublicKey.unique().toString(),
      },
    };
    const accounts: Account[] = [];

    const acceptRequestSpy = vi.spyOn(utils, "acceptRequest");
    acceptRequestSpy.mockImplementationOnce(() => Promise.resolve());

    const rejectRequestSpy = vi.spyOn(utils, "rejectRequest");
    rejectRequestSpy.mockImplementationOnce(() => Promise.resolve());

    await signMessage(
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
      request.params.pubkey,
      "solana",
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { sign } = walletAPIClient.message;
    expect(sign).toHaveBeenCalledTimes(1);
    expect(sign).toThrow("Error from unit test");

    expect(acceptRequestSpy).not.toHaveBeenCalled();

    expect(rejectRequestSpy).toHaveBeenCalledTimes(1);
    expect(rejectRequestSpy).toHaveBeenCalledWith(
      walletKit,
      topic,
      id,
      utils.Errors.txDeclined,
    );
  });

  it("should accept the sign message request when sign message from Wallet API client succeed", async () => {
    const account = { id: "0" } as Account;
    const getAccountWithAddressAndChainIdSpy = vi
      .spyOn(utilsGeneric, "getAccountWithAddressAndChainId")
      .mockImplementationOnce(() => account);

    const hexadecimalSignature = "616E792072616E646F6D2076616C7565";
    vi.spyOn(utils, "formatMessage").mockImplementationOnce(
      () => hexadecimalSignature,
    );

    const walletAPIClient = {
      message: {
        sign: vi.fn(() => Promise.resolve(Buffer.from("any random value"))),
      },
    } as unknown as WalletAPIClient;

    const walletKit = {} as IWalletKit;
    const topic = "topic";
    const id = 0;
    const message = "Hello from Wallet Connect";
    const request = {
      method: SOLANA_SIGNING_METHODS.SOLANA_SIGNMESSAGE,
      params: {
        message: message,
        pubkey: PublicKey.unique().toString(),
      },
    };
    const accounts: Account[] = [];

    const acceptRequestSpy = vi.spyOn(utils, "acceptRequest");
    acceptRequestSpy.mockImplementationOnce(() => Promise.resolve());

    const rejectRequestSpy = vi.spyOn(utils, "rejectRequest");
    rejectRequestSpy.mockImplementationOnce(() => Promise.resolve());

    await signMessage(
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
      request.params.pubkey,
      "solana",
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const { sign } = walletAPIClient.message;
    expect(sign).toHaveBeenCalledTimes(1);
    expect(sign).toHaveBeenCalledWith(account.id, Buffer.from(message));

    expect(acceptRequestSpy).toHaveBeenCalled();
    expect(acceptRequestSpy).toHaveBeenCalledWith(
      walletKit,
      topic,
      id,
      expect.objectContaining({
        signature: Buffer.from(hexadecimalSignature, "hex").toString(),
      }),
    );

    expect(rejectRequestSpy).not.toHaveBeenCalled();
  });
});
