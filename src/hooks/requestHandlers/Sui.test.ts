import { SUI_SIGNING_METHODS } from "@/data/methods/Sui.methods";
import {
  buildSignedSuiTransactionHex,
  SUI_SERIALIZED_SIGNATURE,
  SUI_TRANSACTION_BYTES_B64,
} from "@/tests/mocks/sui.mock";
import { hexToBase64 } from "@/utils/cosmos";
import { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleSuiRequest } from "./Sui";
import * as utils from "./utils";

vi.mock("./utils", async (importOriginal) => ({
  ...(await importOriginal<typeof utils>()),
  acceptRequest: vi.fn(),
  rejectRequest: vi.fn(),
}));

const ADDRESS = `0x${"11".repeat(32)}`;
const TESTNET_ADDRESS = `0x${"22".repeat(32)}`;
const OTHER_ADDRESS = `0x${"33".repeat(32)}`;
const PUBKEY_HEX = "01".repeat(32); // raw 32-byte Ed25519 public key
const TRANSACTION_JSON = JSON.stringify({ version: 2, commands: [] });
const SIGNED_HEX = buildSignedSuiTransactionHex(1);

const topic = "topic";
const id = 0;
const chainId = "sui:mainnet";

const accounts = [
  { id: "sui-1", address: ADDRESS, currency: "sui" },
  { id: "sui-2", address: TESTNET_ADDRESS, currency: "sui_testnet" },
  { id: "eth-1", address: "0xabc", currency: "ethereum" },
] as unknown as Account[];

const walletKit = {} as IWalletKit;

function clientWith(overrides: {
  getPublicKey?: ReturnType<typeof vi.fn>;
  signRaw?: ReturnType<typeof vi.fn>;
}) {
  return {
    account: { getPublicKey: overrides.getPublicKey ?? vi.fn() },
    transaction: { signRaw: overrides.signRaw ?? vi.fn() },
  } as unknown as WalletAPIClient & {
    account: { getPublicKey: ReturnType<typeof vi.fn> };
    transaction: { signRaw: ReturnType<typeof vi.fn> };
  };
}

const request = (method: string, params: unknown) =>
  ({ method, params }) as Parameters<typeof handleSuiRequest>[0];

describe("handleSuiRequest", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("sui_getAccounts", () => {
    it("returns the Sui accounts with the public key as base64", async () => {
      const client = clientWith({
        getPublicKey: vi.fn().mockResolvedValue(PUBKEY_HEX),
      });

      await handleSuiRequest(
        request(SUI_SIGNING_METHODS.SUI_GET_ACCOUNTS, undefined),
        topic,
        id,
        chainId,
        accounts,
        client,
        walletKit,
      );

      expect(client.account.getPublicKey).toHaveBeenCalledTimes(2);
      expect(client.account.getPublicKey).not.toHaveBeenCalledWith("eth-1");
      expect(utils.acceptRequest).toHaveBeenCalledWith(walletKit, topic, id, [
        { address: ADDRESS, pubkey: hexToBase64(PUBKEY_HEX) },
        { address: TESTNET_ADDRESS, pubkey: hexToBase64(PUBKEY_HEX) },
      ]);
    });

    it("returns a 32-byte public key", async () => {
      const client = clientWith({
        getPublicKey: vi.fn().mockResolvedValue(PUBKEY_HEX),
      });

      await handleSuiRequest(
        request(SUI_SIGNING_METHODS.SUI_GET_ACCOUNTS, {}),
        topic,
        id,
        chainId,
        accounts,
        client,
        walletKit,
      );

      const [, , , result] = vi.mocked(utils.acceptRequest).mock.calls[0];
      expect(
        Buffer.from((result as { pubkey: string }[])[0].pubkey, "base64"),
      ).toHaveLength(32);
    });

    it("skips an account whose public key cannot be fetched", async () => {
      const client = clientWith({
        getPublicKey: vi
          .fn()
          .mockRejectedValueOnce(new Error("AccountPublicKeyUnavailable"))
          .mockResolvedValueOnce(PUBKEY_HEX),
      });

      await handleSuiRequest(
        request(SUI_SIGNING_METHODS.SUI_GET_ACCOUNTS, undefined),
        topic,
        id,
        chainId,
        accounts,
        client,
        walletKit,
      );

      expect(utils.acceptRequest).toHaveBeenCalledWith(walletKit, topic, id, [
        { address: TESTNET_ADDRESS, pubkey: hexToBase64(PUBKEY_HEX) },
      ]);
    });

    it("skips an account whose public key is empty", async () => {
      const client = clientWith({
        getPublicKey: vi.fn().mockResolvedValue(""),
      });

      await handleSuiRequest(
        request(SUI_SIGNING_METHODS.SUI_GET_ACCOUNTS, undefined),
        topic,
        id,
        chainId,
        accounts,
        client,
        walletKit,
      );

      expect(utils.acceptRequest).toHaveBeenCalledWith(
        walletKit,
        topic,
        id,
        [],
      );
    });
  });

  describe("sui_signTransaction", () => {
    const signRequest = (params: unknown) =>
      request(SUI_SIGNING_METHODS.SUI_SIGN_TRANSACTION, params);

    it("forwards the transaction unchanged without broadcasting and returns the decoded pair", async () => {
      const client = clientWith({
        signRaw: vi
          .fn()
          .mockResolvedValue({ signedTransactionHex: SIGNED_HEX }),
      });

      await handleSuiRequest(
        signRequest({ transaction: TRANSACTION_JSON, address: ADDRESS }),
        topic,
        id,
        chainId,
        accounts,
        client,
        walletKit,
      );

      expect(client.transaction.signRaw).toHaveBeenCalledWith(
        "sui-1",
        TRANSACTION_JSON,
        false,
      );
      expect(utils.acceptRequest).toHaveBeenCalledWith(walletKit, topic, id, {
        transactionBytes: SUI_TRANSACTION_BYTES_B64,
        signature: Buffer.from(SUI_SERIALIZED_SIGNATURE).toString("base64"),
      });
    });

    it("resolves a testnet account from a sui:testnet request", async () => {
      const client = clientWith({
        signRaw: vi
          .fn()
          .mockResolvedValue({ signedTransactionHex: SIGNED_HEX }),
      });

      await handleSuiRequest(
        signRequest({
          transaction: SUI_TRANSACTION_BYTES_B64,
          address: TESTNET_ADDRESS,
        }),
        topic,
        id,
        "sui:testnet",
        accounts,
        client,
        walletKit,
      );

      expect(client.transaction.signRaw).toHaveBeenCalledWith(
        "sui-2",
        SUI_TRANSACTION_BYTES_B64,
        false,
      );
    });

    it("declines an address that is not in the session, without calling the wallet", async () => {
      const client = clientWith({});

      await handleSuiRequest(
        signRequest({ transaction: TRANSACTION_JSON, address: OTHER_ADDRESS }),
        topic,
        id,
        chainId,
        accounts,
        client,
        walletKit,
      );

      expect(client.transaction.signRaw).not.toHaveBeenCalled();
      expect(utils.rejectRequest).toHaveBeenCalledWith(
        walletKit,
        topic,
        id,
        utils.Errors.txDeclined,
      );
    });

    it("declines when the wallet returns no signed transaction", async () => {
      const client = clientWith({
        signRaw: vi.fn().mockResolvedValue({ signedTransactionHex: "" }),
      });

      await handleSuiRequest(
        signRequest({ transaction: TRANSACTION_JSON, address: ADDRESS }),
        topic,
        id,
        chainId,
        accounts,
        client,
        walletKit,
      );

      expect(utils.acceptRequest).not.toHaveBeenCalled();
      expect(utils.rejectRequest).toHaveBeenCalledWith(
        walletKit,
        topic,
        id,
        utils.Errors.txDeclined,
      );
    });

    it("declines when the signed transaction cannot be decoded", async () => {
      const client = clientWith({
        signRaw: vi.fn().mockResolvedValue({ signedTransactionHex: "ff" }),
      });

      await handleSuiRequest(
        signRequest({ transaction: TRANSACTION_JSON, address: ADDRESS }),
        topic,
        id,
        chainId,
        accounts,
        client,
        walletKit,
      );

      expect(utils.acceptRequest).not.toHaveBeenCalled();
      expect(utils.rejectRequest).toHaveBeenCalledWith(
        walletKit,
        topic,
        id,
        utils.Errors.txDeclined,
      );
    });

    it("declines when the user cancels", async () => {
      const cancel = new Error("Canceled by user");
      const client = clientWith({ signRaw: vi.fn().mockRejectedValue(cancel) });
      vi.spyOn(utils, "isCanceledError").mockReturnValueOnce(true);

      await handleSuiRequest(
        signRequest({ transaction: TRANSACTION_JSON, address: ADDRESS }),
        topic,
        id,
        chainId,
        accounts,
        client,
        walletKit,
      );

      expect(utils.rejectRequest).toHaveBeenCalledWith(
        walletKit,
        topic,
        id,
        utils.Errors.txDeclined,
      );
    });

    it("rethrows any other wallet error", async () => {
      const failure = new Error("SuiRawTransactionResolutionFailed");
      const client = clientWith({
        signRaw: vi.fn().mockRejectedValue(failure),
      });

      await expect(
        handleSuiRequest(
          signRequest({ transaction: TRANSACTION_JSON, address: ADDRESS }),
          topic,
          id,
          chainId,
          accounts,
          client,
          walletKit,
        ),
      ).rejects.toBe(failure);
    });

    it("rejects malformed params", async () => {
      await expect(
        handleSuiRequest(
          signRequest({ transaction: "", address: ADDRESS }),
          topic,
          id,
          chainId,
          accounts,
          clientWith({}),
          walletKit,
        ),
      ).rejects.toThrow();
    });
  });

  describe("sui_signAndExecuteTransaction", () => {
    const executeRequest = (params: unknown) =>
      request(SUI_SIGNING_METHODS.SUI_SIGN_AND_EXECUTE_TRANSACTION, params);

    it("broadcasts and returns the digest", async () => {
      const client = clientWith({
        signRaw: vi.fn().mockResolvedValue({ transactionHash: "DIGEST" }),
      });

      await handleSuiRequest(
        executeRequest({ transaction: TRANSACTION_JSON, address: ADDRESS }),
        topic,
        id,
        chainId,
        accounts,
        client,
        walletKit,
      );

      expect(client.transaction.signRaw).toHaveBeenCalledWith(
        "sui-1",
        TRANSACTION_JSON,
        true,
      );
      expect(utils.acceptRequest).toHaveBeenCalledWith(walletKit, topic, id, {
        digest: "DIGEST",
      });
    });

    it("declines an address that is not in the session, without calling the wallet", async () => {
      const client = clientWith({});

      await handleSuiRequest(
        executeRequest({
          transaction: TRANSACTION_JSON,
          address: OTHER_ADDRESS,
        }),
        topic,
        id,
        chainId,
        accounts,
        client,
        walletKit,
      );

      expect(client.transaction.signRaw).not.toHaveBeenCalled();
      expect(utils.rejectRequest).toHaveBeenCalledWith(
        walletKit,
        topic,
        id,
        utils.Errors.txDeclined,
      );
    });

    it("declines when the wallet returns no hash", async () => {
      const client = clientWith({
        signRaw: vi.fn().mockResolvedValue({ transactionHash: "" }),
      });

      await handleSuiRequest(
        executeRequest({ transaction: TRANSACTION_JSON, address: ADDRESS }),
        topic,
        id,
        chainId,
        accounts,
        client,
        walletKit,
      );

      expect(utils.acceptRequest).not.toHaveBeenCalled();
      expect(utils.rejectRequest).toHaveBeenCalledWith(
        walletKit,
        topic,
        id,
        utils.Errors.txDeclined,
      );
    });

    it("declines when the user cancels", async () => {
      const client = clientWith({
        signRaw: vi.fn().mockRejectedValue(new Error("Canceled by user")),
      });
      vi.spyOn(utils, "isCanceledError").mockReturnValueOnce(true);

      await handleSuiRequest(
        executeRequest({ transaction: TRANSACTION_JSON, address: ADDRESS }),
        topic,
        id,
        chainId,
        accounts,
        client,
        walletKit,
      );

      expect(utils.rejectRequest).toHaveBeenCalledWith(
        walletKit,
        topic,
        id,
        utils.Errors.txDeclined,
      );
    });

    it("rethrows a refusal such as a sponsored transaction", async () => {
      const failure = new Error("SuiSponsoredTransactionBroadcastUnsupported");
      const client = clientWith({
        signRaw: vi.fn().mockRejectedValue(failure),
      });

      await expect(
        handleSuiRequest(
          executeRequest({ transaction: TRANSACTION_JSON, address: ADDRESS }),
          topic,
          id,
          chainId,
          accounts,
          client,
          walletKit,
        ),
      ).rejects.toBe(failure);
    });
  });

  describe("sui_signPersonalMessage", () => {
    it("answers 5101 without calling the wallet", async () => {
      const client = clientWith({});

      await handleSuiRequest(
        request(SUI_SIGNING_METHODS.SUI_SIGN_PERSONAL_MESSAGE, {
          message: "hello",
          address: ADDRESS,
        }),
        topic,
        id,
        chainId,
        accounts,
        client,
        walletKit,
      );

      expect(client.account.getPublicKey).not.toHaveBeenCalled();
      expect(client.transaction.signRaw).not.toHaveBeenCalled();
      expect(utils.rejectRequest).toHaveBeenCalledWith(
        walletKit,
        topic,
        id,
        utils.Errors.unsupportedMethods,
        5101,
      );
    });
  });
});
