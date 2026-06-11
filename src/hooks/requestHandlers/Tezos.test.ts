import { TEZOS_SIGNING_METHODS } from "@/data/methods/Tezos.methods";
import * as utilsGeneric from "@/utils/generic";
import { encodeTezosSignature } from "@/utils/tezos";
import { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleTezosRequest } from "./Tezos";
import * as utils from "./utils";

vi.mock("./utils", async (importOriginal) => ({
  ...(await importOriginal<typeof utils>()),
  acceptRequest: vi.fn(),
  rejectRequest: vi.fn(),
}));
vi.mock("@/utils/generic");

const TZ1 = "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb";
const topic = "topic";
const id = 0;
const chainId = "tezos:NetXdQprcVkpaWU";

describe("handleTezosRequest", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("tezos_getAccounts", () => {
    it("returns only Tezos accounts mapped to {algo, address, pubkey}", async () => {
      const accounts = [
        { id: "1", address: TZ1, currency: "tezos" },
        { id: "2", address: "bc1xyz", currency: "bitcoin" },
      ] as unknown as Account[];

      const getPublicKey = vi.fn().mockResolvedValue("edpkPubKey");
      const client = { account: { getPublicKey } } as unknown as WalletAPIClient;

      const acceptRequestSpy = vi
        .spyOn(utils, "acceptRequest")
        .mockResolvedValueOnce(undefined);

      await handleTezosRequest(
        { method: TEZOS_SIGNING_METHODS.TEZOS_GET_ACCOUNTS, params: {} },
        topic,
        id,
        chainId,
        accounts,
        client,
        {} as IWalletKit,
      );

      expect(getPublicKey).toHaveBeenCalledTimes(1);
      expect(getPublicKey).toHaveBeenCalledWith("1");
      expect(acceptRequestSpy).toHaveBeenCalledWith(expect.anything(), topic, id, [
        { algo: "ed25519", address: TZ1, pubkey: "edpkPubKey" },
      ]);
    });

    it("omits accounts whose public key cannot be fetched", async () => {
      const accounts = [
        { id: "1", address: TZ1, currency: "tezos" },
      ] as unknown as Account[];

      const getPublicKey = vi.fn().mockRejectedValue(new Error("not implemented"));
      const client = { account: { getPublicKey } } as unknown as WalletAPIClient;

      const acceptRequestSpy = vi
        .spyOn(utils, "acceptRequest")
        .mockResolvedValueOnce(undefined);

      await handleTezosRequest(
        { method: TEZOS_SIGNING_METHODS.TEZOS_GET_ACCOUNTS, params: {} },
        topic,
        id,
        chainId,
        accounts,
        client,
        {} as IWalletKit,
      );

      expect(acceptRequestSpy).toHaveBeenCalledWith(expect.anything(), topic, id, []);
    });
  });

  describe("tezos_send", () => {
    const operations = [
      { kind: "transaction", destination: TZ1, amount: "1000" },
    ];

    it("serializes operations, signs+broadcasts, and returns the operation hash", async () => {
      vi.spyOn(utilsGeneric, "getAccountWithAddressAndChainId").mockReturnValueOnce(
        { id: "acc-1", address: TZ1 } as Account,
      );
      const signRaw = vi
        .fn()
        .mockResolvedValueOnce({ transactionHash: "ooHASH", signedTransactionHex: "03ab" });
      const client = { transaction: { signRaw } } as unknown as WalletAPIClient;

      const acceptRequestSpy = vi
        .spyOn(utils, "acceptRequest")
        .mockResolvedValueOnce(undefined);

      await handleTezosRequest(
        { method: TEZOS_SIGNING_METHODS.TEZOS_SEND, params: { account: TZ1, operations } },
        topic,
        id,
        chainId,
        [],
        client,
        {} as IWalletKit,
      );

      expect(signRaw).toHaveBeenCalledWith("acc-1", JSON.stringify(operations), true);
      expect(acceptRequestSpy).toHaveBeenCalledWith(expect.anything(), topic, id, {
        operationHash: "ooHASH",
      });
    });

    it("rejects when no matching account is found", async () => {
      vi.spyOn(utilsGeneric, "getAccountWithAddressAndChainId").mockReturnValueOnce(
        undefined,
      );
      const rejectRequestSpy = vi
        .spyOn(utils, "rejectRequest")
        .mockResolvedValueOnce(undefined);

      await handleTezosRequest(
        { method: TEZOS_SIGNING_METHODS.TEZOS_SEND, params: { account: TZ1, operations } },
        topic,
        id,
        chainId,
        [],
        { transaction: { signRaw: vi.fn() } } as unknown as WalletAPIClient,
        {} as IWalletKit,
      );

      expect(rejectRequestSpy).toHaveBeenCalledWith(
        expect.anything(),
        topic,
        id,
        utils.Errors.txDeclined,
      );
    });

    it("rejects when the requested account differs only by case", async () => {
      vi.spyOn(utilsGeneric, "getAccountWithAddressAndChainId").mockReturnValueOnce(
        { id: "acc-1", address: TZ1 } as Account,
      );
      const signRaw = vi.fn();
      const rejectRequestSpy = vi
        .spyOn(utils, "rejectRequest")
        .mockResolvedValueOnce(undefined);

      await handleTezosRequest(
        {
          method: TEZOS_SIGNING_METHODS.TEZOS_SEND,
          params: { account: TZ1.toUpperCase(), operations },
        },
        topic,
        id,
        chainId,
        [],
        { transaction: { signRaw } } as unknown as WalletAPIClient,
        {} as IWalletKit,
      );

      expect(signRaw).not.toHaveBeenCalled();
      expect(rejectRequestSpy).toHaveBeenCalledWith(
        expect.anything(),
        topic,
        id,
        utils.Errors.txDeclined,
      );
    });

    it("rejects (does not throw) when the user cancels on device", async () => {
      vi.spyOn(utilsGeneric, "getAccountWithAddressAndChainId").mockReturnValueOnce(
        { id: "acc-1", address: TZ1 } as Account,
      );
      const canceled = Object.assign(new Error("cancelled"), {
        name: "UserRefusedOnDevice",
      });
      const client = {
        transaction: { signRaw: vi.fn().mockRejectedValueOnce(canceled) },
      } as unknown as WalletAPIClient;
      const rejectRequestSpy = vi
        .spyOn(utils, "rejectRequest")
        .mockResolvedValueOnce(undefined);

      await handleTezosRequest(
        { method: TEZOS_SIGNING_METHODS.TEZOS_SEND, params: { account: TZ1, operations } },
        topic,
        id,
        chainId,
        [],
        client,
        {} as IWalletKit,
      );

      expect(rejectRequestSpy).toHaveBeenCalledWith(
        expect.anything(),
        topic,
        id,
        utils.Errors.txDeclined,
      );
    });
  });

  describe("tezos_sign", () => {
    const rawSigHex = "ab".repeat(64); // 64-byte r‖s as hex text
    const payload = "0501020304";

    it("recovers the raw signature from the hex round-trip and base58-encodes it", async () => {
      vi.spyOn(utilsGeneric, "getAccountWithAddressAndChainId").mockReturnValueOnce(
        { id: "acc-1", address: TZ1 } as Account,
      );
      // LL transports the non-0x hex signature as that string's bytes.
      const sign = vi.fn().mockResolvedValueOnce(Buffer.from(rawSigHex));
      const client = { message: { sign } } as unknown as WalletAPIClient;

      const acceptRequestSpy = vi
        .spyOn(utils, "acceptRequest")
        .mockResolvedValueOnce(undefined);

      await handleTezosRequest(
        { method: TEZOS_SIGNING_METHODS.TEZOS_SIGN, params: { account: TZ1, payload } },
        topic,
        id,
        chainId,
        [],
        client,
        {} as IWalletKit,
      );

      expect(sign).toHaveBeenCalledWith("acc-1", Buffer.from(payload, "utf8"));
      expect(acceptRequestSpy).toHaveBeenCalledWith(expect.anything(), topic, id, {
        signature: encodeTezosSignature(Buffer.from(rawSigHex, "hex"), TZ1),
      });
    });

    it("rejects when no matching account is found", async () => {
      vi.spyOn(utilsGeneric, "getAccountWithAddressAndChainId").mockReturnValueOnce(
        undefined,
      );
      const rejectRequestSpy = vi
        .spyOn(utils, "rejectRequest")
        .mockResolvedValueOnce(undefined);

      await handleTezosRequest(
        { method: TEZOS_SIGNING_METHODS.TEZOS_SIGN, params: { account: TZ1, payload } },
        topic,
        id,
        chainId,
        [],
        { message: { sign: vi.fn() } } as unknown as WalletAPIClient,
        {} as IWalletKit,
      );

      expect(rejectRequestSpy).toHaveBeenCalledWith(
        expect.anything(),
        topic,
        id,
        utils.Errors.msgDecline,
      );
    });

    it("rejects when the signature is not 64 raw bytes", async () => {
      vi.spyOn(utilsGeneric, "getAccountWithAddressAndChainId").mockReturnValueOnce(
        { id: "acc-1", address: TZ1 } as Account,
      );
      const sign = vi.fn().mockResolvedValueOnce(Buffer.from("abcd")); // 2 bytes, not 64
      const client = { message: { sign } } as unknown as WalletAPIClient;
      const acceptRequestSpy = vi
        .spyOn(utils, "acceptRequest")
        .mockResolvedValueOnce(undefined);
      const rejectRequestSpy = vi
        .spyOn(utils, "rejectRequest")
        .mockResolvedValueOnce(undefined);

      await handleTezosRequest(
        { method: TEZOS_SIGNING_METHODS.TEZOS_SIGN, params: { account: TZ1, payload } },
        topic,
        id,
        chainId,
        [],
        client,
        {} as IWalletKit,
      );

      expect(acceptRequestSpy).not.toHaveBeenCalled();
      expect(rejectRequestSpy).toHaveBeenCalledWith(
        expect.anything(),
        topic,
        id,
        utils.Errors.msgDecline,
      );
    });

    it("rejects (does not throw) when the user cancels on device", async () => {
      vi.spyOn(utilsGeneric, "getAccountWithAddressAndChainId").mockReturnValueOnce(
        { id: "acc-1", address: TZ1 } as Account,
      );
      const canceled = Object.assign(new Error("cancelled"), {
        name: "UserRefusedOnDevice",
      });
      const client = {
        message: { sign: vi.fn().mockRejectedValueOnce(canceled) },
      } as unknown as WalletAPIClient;
      const rejectRequestSpy = vi
        .spyOn(utils, "rejectRequest")
        .mockResolvedValueOnce(undefined);

      await handleTezosRequest(
        { method: TEZOS_SIGNING_METHODS.TEZOS_SIGN, params: { account: TZ1, payload } },
        topic,
        id,
        chainId,
        [],
        client,
        {} as IWalletKit,
      );

      expect(rejectRequestSpy).toHaveBeenCalledWith(
        expect.anything(),
        topic,
        id,
        utils.Errors.msgDecline,
      );
    });
  });

  it("rejects unsupported methods with code 5101", async () => {
    const rejectRequestSpy = vi
      .spyOn(utils, "rejectRequest")
      .mockResolvedValueOnce(undefined);

    await handleTezosRequest(
      { method: "tezos_unknown" } as never,
      topic,
      id,
      chainId,
      [],
      {} as WalletAPIClient,
      {} as IWalletKit,
    );

    expect(rejectRequestSpy).toHaveBeenCalledWith(
      expect.anything(),
      topic,
      id,
      utils.Errors.unsupportedMethods,
      5101,
    );
  });
});
