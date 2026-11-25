import type { WalletAPIClient } from "@ledgerhq/wallet-api-client";
import { describe, expect, it, vi } from "vitest";
import {
  cancelSignatureRequests,
  isSignatureRequestCancelledError,
  withSignatureRequestGroup,
} from "../signatureRequestGroup";

function createClient() {
  const transaction = {
    sign: vi.fn().mockResolvedValue("signed"),
    signAndBroadcast: vi.fn().mockResolvedValue("hash"),
    signRaw: vi.fn().mockResolvedValue({}),
  };
  const message = { sign: vi.fn().mockResolvedValue("signature") };
  const bitcoin = { getAddresses: vi.fn() };
  const request = vi.fn().mockResolvedValue({ cancelled: 1 });
  const client = {
    transaction,
    message,
    bitcoin,
    request,
  } as unknown as WalletAPIClient;
  return { client, transaction, message, bitcoin, request };
}

describe("withSignatureRequestGroup", () => {
  it("adds the session topic to the meta of the sign methods", async () => {
    const { client, transaction, message } = createClient();
    const scoped = withSignatureRequestGroup(client, "topic-1");
    const liveTx = { family: "ethereum" } as never;

    await scoped.transaction.sign("account", liveTx);
    await scoped.transaction.signAndBroadcast("account", liveTx, {
      hwAppId: "Ethereum",
    });
    await scoped.transaction.signRaw("account", "raw", true);
    await scoped.message.sign("account", Buffer.from("hello"));

    const meta = { requestGroupId: "topic-1" };
    expect(transaction.sign).toHaveBeenCalledWith(
      "account",
      liveTx,
      undefined,
      meta,
    );
    expect(transaction.signAndBroadcast).toHaveBeenCalledWith(
      "account",
      liveTx,
      { hwAppId: "Ethereum" },
      meta,
    );
    expect(transaction.signRaw).toHaveBeenCalledWith(
      "account",
      "raw",
      true,
      undefined,
      meta,
    );
    expect(message.sign).toHaveBeenCalledWith(
      "account",
      Buffer.from("hello"),
      undefined,
      meta,
    );
  });

  it("keeps the meta the caller already passed", async () => {
    const { client, transaction } = createClient();
    const scoped = withSignatureRequestGroup(client, "topic-1");

    await scoped.transaction.sign("account", {} as never, undefined, {
      partner: "dapp",
    });

    expect(transaction.sign).toHaveBeenCalledWith("account", {}, undefined, {
      partner: "dapp",
      requestGroupId: "topic-1",
    });
  });

  it("leaves the other methods untouched", () => {
    const { client, bitcoin } = createClient();
    const scoped = withSignatureRequestGroup(client, "topic-1");

    void scoped.bitcoin.getAddresses("account", ["payment"]);

    expect(bitcoin.getAddresses).toHaveBeenCalledWith("account", ["payment"]);
  });
});

describe("cancelSignatureRequests", () => {
  it("asks Ledger Wallet to cancel the sign requests of the session", async () => {
    const { client, request } = createClient();

    await expect(cancelSignatureRequests(client, "topic-1")).resolves.toBe(
      true,
    );
    expect(request).toHaveBeenCalledWith("custom.signature.cancel", {
      requestGroupId: "topic-1",
    });
  });

  it("resolves false when Ledger Wallet cannot cancel them", async () => {
    const { client, request } = createClient();
    request.mockRejectedValue(new Error("method not found"));

    await expect(cancelSignatureRequests(client, "topic-1")).resolves.toBe(
      false,
    );
  });
});

describe("isSignatureRequestCancelledError", () => {
  it("recognizes the cancellation error by its name", () => {
    const error = new Error("The Live App cancelled the sign request");
    error.name = "SignatureRequestCancelled";

    expect(isSignatureRequestCancelledError(error)).toBe(true);
    expect(isSignatureRequestCancelledError(new Error("other"))).toBe(false);
    expect(isSignatureRequestCancelledError("SignatureRequestCancelled")).toBe(
      false,
    );
  });
});
