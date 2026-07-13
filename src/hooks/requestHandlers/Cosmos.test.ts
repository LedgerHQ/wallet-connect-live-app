import { COSMOS_SIGNING_METHODS } from "@/data/methods/Cosmos.methods";
import { hexToBase64 } from "@/utils/cosmos";
import * as utilsGeneric from "@/utils/generic";
import { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleCosmosRequest } from "./Cosmos";
import * as utils from "./utils";

vi.mock("./utils", async (importOriginal) => ({
  ...(await importOriginal<typeof utils>()),
  acceptRequest: vi.fn(),
  rejectRequest: vi.fn(),
}));
vi.mock("@/utils/generic");

const BBN = "bbn1testaccount";
const PUBKEY_HEX = "02" + "ab".repeat(32); // 33-byte compressed secp256k1 pubkey
const SIG_HEX = "cd".repeat(64); // 64-byte r‖s signature
const topic = "topic";
const id = 0;
const chainId = "cosmos:bbn-1";

const signDoc = {
  chain_id: "bbn-1",
  account_number: "1",
  sequence: "0",
  fee: { amount: [{ denom: "ubbn", amount: "500" }], gas: "200000" },
  msgs: [{ type: "cosmos-sdk/MsgSend", value: {} }],
  memo: "",
};

describe("handleCosmosRequest", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("cosmos_getAccounts", () => {
    it("returns only Babylon accounts mapped to {algo, address, pubkey(base64)}", async () => {
      const accounts = [
        { id: "1", address: BBN, currency: "babylon" },
        { id: "2", address: "0xabc", currency: "ethereum" },
      ] as unknown as Account[];

      const getPublicKey = vi.fn().mockResolvedValue(PUBKEY_HEX);
      const client = { account: { getPublicKey } } as unknown as WalletAPIClient;

      const acceptRequestSpy = vi
        .spyOn(utils, "acceptRequest")
        .mockResolvedValueOnce(undefined);

      await handleCosmosRequest(
        { method: COSMOS_SIGNING_METHODS.COSMOS_GET_ACCOUNTS, params: {} },
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
        { algo: "secp256k1", address: BBN, pubkey: hexToBase64(PUBKEY_HEX) },
      ]);
    });

    it("omits accounts whose public key cannot be fetched", async () => {
      const accounts = [
        { id: "1", address: BBN, currency: "babylon" },
      ] as unknown as Account[];

      const getPublicKey = vi.fn().mockRejectedValue(new Error("not implemented"));
      const client = { account: { getPublicKey } } as unknown as WalletAPIClient;

      const acceptRequestSpy = vi
        .spyOn(utils, "acceptRequest")
        .mockResolvedValueOnce(undefined);

      await handleCosmosRequest(
        { method: COSMOS_SIGNING_METHODS.COSMOS_GET_ACCOUNTS, params: {} },
        topic,
        id,
        chainId,
        accounts,
        client,
        {} as IWalletKit,
      );

      expect(acceptRequestSpy).toHaveBeenCalledWith(expect.anything(), topic, id, []);
    });

    it("omits accounts whose public key is empty (synced before LIVE-33211)", async () => {
      const accounts = [
        { id: "1", address: BBN, currency: "babylon" },
      ] as unknown as Account[];

      const getPublicKey = vi.fn().mockResolvedValue("");
      const client = { account: { getPublicKey } } as unknown as WalletAPIClient;

      const acceptRequestSpy = vi
        .spyOn(utils, "acceptRequest")
        .mockResolvedValueOnce(undefined);

      await handleCosmosRequest(
        { method: COSMOS_SIGNING_METHODS.COSMOS_GET_ACCOUNTS, params: {} },
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

  describe("cosmos_signAmino", () => {
    it("signs the amino doc and returns pub_key + base64 signature + echoed signDoc", async () => {
      vi.spyOn(utilsGeneric, "getAccountWithAddressAndChainId").mockReturnValueOnce(
        { id: "acc-1", address: BBN } as Account,
      );
      const getPublicKey = vi.fn().mockResolvedValue(PUBKEY_HEX);
      const signRaw = vi
        .fn()
        .mockResolvedValueOnce({ signedTransactionHex: SIG_HEX });
      const client = {
        account: { getPublicKey },
        transaction: { signRaw },
      } as unknown as WalletAPIClient;

      const acceptRequestSpy = vi
        .spyOn(utils, "acceptRequest")
        .mockResolvedValueOnce(undefined);

      await handleCosmosRequest(
        {
          method: COSMOS_SIGNING_METHODS.COSMOS_SIGN_AMINO,
          params: { signerAddress: BBN, signDoc },
        },
        topic,
        id,
        chainId,
        [],
        client,
        {} as IWalletKit,
      );

      // broadcast=false: the dApp assembles and broadcasts the final tx.
      expect(signRaw).toHaveBeenCalledWith("acc-1", JSON.stringify(signDoc), false);
      expect(acceptRequestSpy).toHaveBeenCalledWith(expect.anything(), topic, id, {
        signature: {
          pub_key: {
            type: "tendermint/PubKeySecp256k1",
            value: hexToBase64(PUBKEY_HEX),
          },
          signature: hexToBase64(SIG_HEX),
        },
        signed: signDoc,
      });
    });

    it("rejects when no matching account is found", async () => {
      vi.spyOn(utilsGeneric, "getAccountWithAddressAndChainId").mockReturnValueOnce(
        undefined,
      );
      const rejectRequestSpy = vi
        .spyOn(utils, "rejectRequest")
        .mockResolvedValueOnce(undefined);

      await handleCosmosRequest(
        {
          method: COSMOS_SIGNING_METHODS.COSMOS_SIGN_AMINO,
          params: { signerAddress: BBN, signDoc },
        },
        topic,
        id,
        chainId,
        [],
        {
          account: { getPublicKey: vi.fn() },
          transaction: { signRaw: vi.fn() },
        } as unknown as WalletAPIClient,
        {} as IWalletKit,
      );

      expect(rejectRequestSpy).toHaveBeenCalledWith(
        expect.anything(),
        topic,
        id,
        utils.Errors.txDeclined,
      );
    });

    it("rejects when the signer account has no persisted public key", async () => {
      vi.spyOn(utilsGeneric, "getAccountWithAddressAndChainId").mockReturnValueOnce(
        { id: "acc-1", address: BBN } as Account,
      );
      const signRaw = vi.fn();
      const client = {
        account: { getPublicKey: vi.fn().mockResolvedValue("") },
        transaction: { signRaw },
      } as unknown as WalletAPIClient;
      const rejectRequestSpy = vi
        .spyOn(utils, "rejectRequest")
        .mockResolvedValueOnce(undefined);

      await handleCosmosRequest(
        {
          method: COSMOS_SIGNING_METHODS.COSMOS_SIGN_AMINO,
          params: { signerAddress: BBN, signDoc },
        },
        topic,
        id,
        chainId,
        [],
        client,
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
        { id: "acc-1", address: BBN } as Account,
      );
      const canceled = Object.assign(new Error("cancelled"), {
        name: "UserRefusedOnDevice",
      });
      const client = {
        account: { getPublicKey: vi.fn().mockResolvedValue(PUBKEY_HEX) },
        transaction: { signRaw: vi.fn().mockRejectedValueOnce(canceled) },
      } as unknown as WalletAPIClient;
      const rejectRequestSpy = vi
        .spyOn(utils, "rejectRequest")
        .mockResolvedValueOnce(undefined);

      await handleCosmosRequest(
        {
          method: COSMOS_SIGNING_METHODS.COSMOS_SIGN_AMINO,
          params: { signerAddress: BBN, signDoc },
        },
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

  it("rejects cosmos_signDirect and other unsupported methods with code 5101", async () => {
    const rejectRequestSpy = vi
      .spyOn(utils, "rejectRequest")
      .mockResolvedValue(undefined);

    await handleCosmosRequest(
      { method: "cosmos_signDirect" } as never,
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
